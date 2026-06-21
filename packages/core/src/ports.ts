import type { RepoIndex, Finding, Rule, ContextPack } from './entities.js';

/** Abstraction over file system operations — never depend on fs directly */
export interface FileSystemPort {
  readDir(dirPath: string): Promise<string[]>;
  readFile(filePath: string): Promise<string>;
  stat(filePath: string): Promise<{ size: number; isDirectory: boolean }>;
  exists(filePath: string): Promise<boolean>;
  glob(rootPath: string, pattern: string): Promise<string[]>;
}

/**
 * Abstração de escrita em disco — usada por writers de `.legacy-squad/memory/`.
 *
 * Segregada de {@link FileSystemPort} (ISP): consumidores de leitura não herdam
 * capacidade de escrita, e writers não herdam `glob`/`stat` que não usam. A
 * implementação concreta (Node) é plugada na camada externa — ver DA-011.
 */
export interface FileWriterPort {
  /** Garante a existência do diretório, criando os intermediários (recursivo). */
  mkdir(dirPath: string): Promise<void>;
  /** Escreve (sobrescrevendo) o arquivo com o conteúdo dado, em UTF-8. */
  writeFile(filePath: string, content: string): Promise<void>;
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

/** Generates output artifacts (PRS, SDD, MMP) */
export interface OutputGeneratorPort {
  generatePRS(
    repoIndex: RepoIndex,
    findings: Finding[],
    contextPacks: ContextPack[],
    outputDir: string,
  ): Promise<string>;
}
