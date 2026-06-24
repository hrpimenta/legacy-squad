import { describe, it, expect } from 'vitest';
import path from 'node:path';
import type { Finding, FileWriterPort } from '@legacy-squad/core';
import { toPosix } from '@legacy-squad/core';
import { FindingsWriter } from '../src/findings-writer.js';

/**
 * Fake em memória da porta de escrita. Registra cada `writeFile` em `files`
 * (path → conteúdo) e cada `mkdir` em `dirs`, para inspeção nas asserções.
 */
function createMemWriter(): {
  port: FileWriterPort;
  files: Map<string, string>;
  dirs: Set<string>;
} {
  const files = new Map<string, string>();
  const dirs = new Set<string>();
  const port: FileWriterPort = {
    mkdir: async (dirPath) => {
      dirs.add(dirPath);
    },
    writeFile: async (filePath, content) => {
      files.set(filePath, content);
    },
  };
  return { port, files, dirs };
}

/** memoryDir construído com join() — nunca literal POSIX hardcoded (regra de testes). */
const MEMORY_DIR = path.join('proj', '.legacy-squad', 'memory');

/** Caminho esperado de um arquivo dentro de findings/, já em POSIX. */
function findingsFile(file: string): string {
  return toPosix(path.join(MEMORY_DIR, 'findings', file));
}

/** Cria um Finding completo, exigindo apenas id e pillar; o resto tem default. */
function makeFinding(
  over: Partial<Finding> & Pick<Finding, 'id' | 'pillar'>,
): Finding {
  return {
    id: over.id,
    title: over.title ?? `Title ${over.id}`,
    pillar: over.pillar,
    severity: over.severity ?? 'high',
    evidence: over.evidence ?? [{ file: 'src/x.ts', line: 1, snippet: 'snippet' }],
    frameworks: over.frameworks ?? ['OWASP'],
    impact: over.impact ?? 'impact',
    recommendation: over.recommendation ?? 'do the thing',
    priority: over.priority ?? 'P1',
  };
}

describe('FindingsWriter — DA-011: partição por pilar', () => {
  it('(a) gera index.json + um arquivo por pilar com os achados completos', async () => {
    const { port, files } = createMemWriter();
    const findings: Finding[] = [
      makeFinding({ id: 'SEC-001', pillar: 'security', severity: 'critical', priority: 'P0' }),
      makeFinding({ id: 'CQ-001', pillar: 'legacy_code', severity: 'low', priority: 'P3' }),
      makeFinding({ id: 'BR-001', pillar: 'business_rules', severity: 'medium', priority: 'P2' }),
    ];

    await new FindingsWriter(port).write(findings, MEMORY_DIR);

    // index + 3 arquivos de pilar (slugs com hífen)
    expect(files.has(findingsFile('index.json'))).toBe(true);
    expect(files.has(findingsFile('security.json'))).toBe(true);
    expect(files.has(findingsFile('legacy-code.json'))).toBe(true);
    expect(files.has(findingsFile('business-rules.json'))).toBe(true);

    // o conteúdo do pilar é o Finding completo (com evidence)
    const sec = JSON.parse(files.get(findingsFile('security.json'))!) as Finding[];
    expect(sec).toHaveLength(1);
    expect(sec[0]).toEqual(findings[0]);
    expect(sec[0].evidence[0].snippet).toBe('snippet');

    // slug underscore→hífen no nome do arquivo, mas pillar original preservado no conteúdo
    const cq = JSON.parse(files.get(findingsFile('legacy-code.json'))!) as Finding[];
    expect(cq[0].pillar).toBe('legacy_code');
  });

  it('(b) não gera arquivo para pilar sem achados', async () => {
    const { port, files } = createMemWriter();
    const findings: Finding[] = [makeFinding({ id: 'SEC-001', pillar: 'security' })];

    await new FindingsWriter(port).write(findings, MEMORY_DIR);

    expect(files.has(findingsFile('security.json'))).toBe(true);
    for (const absent of [
      'architecture.json',
      'legacy-code.json',
      'business-rules.json',
      'modernization.json',
    ]) {
      expect(files.has(findingsFile(absent)), `não deveria gravar ${absent}`).toBe(false);
    }

    const index = JSON.parse(files.get(findingsFile('index.json'))!) as unknown[];
    expect(index).toHaveLength(1);
  });

  it('(c) index.json contém apenas id, pillar, severity, title, priority', async () => {
    const { port, files } = createMemWriter();
    const findings: Finding[] = [
      makeFinding({ id: 'SEC-001', pillar: 'security' }),
      makeFinding({ id: 'ARC-001', pillar: 'architecture' }),
    ];

    await new FindingsWriter(port).write(findings, MEMORY_DIR);

    const index = JSON.parse(files.get(findingsFile('index.json'))!) as Array<
      Record<string, unknown>
    >;
    expect(index).toHaveLength(findings.length);

    for (const entry of index) {
      expect(Object.keys(entry).sort()).toEqual([
        'id',
        'pillar',
        'priority',
        'severity',
        'title',
      ]);
      expect(entry).not.toHaveProperty('evidence');
      expect(entry).not.toHaveProperty('recommendation');
      expect(entry).not.toHaveProperty('impact');
      expect(entry).not.toHaveProperty('frameworks');
    }

    // valores espelham o finding de origem
    expect(index[0]).toEqual({
      id: 'SEC-001',
      pillar: 'security',
      severity: 'high',
      title: 'Title SEC-001',
      priority: 'P1',
    });
  });

  it('(d) todos os paths de saída são POSIX (sem backslash)', async () => {
    const { port, files, dirs } = createMemWriter();
    const findings: Finding[] = [makeFinding({ id: 'SEC-001', pillar: 'security' })];

    await new FindingsWriter(port).write(findings, MEMORY_DIR);

    for (const key of files.keys()) {
      expect(key.includes('\\'), `path com backslash: ${key}`).toBe(false);
    }
    for (const dir of dirs) {
      expect(dir.includes('\\'), `dir com backslash: ${dir}`).toBe(false);
    }
    // o diretório findings/ foi criado e o index gravado nele
    expect(dirs.has(toPosix(path.join(MEMORY_DIR, 'findings')))).toBe(true);
    expect(files.has(findingsFile('index.json'))).toBe(true);
  });
});
