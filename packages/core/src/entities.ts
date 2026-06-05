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
