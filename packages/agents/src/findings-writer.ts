import path from 'node:path';
import type { Finding, Pillar, FileWriterPort } from '@legacy-squad/core';
import { toPosix } from '@legacy-squad/core';

/** Subdiretório, dentro de memory/, que guarda a partição de findings (DA-011). */
const FINDINGS_DIR = 'findings';
/** Arquivo de entrada (slim) da partição. */
const INDEX_FILE = 'index.json';

/**
 * Entrada slim do `index.json`: só o suficiente para um gerador decidir quais
 * pilares carregar, sem puxar evidência/recomendação/impacto/frameworks (DA-011).
 */
interface FindingIndexEntry {
  readonly id: string;
  readonly pillar: Pillar;
  readonly severity: Finding['severity'];
  readonly title: string;
  readonly priority: Finding['priority'];
}

/**
 * Grava os findings consolidados como uma partição por pilar em
 * `<memoryDir>/findings/`, substituindo o antigo `findings.json` monolítico.
 *
 * Responsabilidade única: serializar e escrever. Não escaneia, não consolida e
 * não conhece `node:fs` — recebe a porta de escrita por injeção (DA-011).
 */
export class FindingsWriter {
  /**
   * @param fs Porta de escrita injetada; implementação concreta na camada externa.
   */
  constructor(private readonly fs: FileWriterPort) {}

  /**
   * Particiona e grava os findings:
   * - `findings/index.json`: lista slim (id, pillar, severity, title, priority);
   * - `findings/<pilar>.json`: findings completos do pilar. Pilar sem achados
   *   não gera arquivo.
   *
   * O `index.json` é sempre gravado (mesmo vazio): é o ponto de entrada que
   * sinaliza a nova estrutura para o `doctor.ts` e para os geradores.
   *
   * @param findings Findings consolidados pelo Compliance Engine.
   * @param memoryDir Caminho de `.legacy-squad/memory` (nativo do SO; normalizado
   *   para POSIX na escrita — ver DA-006).
   * @returns Promise resolvida quando todos os arquivos foram gravados.
   */
  async write(findings: Finding[], memoryDir: string): Promise<void> {
    const findingsDir = toPosix(path.join(memoryDir, FINDINGS_DIR));
    await this.fs.mkdir(findingsDir);

    const index: FindingIndexEntry[] = findings.map((finding) => ({
      id: finding.id,
      pillar: finding.pillar,
      severity: finding.severity,
      title: finding.title,
      priority: finding.priority,
    }));
    await this.fs.writeFile(
      toPosix(path.join(findingsDir, INDEX_FILE)),
      JSON.stringify(index, null, 2),
    );

    for (const [pillar, pillarFindings] of this.groupByPillar(findings)) {
      await this.fs.writeFile(
        toPosix(path.join(findingsDir, this.pillarToFileName(pillar))),
        JSON.stringify(pillarFindings, null, 2),
      );
    }
  }

  /** Agrupa os findings por pilar, preservando a ordem de inserção. */
  private groupByPillar(findings: Finding[]): Map<Pillar, Finding[]> {
    const byPillar = new Map<Pillar, Finding[]>();
    for (const finding of findings) {
      const bucket = byPillar.get(finding.pillar);
      if (bucket) {
        bucket.push(finding);
      } else {
        byPillar.set(finding.pillar, [finding]);
      }
    }
    return byPillar;
  }

  /**
   * Converte o pilar (enum com `_`) no nome do arquivo (com `-`).
   * Ex.: `legacy_code` → `legacy-code.json`.
   */
  private pillarToFileName(pillar: Pillar): string {
    return `${pillar.replace(/_/g, '-')}.json`;
  }
}
