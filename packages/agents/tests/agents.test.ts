import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir, stat, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RepoIndex, Finding, ContextPack } from '@legacy-squad/core';
import { ALL_AGENTS, SECURITY_AGENT } from '../src/agent-definitions.js';
import { PromptBuilder } from '../src/prompt-builder.js';
import { Installer } from '../src/installer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates/claude-commands');

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

describe('Installer — DT-004: gravação na raiz efetiva', () => {
  it('deve escrever .legacy-squad no subdir quando o manifesto está aninhado', async () => {
    // Cenário: zip extraído cria wrapper/inner/package.json e usuário roda
    // o install apontando para wrapper. O framework precisa instalar dentro
    // de inner/ (onde o projeto realmente vive) — não em wrapper/.
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'ls-installer-'));
    const wrapper = path.join(tmpRoot, 'wrapper');
    const inner = path.join(wrapper, 'inner');
    await mkdir(inner, { recursive: true });
    await writeFile(
      path.join(inner, 'package.json'),
      JSON.stringify({ name: 'nested-app', dependencies: { 'react-native': '0.79.5' } }),
      'utf-8',
    );

    // Templates dir mínimo (não importa o conteúdo para esse teste)
    const templates = path.join(tmpRoot, 'templates');
    await mkdir(templates, { recursive: true });
    await writeFile(path.join(templates, 'security.md'), '# stub', 'utf-8');

    const installer = new Installer();
    const result = await installer.install(wrapper, templates);

    expect(result.requestedRoot).toBe(wrapper);
    expect(result.effectiveRoot).toBe(inner);
    expect(result.stackNames).toContain('react-native');

    // .legacy-squad deve estar em inner/, NÃO em wrapper/
    await expect(stat(path.join(inner, '.legacy-squad', 'memory', 'repo-index.json')))
      .resolves.toBeDefined();
    await expect(stat(path.join(wrapper, '.legacy-squad'))).rejects.toThrow();

    // O log de install deve registrar ambos os paths para auditoria
    const logContent = await readFile(
      path.join(inner, '.legacy-squad', 'logs', 'install.log'),
      'utf-8',
    );
    expect(logContent).toContain(`Requested root: ${wrapper}`);
    expect(logContent).toContain(`Effective root:  ${inner}`);

    await rm(tmpRoot, { recursive: true, force: true });
  });

  it('deve escrever na raiz solicitada quando o manifesto já está nela', async () => {
    // Caso normal (não aninhado): comportamento legado preservado.
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'ls-installer-'));
    await writeFile(
      path.join(tmpRoot, 'package.json'),
      JSON.stringify({ name: 'flat-app', dependencies: { express: '^4.0.0' } }),
      'utf-8',
    );

    const templates = path.join(tmpRoot, '__templates');
    await mkdir(templates, { recursive: true });

    const installer = new Installer();
    const result = await installer.install(tmpRoot, templates);

    expect(result.effectiveRoot).toBe(tmpRoot);
    expect(result.requestedRoot).toBe(tmpRoot);
    await expect(stat(path.join(tmpRoot, '.legacy-squad', 'memory', 'repo-index.json')))
      .resolves.toBeDefined();

    await rm(tmpRoot, { recursive: true, force: true });
  });
});

describe('Slash command templates — DT-008: language-agnostic', () => {
  const TEMPLATE_FILES = [
    'security.md',
    'architecture.md',
    'legacy-code.md',
    'business-rules.md',
    'modernization.md',
    'generate-prs.md',
    'scan.md',
  ];

  it('todos os templates esperados existem em templates/claude-commands/', async () => {
    const files = await readdir(TEMPLATES_DIR);
    for (const t of TEMPLATE_FILES) {
      expect(files, `template ausente: ${t}`).toContain(t);
    }
  });

  it.each(['security.md', 'architecture.md', 'legacy-code.md', 'business-rules.md', 'modernization.md'])(
    'template %s deve mencionar pelo menos 3 stacks distintas (multi-language)',
    async (file) => {
      const content = await readFile(path.join(TEMPLATES_DIR, file), 'utf-8');
      const lower = content.toLowerCase();

      // Cada template precisa orientar o agente sobre múltiplas stacks
      // para evitar regressão ao viés mobile-only original.
      const stackHits = [
        /\bphp\b|\blaravel\b|\bsymfony\b/.test(lower),
        /\b\.net\b|\bdotnet\b|\bc#\b|\bcsharp\b|\basp\.net\b/.test(lower),
        /\bjava\b|\bspring\b/.test(lower),
        /\breact[\s-]?native\b|\bexpo\b|\bmobile\b/.test(lower),
        /\bnode\b|\bexpress\b|\bnestjs\b/.test(lower),
      ].filter(Boolean).length;

      expect(stackHits, `${file} cobre apenas ${stackHits} stack(s); precisa de pelo menos 3`).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(['security.md', 'architecture.md', 'legacy-code.md', 'business-rules.md', 'modernization.md'])(
    'template %s deve instruir leitura do repo-index.json',
    async (file) => {
      const content = await readFile(path.join(TEMPLATES_DIR, file), 'utf-8');
      expect(content, `${file} não referencia repo-index.json`).toContain('repo-index.json');
    },
  );

  it.each(['security.md', 'architecture.md', 'legacy-code.md', 'business-rules.md', 'modernization.md'])(
    'template %s deve declarar caminho de output em .legacy-squad/outputs/',
    async (file) => {
      const content = await readFile(path.join(TEMPLATES_DIR, file), 'utf-8');
      expect(content, `${file} não declara output em .legacy-squad/outputs/`).toMatch(
        /\.legacy-squad\/outputs\//,
      );
    },
  );

  it('nenhum template deve hardcodar vocabulário exclusivamente mobile sem fallback', async () => {
    // Bias-check: pega referências mobile-specific que NÃO podem aparecer
    // sozinhas sem o equivalente backend ao lado.
    const MOBILE_ONLY_TERMS = ['AsyncStorage', 'expo-secure-store', 'JS→TS', 'js→ts'];

    for (const file of ['security.md', 'architecture.md', 'legacy-code.md', 'business-rules.md', 'modernization.md']) {
      const content = await readFile(path.join(TEMPLATES_DIR, file), 'utf-8');
      for (const term of MOBILE_ONLY_TERMS) {
        if (content.includes(term)) {
          // Termo mobile presente — exige que pelo menos 1 termo backend apareça também
          const hasBackendBalance =
            /\bPDO\b|\bSqlParameter\b|\bPreparedStatement\b|\bcomposer\b|\bnuget\b|\bmaven\b|\bgradle\b/.test(
              content,
            );
          expect(
            hasBackendBalance,
            `${file} usa "${term}" sem termo backend equivalente — viés mobile`,
          ).toBe(true);
        }
      }
    }
  });
});
