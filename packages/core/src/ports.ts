import type { RepoIndex, Finding, Rule, ContextPack } from './entities.js';

/** Abstraction over file system operations — never depend on fs directly */
export interface FileSystemPort {
  readDir(dirPath: string): Promise<string[]>;
  readFile(filePath: string): Promise<string>;
  stat(filePath: string): Promise<{ size: number; isDirectory: boolean }>;
  exists(filePath: string): Promise<boolean>;
  glob(rootPath: string, pattern: string): Promise<string[]>;
}

/** Scans a repository and produces a RepoIndex */
export interface ScannerPort {
  scan(rootPath: string): Promise<RepoIndex>;
}

/** Evaluates source files against rules and produces findings */
export interface ComplianceEnginePort {
  loadRules(): Rule[];
  evaluate(rootPath: string, repoIndex: RepoIndex): Promise<Finding[]>;
}

/** Builds context packs from a RepoIndex */
export interface ContextManagerPort {
  buildPacks(rootPath: string, repoIndex: RepoIndex): Promise<ContextPack[]>;
}

/** Generates narrative content via LLM or mock */
export interface ProviderPort {
  readonly name: string;
  generate(prompt: string): Promise<string>;
}

/** Generates output artifacts (PRS, SDD, MMP) */
export interface OutputGeneratorPort {
  generatePRS(
    repoIndex: RepoIndex,
    findings: Finding[],
    contextPacks: ContextPack[],
    outputDir: string,
  ): Promise<string>;
}
