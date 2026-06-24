/** Severity levels for findings */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** Priority levels for findings */
export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

/** Pillar categories for assessments */
export type Pillar = 'security' | 'architecture' | 'legacy_code' | 'business_rules' | 'modernization';

/** Stack component types */
export type StackType = 'language' | 'framework' | 'runtime' | 'library' | 'tool';

/** Project types */
export type ProjectType = 'backend' | 'frontend' | 'mobile' | 'fullstack' | 'monorepo';

/** Dependency scopes */
export type DependencyScope = 'runtime' | 'dev';

/** Dependency managers */
export type DependencyManager = 'npm' | 'composer' | 'maven' | 'gradle' | 'pip' | 'pub' | 'nuget' | 'unknown';

/** Detection strategy for rules */
export type DetectionType = 'pattern' | 'filename' | 'dependency' | 'structure';

export interface ProjectInfo {
  readonly name: string;
  readonly type: ProjectType;
  readonly rootPath: string;
  readonly detectedAt: string;
}

export interface StackItem {
  readonly name: string;
  readonly type: StackType;
  readonly version: string;
  readonly source: string;
}

export interface ModuleInfo {
  readonly name: string;
  readonly path: string;
  readonly type: 'module' | 'feature' | 'layer' | 'package';
  readonly filesCount: number;
  readonly summary: string;
}

export interface Entrypoint {
  readonly type: 'http_route' | 'cli' | 'job' | 'screen' | 'component';
  readonly name: string;
  readonly path: string;
  readonly method: string;
}

export interface DependencyItem {
  readonly name: string;
  readonly version: string;
  readonly manager: DependencyManager;
  readonly scope: DependencyScope;
}

export interface Integration {
  readonly type: 'api' | 'database' | 'queue' | 'file' | 'external_service';
  readonly name: string;
  readonly evidence: string;
  readonly path: string;
}

export interface Hotspot {
  readonly path: string;
  readonly reason: 'large_file' | 'duplicated_logic' | 'high_coupling' | 'sensitive_code';
  readonly score: number;
}

export interface RepoIndex {
  readonly project: ProjectInfo;
  readonly stack: ReadonlyArray<StackItem>;
  readonly modules: ReadonlyArray<ModuleInfo>;
  readonly entrypoints: ReadonlyArray<Entrypoint>;
  readonly dependencies: ReadonlyArray<DependencyItem>;
  readonly integrations: ReadonlyArray<Integration>;
  readonly hotspots: ReadonlyArray<Hotspot>;
}

export interface Evidence {
  readonly file: string;
  readonly line: number;
  readonly snippet: string;
}

export interface Finding {
  readonly id: string;
  readonly title: string;
  readonly pillar: Pillar;
  readonly severity: Severity;
  readonly evidence: ReadonlyArray<Evidence>;
  readonly frameworks: ReadonlyArray<string>;
  readonly impact: string;
  readonly recommendation: string;
  readonly priority: Priority;
}

export interface RuleDetection {
  readonly type: DetectionType;
  readonly patterns: ReadonlyArray<string>;
}

export interface Rule {
  readonly id: string;
  readonly title: string;
  readonly category: Pillar;
  readonly severity: Severity;
  readonly appliesTo: ReadonlyArray<string>;
  readonly frameworks: ReadonlyArray<string>;
  readonly detection: RuleDetection;
  readonly impact: string;
  readonly recommendation: string;
}

export interface ContextPack {
  readonly id: string;
  readonly module: string;
  readonly summary: string;
  readonly keyFiles: ReadonlyArray<string>;
  readonly entrypoints: ReadonlyArray<string>;
  readonly dependencies: ReadonlyArray<string>;
  readonly risks: ReadonlyArray<string>;
  readonly tokenEstimate: number;
}

/** Maturity levels per FRAMEWORK_SPECIFICATION §10 (1=Unknown … 6=Continuously Modernized). */
export type MaturityLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Lifecycle phases per FRAMEWORK_SPECIFICATION §3. */
export type LifecyclePhaseId = 'discovery' | 'assessment' | 'design' | 'planning' | 'execution';

/** Status de um passo individual do lifecycle (um assessment ou um gerador de artefato). */
export interface LifecycleStepStatus {
  readonly id: string;
  readonly label: string;
  /** Slash command que executa o passo, ou null quando o passo é o install da CLI. */
  readonly command: string | null;
  readonly done: boolean;
}

/** Agregação dos passos de uma fase, com contagem de concluídos. */
export interface LifecyclePhaseStatus {
  readonly id: LifecyclePhaseId;
  readonly label: string;
  readonly steps: ReadonlyArray<LifecycleStepStatus>;
  readonly doneCount: number;
  readonly totalCount: number;
}

/** Próximo passo recomendado, derivado do primeiro gap na ordem canônica do lifecycle. */
export interface LifecycleNextStep {
  readonly id: string;
  /** Slash command a executar, ou null quando a ação é rodar o install da CLI. */
  readonly command: string | null;
  readonly reason: string;
}

/** Snapshot determinístico do estado do lifecycle de um projeto instrumentado pelo framework. */
export interface LifecycleSnapshot {
  /** Identificação do projeto lida do repo-index; null quando o framework não foi instalado. */
  readonly project: {
    readonly name: string;
    readonly type: string;
    readonly stack: ReadonlyArray<string>;
  } | null;
  /** true quando `.legacy-squad/memory/repo-index.json` existe. */
  readonly installed: boolean;
  readonly findingCount: number;
  readonly maturityLevel: MaturityLevel;
  readonly maturityLabel: string;
  readonly phases: ReadonlyArray<LifecyclePhaseStatus>;
  /** Próximo passo recomendado; null quando o lifecycle V1 está completo (specs geradas). */
  readonly nextStep: LifecycleNextStep | null;
  /** true quando as Execution Specs foram geradas (Level 5 — Modernization Ready). */
  readonly complete: boolean;
}
