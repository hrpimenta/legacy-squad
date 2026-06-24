/**
 * Normaliza separadores de caminho para POSIX (`/`).
 *
 * Toda saída do framework (findings, repo-index, context-packs, paths de
 * evidência) é cross-platform e usa `/`, independentemente do SO — ver DA-006.
 * Centralizado aqui (zero dependências) para reuso entre o Compliance Engine
 * e os writers de `memory/` — ver DA-011.
 *
 * @param p Caminho em formato nativo do SO (pode conter `\` no Windows).
 * @returns O mesmo caminho com todos os separadores convertidos para `/`.
 */
export function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}
