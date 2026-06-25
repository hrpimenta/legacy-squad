import path from 'node:path';
import type {
  FileSystemPort,
  LifecycleNextStep,
  LifecyclePhaseId,
  LifecyclePhaseStatus,
  LifecycleSnapshot,
  LifecycleStepStatus,
  MaturityLevel,
} from '@legacy-squad/core';

/** Caminhos canônicos (relativos POSIX à raiz do projeto) dos artefatos do lifecycle. */
const REPO_INDEX_PATH = '.legacy-squad/memory/repo-index.json';
const FINDINGS_INDEX_PATH = '.legacy-squad/memory/findings/index.json';
const assessmentPath = (slug: string): string =>
  `.legacy-squad/outputs/assessments/${slug}-assessment.md`;
const PRS_PATH = '.legacy-squad/outputs/reports/PRS.md';
const SDD_PATH = '.legacy-squad/outputs/sdd/SDD.md';
const MMP_PATH = '.legacy-squad/outputs/mmp/MMP.md';
const SPECS_PATH = '.legacy-squad/outputs/specs/INDEX.md';

/** Rótulos dos níveis de maturidade — FRAMEWORK_SPECIFICATION §10. */
const MATURITY_LABELS: Record<MaturityLevel, string> = {
  1: 'Unknown',
  2: 'Understood',
  3: 'Assessed',
  4: 'Planned',
  5: 'Modernization Ready',
  6: 'Continuously Modernized',
};

/** Definição estática de um passo do lifecycle. `target` é o arquivo cuja existência marca o passo como concluído. */
interface StepDef {
  readonly id: string;
  readonly label: string;
  readonly command: string | null;
  readonly phase: LifecyclePhaseId;
  readonly target: string;
  readonly reason: string;
}

/**
 * Ordem canônica do lifecycle (FRAMEWORK_SPECIFICATION §3): scan → 5 assessments → PRS → SDD → MMP → Specs.
 * O próximo passo é o primeiro `target` ausente nesta ordem — o que satisfaz, sem regra extra,
 * as dependências duras (SDD←architecture-assessment, MMP←modernization-assessment, Specs←MMP),
 * já que os pré-requisitos sempre aparecem antes na sequência.
 *
 * Os slash commands instalados ficam em subdiretório (`.claude/commands/legacy-squad/<cmd>.md`),
 * o que no Claude Code vira o namespace `/legacy-squad:<cmd>` (validado empiricamente).
 */
const STEPS: ReadonlyArray<StepDef> = [
  {
    id: 'scan',
    label: 'Scan',
    command: null,
    phase: 'discovery',
    target: REPO_INDEX_PATH,
    reason: 'Rode `npx legacy-squad install` para escanear o projeto e gerar o repo-index.',
  },
  {
    id: 'security',
    label: 'Security assessment',
    command: '/legacy-squad:security',
    phase: 'assessment',
    target: assessmentPath('security'),
    reason: 'Inicie os assessments rodando `/legacy-squad:security`.',
  },
  {
    id: 'architecture',
    label: 'Architecture assessment',
    command: '/legacy-squad:architecture',
    phase: 'assessment',
    target: assessmentPath('architecture'),
    reason: 'Rode `/legacy-squad:architecture`.',
  },
  {
    id: 'legacy-code',
    label: 'Legacy code assessment',
    command: '/legacy-squad:legacy-code',
    phase: 'assessment',
    target: assessmentPath('legacy-code'),
    reason: 'Rode `/legacy-squad:legacy-code`.',
  },
  {
    id: 'business-rules',
    label: 'Business rules assessment',
    command: '/legacy-squad:business-rules',
    phase: 'assessment',
    target: assessmentPath('business-rules'),
    reason: 'Rode `/legacy-squad:business-rules`.',
  },
  {
    id: 'modernization',
    label: 'Modernization assessment',
    command: '/legacy-squad:modernization',
    phase: 'assessment',
    target: assessmentPath('modernization'),
    reason: 'Rode `/legacy-squad:modernization`.',
  },
  {
    id: 'generate-prs',
    label: 'PRS',
    command: '/legacy-squad:generate-prs',
    phase: 'assessment',
    target: PRS_PATH,
    reason: 'Consolide o diagnóstico com `/legacy-squad:generate-prs`.',
  },
  {
    id: 'generate-sdd',
    label: 'SDD',
    command: '/legacy-squad:generate-sdd',
    phase: 'design',
    target: SDD_PATH,
    reason: 'Gere o desenho técnico com `/legacy-squad:generate-sdd`.',
  },
  {
    id: 'generate-mmp',
    label: 'MMP',
    command: '/legacy-squad:generate-mmp',
    phase: 'planning',
    target: MMP_PATH,
    reason: 'Gere o plano mestre com `/legacy-squad:generate-mmp`.',
  },
  {
    id: 'generate-specs',
    label: 'Execution Specs',
    command: '/legacy-squad:generate-specs',
    phase: 'execution',
    target: SPECS_PATH,
    reason: 'Decomponha em specs com `/legacy-squad:generate-specs`.',
  },
];

/** Ordem e rótulos das fases do lifecycle — FRAMEWORK_SPECIFICATION §3. */
const PHASE_ORDER: ReadonlyArray<{ id: LifecyclePhaseId; label: string }> = [
  { id: 'discovery', label: 'Discovery' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'design', label: 'Design' },
  { id: 'planning', label: 'Planning' },
  { id: 'execution', label: 'Execution' },
];

/** IDs dos 5 assessments de pilar — usados para derivar o nível "Assessed" (§10). */
const ASSESSMENT_STEP_IDS = [
  'security',
  'architecture',
  'legacy-code',
  'business-rules',
  'modernization',
] as const;

/**
 * Computa o estado do lifecycle de um projeto a partir da existência dos artefatos
 * canônicos. Lê o sistema de arquivos via {@link FileSystemPort} (somente-leitura,
 * injetada — DI/ISP, ver DA-012), sem efeitos colaterais. O cálculo é determinístico:
 * a mesma árvore de arquivos sempre produz o mesmo {@link LifecycleSnapshot}.
 */
export class LifecycleDetector {
  constructor(private readonly fs: FileSystemPort) {}

  /** Detecta e retorna o snapshot determinístico do lifecycle em `projectRoot`. */
  async detect(projectRoot: string): Promise<LifecycleSnapshot> {
    const done = new Map<string, boolean>();
    for (const step of STEPS) {
      done.set(step.id, await this.fs.exists(path.join(projectRoot, step.target)));
    }

    const installed = done.get('scan') === true;
    const project = installed ? await this.readProject(projectRoot) : null;
    const findingCount = installed ? await this.readFindingCount(projectRoot) : 0;
    const maturityLevel = this.computeMaturity(done);

    return {
      project,
      installed,
      findingCount,
      maturityLevel,
      maturityLabel: MATURITY_LABELS[maturityLevel],
      phases: this.buildPhases(done),
      nextStep: this.computeNextStep(done),
      complete: done.get('generate-specs') === true,
    };
  }

  /** Agrupa os passos por fase, calculando a contagem de concluídos. */
  private buildPhases(done: Map<string, boolean>): LifecyclePhaseStatus[] {
    return PHASE_ORDER.map(({ id, label }) => {
      const steps: LifecycleStepStatus[] = STEPS.filter((s) => s.phase === id).map((s) => ({
        id: s.id,
        label: s.label,
        command: s.command,
        done: done.get(s.id) === true,
      }));
      return {
        id,
        label,
        steps,
        doneCount: steps.filter((s) => s.done).length,
        totalCount: steps.length,
      };
    });
  }

  /** Deriva o Maturity Level (§10) a partir dos artefatos presentes. */
  private computeMaturity(done: Map<string, boolean>): MaturityLevel {
    if (done.get('generate-specs')) return 5; // Modernization Ready
    if (done.get('generate-mmp')) return 4; // Planned
    if (ASSESSMENT_STEP_IDS.every((id) => done.get(id))) return 3; // Assessed
    if (done.get('scan')) return 2; // Understood
    return 1; // Unknown
  }

  /** Próximo passo = primeiro `target` ausente na ordem canônica; null se tudo concluído. */
  private computeNextStep(done: Map<string, boolean>): LifecycleNextStep | null {
    const [scanStep] = STEPS;
    if (!done.get('scan')) {
      return { id: 'install', command: null, reason: scanStep.reason };
    }
    for (const step of STEPS) {
      if (!done.get(step.id)) {
        return { id: step.id, command: step.command, reason: step.reason };
      }
    }
    return null;
  }

  /** Lê nome, tipo e stack do repo-index; null se ausente ou ilegível. */
  private async readProject(root: string): Promise<LifecycleSnapshot['project']> {
    try {
      const raw = await this.fs.readFile(path.join(root, REPO_INDEX_PATH));
      const idx = JSON.parse(raw) as {
        project?: { name?: string; type?: string };
        stack?: Array<{ name?: string }>;
      };
      return {
        name: idx.project?.name ?? 'unknown',
        type: idx.project?.type ?? 'unknown',
        stack: (idx.stack ?? []).map((s) => s.name ?? '').filter((n) => n.length > 0),
      };
    } catch {
      return null;
    }
  }

  /** Conta os achados no index slim (DA-011); 0 se ausente ou ilegível. */
  private async readFindingCount(root: string): Promise<number> {
    try {
      const raw = await this.fs.readFile(path.join(root, FINDINGS_INDEX_PATH));
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }
}
