import { describe, it, expect } from 'vitest';
import path from 'node:path';
import type { FileSystemPort } from '@legacy-squad/core';
import { LifecycleDetector } from '../src/lifecycle-detector.js';

const ROOT = '/proj';

// Paths canônicos (relativos POSIX) — devem espelhar exatamente os do detector.
const REPO_INDEX = '.legacy-squad/memory/repo-index.json';
const FINDINGS_INDEX = '.legacy-squad/memory/findings/index.json';
const A = (slug: string) => `.legacy-squad/outputs/assessments/${slug}-assessment.md`;
const PRS = '.legacy-squad/outputs/reports/PRS.md';
const SDD = '.legacy-squad/outputs/sdd/SDD.md';
const MMP = '.legacy-squad/outputs/mmp/MMP.md';
const SPECS = '.legacy-squad/outputs/specs/INDEX.md';

const ALL_ASSESSMENTS = ['security', 'architecture', 'legacy-code', 'business-rules', 'modernization'].map(A);

const repoIndexJson = JSON.stringify({
  project: { name: 'app-beneficiario', type: 'mobile' },
  stack: [{ name: 'react-native' }, { name: 'typescript' }],
});

/**
 * FileSystemPort falso para teste unitário do detector.
 * `presentRelPaths` são paths relativos (POSIX) tratados como existentes;
 * chaves de `files` também contam como existentes e têm conteúdo legível.
 * Tudo é resolvido via path.join para casar com o detector em qualquer OS.
 */
function fakeFs(presentRelPaths: string[], files: Record<string, string> = {}): FileSystemPort {
  const present = new Set(presentRelPaths.map((p) => path.join(ROOT, p)));
  const contents = new Map(Object.entries(files).map(([p, c]) => [path.join(ROOT, p), c]));
  for (const key of contents.keys()) present.add(key);

  return {
    exists: async (p: string) => present.has(p),
    readFile: async (p: string) => {
      const c = contents.get(p);
      if (c === undefined) throw new Error(`ENOENT: ${p}`);
      return c;
    },
    readDir: async () => {
      throw new Error('readDir não é usado pelo LifecycleDetector');
    },
    stat: async () => {
      throw new Error('stat não é usado pelo LifecycleDetector');
    },
    glob: async () => {
      throw new Error('glob não é usado pelo LifecycleDetector');
    },
  };
}

describe('LifecycleDetector — DA-012: state detection determinístico', () => {
  it('projeto não instalado → Level 1, nextStep install, project null', async () => {
    const snap = await new LifecycleDetector(fakeFs([])).detect(ROOT);

    expect(snap.installed).toBe(false);
    expect(snap.project).toBeNull();
    expect(snap.findingCount).toBe(0);
    expect(snap.maturityLevel).toBe(1);
    expect(snap.maturityLabel).toBe('Unknown');
    expect(snap.nextStep).toEqual({ id: 'install', command: null, reason: expect.any(String) });
    expect(snap.complete).toBe(false);
  });

  it('scan-only → Level 2, project preenchido, findingCount lido, próximo = security', async () => {
    const snap = await new LifecycleDetector(
      fakeFs([], {
        [REPO_INDEX]: repoIndexJson,
        [FINDINGS_INDEX]: JSON.stringify([{ id: 'SEC-1' }, { id: 'SEC-2' }, { id: 'ARC-1' }]),
      }),
    ).detect(ROOT);

    expect(snap.installed).toBe(true);
    expect(snap.project).toEqual({
      name: 'app-beneficiario',
      type: 'mobile',
      stack: ['react-native', 'typescript'],
    });
    expect(snap.findingCount).toBe(3);
    expect(snap.maturityLevel).toBe(2);
    expect(snap.maturityLabel).toBe('Understood');
    expect(snap.nextStep?.id).toBe('security');
    expect(snap.nextStep?.command).toBe('/legacy-squad:security');

    const discovery = snap.phases.find((p) => p.id === 'discovery')!;
    expect(discovery.doneCount).toBe(1);
    expect(discovery.totalCount).toBe(1);
  });

  it('assessments parciais (3/5) → próximo = primeiro assessment faltante na ordem', async () => {
    const snap = await new LifecycleDetector(
      fakeFs([A('security'), A('architecture'), A('legacy-code')], { [REPO_INDEX]: repoIndexJson }),
    ).detect(ROOT);

    expect(snap.maturityLevel).toBe(2); // ainda não são os 5 assessments
    expect(snap.nextStep?.id).toBe('business-rules');

    const assessment = snap.phases.find((p) => p.id === 'assessment')!;
    expect(assessment.doneCount).toBe(3);
    expect(assessment.totalCount).toBe(6); // 5 assessments + PRS
  });

  it('5 assessments concluídos sem PRS → Level 3, próximo = generate-prs', async () => {
    const snap = await new LifecycleDetector(
      fakeFs(ALL_ASSESSMENTS, { [REPO_INDEX]: repoIndexJson }),
    ).detect(ROOT);

    expect(snap.maturityLevel).toBe(3);
    expect(snap.maturityLabel).toBe('Assessed');
    expect(snap.nextStep?.id).toBe('generate-prs');
    expect(snap.nextStep?.command).toBe('/legacy-squad:generate-prs');
  });

  it('não sugere generate-mmp enquanto faltar o modernization-assessment (dependência dura)', async () => {
    // tudo menos modernization; SDD gerado fora de ordem; MMP ausente
    const present = [A('security'), A('architecture'), A('legacy-code'), A('business-rules'), PRS, SDD];
    const snap = await new LifecycleDetector(fakeFs(present, { [REPO_INDEX]: repoIndexJson })).detect(ROOT);

    expect(snap.nextStep?.id).toBe('modernization');
    expect(snap.nextStep?.id).not.toBe('generate-mmp');
  });

  it('MMP gerado sem specs → Level 4, próximo = generate-specs', async () => {
    const present = [...ALL_ASSESSMENTS, PRS, SDD, MMP];
    const snap = await new LifecycleDetector(fakeFs(present, { [REPO_INDEX]: repoIndexJson })).detect(ROOT);

    expect(snap.maturityLevel).toBe(4);
    expect(snap.maturityLabel).toBe('Planned');
    expect(snap.nextStep?.id).toBe('generate-specs');
  });

  it('lifecycle completo (specs geradas) → Level 5, nextStep null, complete true', async () => {
    const present = [...ALL_ASSESSMENTS, PRS, SDD, MMP, SPECS];
    const snap = await new LifecycleDetector(fakeFs(present, { [REPO_INDEX]: repoIndexJson })).detect(ROOT);

    expect(snap.maturityLevel).toBe(5);
    expect(snap.maturityLabel).toBe('Modernization Ready');
    expect(snap.nextStep).toBeNull();
    expect(snap.complete).toBe(true);
  });
});
