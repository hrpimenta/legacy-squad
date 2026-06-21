import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NodeFileSystem } from '../src/node-filesystem.js';

describe('NodeFileSystem — FileWriterPort', () => {
  let tmp: string;
  let fs: NodeFileSystem;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(tmpdir(), 'ls-nfs-'));
    fs = new NodeFileSystem();
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it('writeFile grava e readFile retorna o mesmo conteúdo', async () => {
    const file = path.join(tmp, 'out.json');
    await fs.writeFile(file, '{"ok":true}');
    expect(await fs.readFile(file)).toBe('{"ok":true}');
  });

  it('mkdir cria diretório aninhado e é idempotente', async () => {
    const dir = path.join(tmp, 'a', 'b', 'c');
    await fs.mkdir(dir);
    expect((await stat(dir)).isDirectory()).toBe(true);
    await expect(fs.mkdir(dir)).resolves.toBeUndefined();
  });

  it('writeFile em diretório inexistente rejeita', async () => {
    const file = path.join(tmp, 'ghost', 'x.json');
    await expect(fs.writeFile(file, 'x')).rejects.toThrow();
  });
});
