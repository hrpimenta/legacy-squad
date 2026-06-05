import { describe, it, expect } from 'vitest';
import type { RepoIndex, Finding, ContextPack } from '@legacy-squad/core';
import { ALL_AGENTS, SECURITY_AGENT } from '../src/agent-definitions.js';
import { PromptBuilder } from '../src/prompt-builder.js';

function createTestRepoIndex(): RepoIndex {
  return {
    project: { name: 'appcooperado', type: 'mobile', rootPath: '/repo', detectedAt: '' },
    stack: [
      { name: 'react-native', type: 'framework', version: '0.79.5', source: 'package.json' },
      { name: 'expo', type: 'framework', version: '~53.0.20', source: 'package.json' },
      { name: 'typescript', type: 'language', version: '~5.8.3', source: 'package.json' },
    ],
    modules: [
      { name: 'stores', path: 'src/stores', type: 'module', filesCount: 15, summary: 'MobX stores' },
      { name: 'screens', path: 'src/screens', type: 'module', filesCount: 25, summary: 'App screens' },
    ],
    entrypoints: [{ type: 'screen', name: 'login', path: 'src/screens/login/index.tsx', method: 'render' }],
    dependencies: [{ name: 'mobx', version: '6.7.0', manager: 'npm', scope: 'runtime' }],
    integrations: [{ type: 'api', name: 'kong.unimeduberlandia.coop.br', evidence: 'https://kong...', path: 'src/config.prd.ts' }],
    hotspots: [],
  };
}

function createTestFindings(): Finding[] {
  return [
    {
      id: 'SEC-CRED-001',
      title: 'Hardcoded credentials',
      pillar: 'security',
      severity: 'critical',
      evidence: [{ file: 'src/stores/Auth.ts', line: 21, snippet: "password: 'secret'" }],
      frameworks: ['OWASP MASVS V2', 'CWE-798'],
      impact: 'Credentials exposed.',
      recommendation: 'Use secure vault.',
      priority: 'P0',
    },
    {
      id: 'CQ-MIX-001',
      title: 'Mixed JS/TS',
      pillar: 'legacy_code',
      severity: 'low',
      evidence: [{ file: 'src/comps/BackBottom.js', line: 0, snippet: 'JS in TS project' }],
      frameworks: ['Clean Code'],
      impact: 'Reduced type safety.',
      recommendation: 'Migrate to TS.',
      priority: 'P3',
    },
  ];
}

function createTestPacks(): ContextPack[] {
  return [
    {
      id: 'stores.context',
      module: 'stores',
      summary: 'MobX state management',
      keyFiles: ['src/stores/Auth.ts', 'src/stores/ApiStore.js'],
      entrypoints: [],
      dependencies: ['mobx'],
      risks: ['hardcoded credentials'],
      tokenEstimate: 8000,
    },
  ];
}

describe('Agent Definitions', () => {
  it('deve ter 5 agentes cobrindo todos os pilares', () => {
    expect(ALL_AGENTS).toHaveLength(5);
    const pillars = ALL_AGENTS.map((a) => a.pillar);
    expect(pillars).toContain('security');
    expect(pillars).toContain('architecture');
    expect(pillars).toContain('legacy_code');
    expect(pillars).toContain('business_rules');
    expect(pillars).toContain('modernization');
  });

  it('cada agente deve ter ID único', () => {
    const ids = ALL_AGENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada agente deve ter instruções e seções de output', () => {
    for (const agent of ALL_AGENTS) {
      expect(agent.instructions.length).toBeGreaterThan(100);
      expect(agent.outputSections.length).toBeGreaterThan(0);
      expect(agent.frameworks.length).toBeGreaterThan(0);
    }
  });
});

describe('PromptBuilder', () => {
  it('deve gerar 5 prompts (um por agente)', () => {
    const builder = new PromptBuilder();
    const prompts = builder.buildAllPrompts(
      createTestRepoIndex(),
      createTestFindings(),
      createTestPacks(),
    );

    expect(prompts).toHaveLength(5);
  });

  it('prompt de segurança deve incluir findings de segurança', () => {
    const builder = new PromptBuilder();
    const prompt = builder.buildPrompt(
      SECURITY_AGENT,
      createTestRepoIndex(),
      createTestFindings(),
      createTestPacks(),
    );

    expect(prompt.pillar).toBe('security');
    expect(prompt.prompt).toContain('SEC-CRED-001');
    expect(prompt.prompt).toContain('Hardcoded credentials');
    expect(prompt.prompt).toContain('OWASP MASVS');
    expect(prompt.estimatedTokens).toBeGreaterThan(0);
  });

  it('prompt deve incluir contexto do projeto', () => {
    const builder = new PromptBuilder();
    const prompt = builder.buildPrompt(
      SECURITY_AGENT,
      createTestRepoIndex(),
      [],
      createTestPacks(),
    );

    expect(prompt.prompt).toContain('appcooperado');
    expect(prompt.prompt).toContain('react-native');
    expect(prompt.prompt).toContain('mobile');
  });

  it('prompt não deve incluir findings de outro pilar', () => {
    const builder = new PromptBuilder();
    const prompt = builder.buildPrompt(
      SECURITY_AGENT,
      createTestRepoIndex(),
      createTestFindings(),
      createTestPacks(),
    );

    expect(prompt.prompt).not.toContain('CQ-MIX-001');
  });

  it('prompt deve incluir context packs relevantes', () => {
    const builder = new PromptBuilder();
    const prompt = builder.buildPrompt(
      SECURITY_AGENT,
      createTestRepoIndex(),
      [],
      createTestPacks(),
    );

    expect(prompt.prompt).toContain('stores');
    expect(prompt.prompt).toContain('Auth.ts');
  });
});
