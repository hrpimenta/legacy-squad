import { describe, it, expect } from 'vitest';
import type {
  RepoIndex,
  Finding,
  Rule,
  ContextPack,
  FileSystemPort,
  ScannerPort,
  ComplianceEnginePort,
} from '../src/index.js';

describe('Core Domain Entities', () => {
  it('deve criar um RepoIndex válido com todos os campos obrigatórios', () => {
    const repoIndex: RepoIndex = {
      project: {
        name: 'test-app',
        type: 'mobile',
        rootPath: '/tmp/test',
        detectedAt: new Date().toISOString(),
      },
      stack: [
        { name: 'react-native', type: 'framework', version: '0.79.5', source: 'package.json' },
      ],
      modules: [],
      entrypoints: [],
      dependencies: [],
      integrations: [],
      hotspots: [],
    };

    expect(repoIndex.project.name).toBe('test-app');
    expect(repoIndex.project.type).toBe('mobile');
    expect(repoIndex.stack).toHaveLength(1);
  });

  it('deve criar um Finding com evidência rastreável', () => {
    const finding: Finding = {
      id: 'SEC-001',
      title: 'Hardcoded credentials',
      pillar: 'security',
      severity: 'critical',
      evidence: [
        { file: 'src/auth/Auth.ts', line: 12, snippet: "password: 'secret'" },
      ],
      frameworks: ['OWASP MASVS'],
      impact: 'Credentials exposed in source code.',
      recommendation: 'Use environment variables or secure vault.',
      priority: 'P0',
    };

    expect(finding.severity).toBe('critical');
    expect(finding.evidence).toHaveLength(1);
    expect(finding.evidence[0].file).toBe('src/auth/Auth.ts');
  });

  it('deve criar uma Rule com detecção por padrão', () => {
    const rule: Rule = {
      id: 'SEC-CRED-001',
      title: 'Hardcoded password in source',
      category: 'security',
      severity: 'critical',
      appliesTo: ['react-native', 'node', 'mobile'],
      frameworks: ['OWASP MASVS', 'CWE-798'],
      detection: { type: 'pattern', patterns: ['password:\\s*[\'"][^\\s]+[\'"]'] },
      impact: 'Credentials may be extracted from app binary.',
      recommendation: 'Store secrets in environment variables or secure vault.',
    };

    expect(rule.detection.type).toBe('pattern');
    expect(rule.detection.patterns).toHaveLength(1);
    expect(rule.appliesTo).toContain('react-native');
  });

  it('deve criar um ContextPack com estimativa de tokens', () => {
    const pack: ContextPack = {
      id: 'auth.context',
      module: 'auth',
      summary: 'Authentication and session management module.',
      keyFiles: ['src/auth/Auth.ts'],
      entrypoints: ['POST /login'],
      dependencies: ['axios'],
      risks: ['hardcoded credentials'],
      tokenEstimate: 2400,
    };

    expect(pack.tokenEstimate).toBeGreaterThan(0);
    expect(pack.risks).toContain('hardcoded credentials');
  });
});

describe('Core Ports — contratos de interface', () => {
  it('FileSystemPort define operações de leitura', () => {
    const mockFs: FileSystemPort = {
      readDir: async () => ['file.ts'],
      readFile: async () => 'content',
      stat: async () => ({ size: 100, isDirectory: false }),
      exists: async () => true,
      glob: async () => ['src/file.ts'],
    };

    expect(mockFs.readDir).toBeDefined();
    expect(mockFs.readFile).toBeDefined();
    expect(mockFs.stat).toBeDefined();
    expect(mockFs.exists).toBeDefined();
    expect(mockFs.glob).toBeDefined();
  });

  it('ScannerPort define contrato de scan', () => {
    const mockScanner: ScannerPort = {
      scan: async () => ({
        project: { name: 'test', type: 'mobile', rootPath: '/tmp', detectedAt: '' },
        stack: [],
        modules: [],
        entrypoints: [],
        dependencies: [],
        integrations: [],
        hotspots: [],
      }),
    };

    expect(mockScanner.scan).toBeDefined();
  });

  it('ComplianceEnginePort define contrato de avaliação', () => {
    const mockEngine: ComplianceEnginePort = {
      loadRules: () => [],
      evaluate: async () => [],
    };

    expect(mockEngine.loadRules).toBeDefined();
    expect(mockEngine.evaluate).toBeDefined();
  });
});
