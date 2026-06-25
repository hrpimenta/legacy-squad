import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Doctor } from '../src/doctor.js';

describe('Doctor — DA-011: detecção de estrutura de findings', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(tmpdir(), 'ls-doctor-'));
    await mkdir(path.join(tmp, '.legacy-squad', 'memory'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it('findings/index.json presente → check Findings ok', async () => {
    await mkdir(path.join(tmp, '.legacy-squad', 'memory', 'findings'), { recursive: true });
    await writeFile(
      path.join(tmp, '.legacy-squad', 'memory', 'findings', 'index.json'),
      '[]',
      'utf-8',
    );

    const doctor = new Doctor();
    const checks = await doctor.check(tmp);
    const findingsCheck = checks.find((c) => c.name === 'Findings');

    expect(findingsCheck).toBeDefined();
    expect(findingsCheck!.status).toBe('ok');
  });

  it('findings.json legado sem findings/ → check Findings error com mensagem de migração', async () => {
    await writeFile(
      path.join(tmp, '.legacy-squad', 'memory', 'findings.json'),
      '[]',
      'utf-8',
    );

    const doctor = new Doctor();
    const checks = await doctor.check(tmp);
    const findingsCheck = checks.find((c) => c.name === 'Findings');

    expect(findingsCheck).toBeDefined();
    expect(findingsCheck!.status).toBe('error');
    expect(findingsCheck!.message).toContain('legacy-squad install');
    expect(findingsCheck!.message).toContain('migração não é automática');
  });

  it('nenhuma estrutura de findings → check Findings error sem mensagem de migração', async () => {
    const doctor = new Doctor();
    const checks = await doctor.check(tmp);
    const findingsCheck = checks.find((c) => c.name === 'Findings');

    expect(findingsCheck).toBeDefined();
    expect(findingsCheck!.status).toBe('error');
    expect(findingsCheck!.message).not.toContain('legacy-squad install');
  });

  it('DA-012: detecta orchestrator /legacy-squad em .claude/commands/legacy-squad.md', async () => {
    await mkdir(path.join(tmp, '.claude', 'commands'), { recursive: true });
    await writeFile(
      path.join(tmp, '.claude', 'commands', 'legacy-squad.md'),
      '# orchestrator',
      'utf-8',
    );

    const doctor = new Doctor();
    const checks = await doctor.check(tmp);
    const orchestratorCheck = checks.find((c) => c.name === 'Orchestrator /legacy-squad');

    expect(orchestratorCheck).toBeDefined();
    expect(orchestratorCheck!.status).toBe('ok');
  });

  it('DA-012: orchestrator ausente → check error', async () => {
    const doctor = new Doctor();
    const checks = await doctor.check(tmp);
    const orchestratorCheck = checks.find((c) => c.name === 'Orchestrator /legacy-squad');

    expect(orchestratorCheck).toBeDefined();
    expect(orchestratorCheck!.status).toBe('error');
  });
});
