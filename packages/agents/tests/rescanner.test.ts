import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NodeFileSystem } from '@legacy-squad/scanner';
import { Rescanner } from '../src/rescanner.js';

describe('Rescanner — DT-010/DA-013: re-scan consolidado', () => {
  it('grava memory/ completa: repo-index, findings particionado e context-packs (sem findings.json monolítico)', async () => {
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'ls-rescan-'));
    await mkdir(path.join(tmpRoot, 'src'), { recursive: true });
    await writeFile(
      path.join(tmpRoot, 'package.json'),
      JSON.stringify({ name: 'rescan-app', dependencies: { 'react-native': '0.79.5' } }),
      'utf-8',
    );
    // Conteúdo realista (mesmo padrão usado em agents.test.ts) — as assertions
    // não dependem de nenhum finding disparar; index.json é sempre gravado.
    await writeFile(
      path.join(tmpRoot, 'src', 'Auth.ts'),
      "const config = { password: '8wW49oHPq9pC', user: 'admin' };",
      'utf-8',
    );

    const result = await new Rescanner(new NodeFileSystem()).rescan(tmpRoot);

    expect(result.effectiveRoot).toBe(tmpRoot);
    expect(result.requestedRoot).toBe(tmpRoot);
    expect(result.repoIndex.stack.map((s) => s.name)).toContain('react-native');
    expect(Array.isArray(result.findings)).toBe(true);
    expect(Array.isArray(result.contextPacks)).toBe(true);

    const memoryDir = path.join(tmpRoot, '.legacy-squad', 'memory');
    await expect(stat(path.join(memoryDir, 'repo-index.json'))).resolves.toBeDefined();
    await expect(stat(path.join(memoryDir, 'findings', 'index.json'))).resolves.toBeDefined();
    // DA-013 (full): o re-scan grava context-packs.json — antes era exclusivo do install.
    await expect(stat(path.join(memoryDir, 'context-packs.json'))).resolves.toBeDefined();
    // DA-011: nada de findings.json monolítico.
    await expect(stat(path.join(memoryDir, 'findings.json'))).rejects.toThrow();

    await rm(tmpRoot, { recursive: true, force: true });
  });

  it('resolve effectiveRoot aninhado (DT-004) e grava em inner/, não em wrapper/', async () => {
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'ls-rescan-'));
    const wrapper = path.join(tmpRoot, 'wrapper');
    const inner = path.join(wrapper, 'inner');
    await mkdir(inner, { recursive: true });
    await writeFile(
      path.join(inner, 'package.json'),
      JSON.stringify({ name: 'nested-app', dependencies: { 'react-native': '0.79.5' } }),
      'utf-8',
    );

    const result = await new Rescanner(new NodeFileSystem()).rescan(wrapper);

    expect(result.requestedRoot).toBe(wrapper);
    expect(result.effectiveRoot).toBe(inner);
    await expect(stat(path.join(inner, '.legacy-squad', 'memory', 'repo-index.json')))
      .resolves.toBeDefined();
    await expect(stat(path.join(wrapper, '.legacy-squad'))).rejects.toThrow();

    await rm(tmpRoot, { recursive: true, force: true });
  });

  it('RescanResult expõe paths sob effectiveRoot (findingsPath aponta para findings/index.json)', async () => {
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'ls-rescan-'));
    await writeFile(
      path.join(tmpRoot, 'package.json'),
      JSON.stringify({ name: 'paths-app', dependencies: { express: '^4.0.0' } }),
      'utf-8',
    );

    const result = await new Rescanner(new NodeFileSystem()).rescan(tmpRoot);

    expect(result.memoryDir).toBe(path.join(tmpRoot, '.legacy-squad', 'memory'));
    expect(result.repoIndexPath).toBe(path.join(result.memoryDir, 'repo-index.json'));
    expect(result.contextPacksPath).toBe(path.join(result.memoryDir, 'context-packs.json'));
    expect(result.findingsPath).toMatch(/findings[/\\]index\.json$/);

    await rm(tmpRoot, { recursive: true, force: true });
  });
});
