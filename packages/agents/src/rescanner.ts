import path from 'node:path';
import type {
  RepoIndex,
  Finding,
  ContextPack,
  FileSystemPort,
  FileWriterPort,
} from '@legacy-squad/core';
import { RepoScanner } from '@legacy-squad/scanner';
import { ComplianceEngine } from '@legacy-squad/rules';
import { ContextBuilder } from '@legacy-squad/context';
import { FindingsWriter } from './findings-writer.js';

/** Resultado consolidado de um re-scan: dados em memória + paths gravados. */
export interface RescanResult {
  readonly repoIndex: RepoIndex;
  readonly findings: Finding[];
  readonly contextPacks: ContextPack[];
  /** Raiz efetiva resolvida pelo scanner (pode descer 1 nível — DT-004). */
  readonly effectiveRoot: string;
  /** Raiz solicitada pelo chamador, antes da resolução de aninhamento. */
  readonly requestedRoot: string;
  /** Diretório `.legacy-squad/memory` sob a raiz efetiva (OS-native). */
  readonly memoryDir: string;
  readonly repoIndexPath: string;
  /** Caminho de `findings/index.json` (DA-011 — partição slim). */
  readonly findingsPath: string;
  readonly contextPacksPath: string;
}

/**
 * Caso de uso de re-scan: escaneia o repositório, avalia compliance, constrói
 * context packs e grava TODA a `.legacy-squad/memory/`. É a single source of
 * truth do re-scan, compartilhada pelo `Installer` e pelo comando `scan` da CLI
 * (DA-013 — resolve a duplicação DT-010).
 *
 * Responsabilidade única: re-derivar e persistir a `memory/`. Não instala slash
 * commands, não gera config nem cria diretórios de output — isso é do `Installer`.
 */
export class Rescanner {
  /**
   * @param fs Porta de leitura+escrita injetada (DI/ISP). Na camada externa,
   *   `NodeFileSystem` implementa tanto `FileSystemPort` quanto `FileWriterPort`.
   */
  constructor(private readonly fs: FileSystemPort & FileWriterPort) {}

  /**
   * Re-escaneia `projectRoot` e regrava a `memory/`: `repo-index.json`,
   * `findings/` (particionado — DA-011) e `context-packs.json`.
   *
   * @param projectRoot Raiz solicitada. A raiz efetiva pode descer 1 nível se o
   *   manifesto estiver em subdiretório único (DT-004) — ver `effectiveRoot`.
   * @returns Dados re-derivados + os paths gravados.
   */
  async rescan(projectRoot: string): Promise<RescanResult> {
    // 1. Scan — resolve a raiz efetiva (pode diferir de projectRoot — DT-004).
    const repoIndex = await new RepoScanner(this.fs).scan(projectRoot);
    const effectiveRoot = repoIndex.project.rootPath;

    // 2. Compliance + 3. Context packs, ambos sobre a raiz efetiva.
    const findings = await new ComplianceEngine(this.fs).evaluate(effectiveRoot, repoIndex);
    const contextPacks = await new ContextBuilder(this.fs).buildPacks(effectiveRoot, repoIndex);

    // 4. Persiste toda a memory/. `writeFile` exige o diretório-pai existente,
    //    por isso o mkdir vem antes; o FindingsWriter cria o seu próprio findings/.
    const memoryDir = path.join(effectiveRoot, '.legacy-squad', 'memory');
    await this.fs.mkdir(memoryDir);

    const repoIndexPath = path.join(memoryDir, 'repo-index.json');
    const contextPacksPath = path.join(memoryDir, 'context-packs.json');
    const findingsPath = path.join(memoryDir, 'findings', 'index.json');

    await this.fs.writeFile(repoIndexPath, JSON.stringify(repoIndex, null, 2));
    await new FindingsWriter(this.fs).write(findings, memoryDir);
    await this.fs.writeFile(contextPacksPath, JSON.stringify(contextPacks, null, 2));

    return {
      repoIndex,
      findings,
      contextPacks,
      effectiveRoot,
      requestedRoot: projectRoot,
      memoryDir,
      repoIndexPath,
      findingsPath,
      contextPacksPath,
    };
  }
}
