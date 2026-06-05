import { describe, it, expect } from 'vitest';
import type { FileSystemPort, RepoIndex } from '@legacy-squad/core';
import { ComplianceEngine } from '../src/compliance-engine.js';
import { ALL_RULES, SECURITY_RULES } from '../src/rule-catalog.js';

function norm(p: string): string {
  return p.replace(/[\\/]+/g, '/');
}

function createMockFs(files: Record<string, string>): FileSystemPort {
  const normFiles: Record<string, string> = {};
  for (const [k, v] of Object.entries(files)) {
    normFiles[norm(k)] = v;
  }

  return {
    readDir: async () => [],
    readFile: async (filePath: string) => {
      const key = norm(filePath);
      if (normFiles[key] !== undefined) return normFiles[key];
      throw new Error(`File not found: ${filePath}`);
    },
    stat: async (filePath: string) => {
      const key = norm(filePath);
      if (normFiles[key] !== undefined) {
        return { size: normFiles[key].length, isDirectory: false };
      }
      throw new Error(`Not found: ${filePath}`);
    },
    exists: async (filePath: string) => normFiles[norm(filePath)] !== undefined,
    glob: async (_root: string, pattern: string) => {
      const regex = new RegExp(pattern);
      return Object.keys(normFiles).filter((f) => regex.test(f));
    },
  };
}

function createMobileRepoIndex(): RepoIndex {
  return {
    project: { name: 'test-app', type: 'mobile', rootPath: '/repo', detectedAt: '' },
    stack: [
      { name: 'react-native', type: 'framework', version: '0.79.5', source: 'package.json' },
    ],
    modules: [],
    entrypoints: [],
    dependencies: [],
    integrations: [],
    hotspots: [],
  };
}

describe('Rule Catalog', () => {
  it('deve ter regras com IDs únicos', () => {
    const ids = ALL_RULES.map((r) => r.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('deve ter regras de segurança com referência OWASP ou CWE', () => {
    for (const rule of SECURITY_RULES) {
      const hasFramework = rule.frameworks.some(
        (f) => f.includes('OWASP') || f.includes('CWE') || f.includes('LGPD'),
      );
      expect(hasFramework, `Rule ${rule.id} missing OWASP/CWE framework reference`).toBe(true);
    }
  });
});

describe('Compliance Engine', () => {
  it('deve detectar credenciais hardcoded no código', async () => {
    const fs = createMockFs({
      '/repo/src/Auth.ts': `
        const response = await fetch(url, {
          body: JSON.stringify({
            usuario: 'admin',
            password: '8wW49oHPq9pC'
          })
        });
      `,
    });

    const engine = new ComplianceEngine(fs);
    const findings = await engine.evaluate('/repo', createMobileRepoIndex());

    const credFinding = findings.find((f) => f.id === 'SEC-CRED-001');
    expect(credFinding).toBeDefined();
    expect(credFinding!.severity).toBe('critical');
    expect(credFinding!.evidence.length).toBeGreaterThan(0);
    expect(credFinding!.evidence[0].file).toBe('src/Auth.ts');
  });

  it('deve detectar console.log ativo', async () => {
    const fs = createMockFs({
      '/repo/src/Store.ts': `
        console.log('[Store] Token obtido com sucesso');
        console.log('[Store] Erro:', error);
      `,
    });

    const engine = new ComplianceEngine(fs);
    const findings = await engine.evaluate('/repo', createMobileRepoIndex());

    const logFinding = findings.find((f) => f.id === 'SEC-LOG-001');
    expect(logFinding).toBeDefined();
    expect(logFinding!.severity).toBe('medium');
    expect(logFinding!.evidence.length).toBeGreaterThan(0);
  });

  it('deve detectar catch vazio', async () => {
    const fs = createMockFs({
      '/repo/src/Api.ts': `
        try {
          await fetch(url);
        } catch (error) { }
      `,
    });

    const engine = new ComplianceEngine(fs);
    const findings = await engine.evaluate('/repo', createMobileRepoIndex());

    const errFinding = findings.find((f) => f.id === 'SEC-ERR-001');
    expect(errFinding).toBeDefined();
  });

  it('deve detectar uso de CPF em logs/database', async () => {
    const fs = createMockFs({
      '/repo/src/ApiStore.ts': `
        const cpf = store._CPF;
        database().ref('logs/' + cpf).set({ url, data });
      `,
    });

    const engine = new ComplianceEngine(fs);
    const findings = await engine.evaluate('/repo', createMobileRepoIndex());

    const piiFinding = findings.find((f) => f.id === 'SEC-LOG-002');
    expect(piiFinding).toBeDefined();
    expect(piiFinding!.severity).toBe('high');
  });

  it('não deve gerar findings para código limpo', async () => {
    const fs = createMockFs({
      '/repo/src/Clean.ts': `
        export function greet(name: string): string {
          return 'Hello ' + name;
        }
      `,
    });

    const engine = new ComplianceEngine(fs);
    const findings = await engine.evaluate('/repo', createMobileRepoIndex());

    const securityFindings = findings.filter(
      (f) => f.id === 'SEC-CRED-001' || f.id === 'SEC-LOG-001',
    );
    expect(securityFindings).toHaveLength(0);
  });

  it('deve filtrar regras por stack aplicável', () => {
    const engine = new ComplianceEngine(createMockFs({}));
    const rules = engine.loadRules();

    const mobileRules = rules.filter((r) => r.appliesTo.includes('react-native'));
    expect(mobileRules.length).toBeGreaterThan(0);
  });
});
