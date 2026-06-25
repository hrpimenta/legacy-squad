import { describe, it, expect } from 'vitest';
import type {
  LifecycleNextStep,
  LifecyclePhaseId,
  LifecyclePhaseStatus,
  LifecycleSnapshot,
  LifecycleStepStatus,
  MaturityLevel,
} from '@legacy-squad/core';
import { DashboardRenderer } from '../src/dashboard-renderer.js';

// --- Builders mínimos para montar snapshots isolados (sem depender do detector) ---

/** Monta uma fase a partir de tuplas [id, command|'', done]. */
function phase(
  id: LifecyclePhaseId,
  label: string,
  steps: Array<[string, string, boolean]>,
): LifecyclePhaseStatus {
  const built: LifecycleStepStatus[] = steps.map(([sid, cmd, done]) => ({
    id: sid,
    label: sid,
    command: cmd || null,
    done,
  }));
  return {
    id,
    label,
    steps: built,
    doneCount: built.filter((s) => s.done).length,
    totalCount: built.length,
  };
}

function snap(o: {
  project?: LifecycleSnapshot['project'];
  findingCount?: number;
  maturityLevel: MaturityLevel;
  maturityLabel: string;
  phases: LifecyclePhaseStatus[];
  nextStep: LifecycleNextStep | null;
  complete?: boolean;
}): LifecycleSnapshot {
  return {
    project: o.project ?? null,
    installed: o.project != null,
    findingCount: o.findingCount ?? 0,
    maturityLevel: o.maturityLevel,
    maturityLabel: o.maturityLabel,
    phases: o.phases,
    nextStep: o.nextStep,
    complete: o.complete ?? false,
  };
}

const PROJECT = { name: 'app-beneficiario', type: 'mobile', stack: ['react-native', 'typescript'] };

function assessmentPhase(doneIds: string[]): LifecyclePhaseStatus {
  const all: Array<[string, string]> = [
    ['security', '/legacy-squad:security'],
    ['architecture', '/legacy-squad:architecture'],
    ['legacy-code', '/legacy-squad:legacy-code'],
    ['business-rules', '/legacy-squad:business-rules'],
    ['modernization', '/legacy-squad:modernization'],
    ['generate-prs', '/legacy-squad:generate-prs'],
  ];
  return phase(
    'assessment',
    'Assessment',
    all.map(([id, cmd]) => [id, cmd, doneIds.includes(id)]),
  );
}

const renderer = new DashboardRenderer();

describe('DashboardRenderer — DA-012: render do lifecycle dashboard', () => {
  it('scan-only: cabeçalho com projeto/stack, maturity, findings e próximo passo (formato hífen)', () => {
    const out = renderer.render(
      snap({
        project: PROJECT,
        findingCount: 50,
        maturityLevel: 2,
        maturityLabel: 'Understood',
        phases: [
          phase('discovery', 'Discovery', [['scan', '', true]]),
          assessmentPhase([]),
          phase('design', 'Design', [['generate-sdd', '/legacy-squad:generate-sdd', false]]),
          phase('planning', 'Planning', [['generate-mmp', '/legacy-squad:generate-mmp', false]]),
          phase('execution', 'Execution', [['generate-specs', '/legacy-squad:generate-specs', false]]),
        ],
        nextStep: {
          id: 'security',
          command: '/legacy-squad:security',
          reason: 'Inicie os assessments rodando `/legacy-squad:security`.',
        },
      }),
    );

    expect(out).toContain('app-beneficiario');
    expect(out).toContain('react-native');
    expect(out).toContain('Level 2 — Understood');
    expect(out).toMatch(/Findings\s+50/);
    expect(out).toContain('→ Próximo passo: /legacy-squad:security');
    expect(out).not.toContain('/legacy-squad-'); // garante que não vazou o formato com hífen
  });

  it('fase parcial usa ◐ e contador correto; fase completa usa ✓', () => {
    const out = renderer.render(
      snap({
        project: PROJECT,
        findingCount: 50,
        maturityLevel: 2,
        maturityLabel: 'Understood',
        phases: [
          phase('discovery', 'Discovery', [['scan', '', true]]),
          assessmentPhase(['security', 'architecture', 'legacy-code']), // 3/6
          phase('design', 'Design', [['generate-sdd', '/legacy-squad:generate-sdd', false]]),
          phase('planning', 'Planning', [['generate-mmp', '/legacy-squad:generate-mmp', false]]),
          phase('execution', 'Execution', [['generate-specs', '/legacy-squad:generate-specs', false]]),
        ],
        nextStep: {
          id: 'business-rules',
          command: '/legacy-squad:business-rules',
          reason: 'Rode `/legacy-squad:business-rules`.',
        },
      }),
    );

    expect(out).toContain('✓ Discovery');
    expect(out).toContain('◐ Assessment');
    expect(out).toContain('3/6');
  });

  it('lifecycle completo: mostra Level 5 e mensagem de conclusão, sem próximo passo', () => {
    const done = ['security', 'architecture', 'legacy-code', 'business-rules', 'modernization', 'generate-prs'];
    const out = renderer.render(
      snap({
        project: PROJECT,
        findingCount: 50,
        maturityLevel: 5,
        maturityLabel: 'Modernization Ready',
        phases: [
          phase('discovery', 'Discovery', [['scan', '', true]]),
          assessmentPhase(done),
          phase('design', 'Design', [['generate-sdd', '/legacy-squad:generate-sdd', true]]),
          phase('planning', 'Planning', [['generate-mmp', '/legacy-squad:generate-mmp', true]]),
          phase('execution', 'Execution', [['generate-specs', '/legacy-squad:generate-specs', true]]),
        ],
        nextStep: null,
        complete: true,
      }),
    );

    expect(out).toContain('Level 5 — Modernization Ready');
    expect(out).toContain('Lifecycle V1 completo');
    expect(out).not.toContain('Próximo passo');
  });

  it('não instalado: orienta o install e não quebra sem projeto', () => {
    const notDone: Array<[string, string, boolean]> = [['scan', '', false]];
    const out = renderer.render(
      snap({
        project: null,
        maturityLevel: 1,
        maturityLabel: 'Unknown',
        phases: [
          phase('discovery', 'Discovery', notDone),
          assessmentPhase([]),
          phase('design', 'Design', [['generate-sdd', '/legacy-squad:generate-sdd', false]]),
          phase('planning', 'Planning', [['generate-mmp', '/legacy-squad:generate-mmp', false]]),
          phase('execution', 'Execution', [['generate-specs', '/legacy-squad:generate-specs', false]]),
        ],
        nextStep: {
          id: 'install',
          command: null,
          reason: 'Rode `npx legacy-squad install` para escanear o projeto e gerar o repo-index.',
        },
      }),
    );

    expect(out).toContain('não instalado');
    expect(out).toContain('npx legacy-squad install');
  });
});
