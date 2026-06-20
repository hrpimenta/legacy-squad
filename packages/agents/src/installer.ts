import { writeFile, mkdir, readFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { NodeFileSystem, RepoScanner } from '@legacy-squad/scanner';
import { ContextBuilder } from '@legacy-squad/context';
import { ComplianceEngine } from '@legacy-squad/rules';
import { ALL_AGENTS } from './agent-definitions.js';

export interface InstallResult {
  repoIndexPath: string;
  findingsPath: string;
  contextPacksPath: string;
  agentCount: number;
  findingCount: number;
  stackNames: string[];
  moduleCount: number;
  dependencyCount: number;
  /** Raiz efetiva onde o framework foi escrito (pode diferir do path solicitado — DT-004). */
  effectiveRoot: string;
  /** Raiz solicitada pelo usuário via --path. */
  requestedRoot: string;
}

export class Installer {
  /**
   * Instala o Legacy Squad Framework dentro do projeto alvo.
   * Escaneia o repo, gera dados, instala agentes como slash commands.
   *
   * DT-004: Se o manifesto estiver em subdiretório único (zip aninhado),
   * o scanner resolve o `effectiveRoot` automaticamente — o installer
   * escreve toda a estrutura nesse effective root, não no path original.
   */
  async install(projectRoot: string, templateDir: string): Promise<InstallResult> {
    const fs = new NodeFileSystem();

    // Step 1: Scan — determina effectiveRoot (pode diferir de projectRoot)
    const scanner = new RepoScanner(fs);
    const repoIndex = await scanner.scan(projectRoot);
    const effectiveRoot = repoIndex.project.rootPath;

    // Step 2: Compliance Engine
    const compliance = new ComplianceEngine(fs);
    const findings = await compliance.evaluate(effectiveRoot, repoIndex);

    // Step 3: Context Packs
    const contextBuilder = new ContextBuilder(fs);
    const contextPacks = await contextBuilder.buildPacks(effectiveRoot, repoIndex);

    // Step 4: Write .legacy-squad/memory/
    const memoryDir = path.join(effectiveRoot, '.legacy-squad', 'memory');
    await mkdir(memoryDir, { recursive: true });

    const repoIndexPath = path.join(memoryDir, 'repo-index.json');
    const findingsPath = path.join(memoryDir, 'findings.json');
    const contextPacksPath = path.join(memoryDir, 'context-packs.json');

    await writeFile(repoIndexPath, JSON.stringify(repoIndex, null, 2), 'utf-8');
    await writeFile(findingsPath, JSON.stringify(findings, null, 2), 'utf-8');
    await writeFile(contextPacksPath, JSON.stringify(contextPacks, null, 2), 'utf-8');

    // Step 5: Write .legacy-squad/config/
    const configDir = path.join(effectiveRoot, '.legacy-squad', 'config');
    await mkdir(configDir, { recursive: true });

    const projectConfig = {
      project: {
        name: repoIndex.project.name,
        type: repoIndex.project.type,
        stack: repoIndex.stack.map((s) => s.name),
      },
      scope: {
        mode: 'full-project',
        exclude: ['node_modules', 'build', 'dist', '.git', 'vendor'],
      },
      pillars: {
        security: true,
        architecture: true,
        legacy_code: true,
        business_rules: true,
        modernization: true,
      },
      mode: { execution: 'read_only' },
      ide: { primary: 'claude-code' },
      installed_at: new Date().toISOString(),
      framework_version: '1.0.0',
    };

    await writeFile(
      path.join(configDir, 'project.yaml'),
      this.toYaml(projectConfig),
      'utf-8',
    );

    // Step 6: Create output directories
    await mkdir(path.join(effectiveRoot, '.legacy-squad', 'outputs', 'reports'), { recursive: true });
    await mkdir(path.join(effectiveRoot, '.legacy-squad', 'outputs', 'assessments'), { recursive: true });
    await mkdir(path.join(effectiveRoot, '.legacy-squad', 'logs'), { recursive: true });

    // Step 7: Install Claude Code slash commands
    const claudeCommandsDir = path.join(effectiveRoot, '.claude', 'commands', 'legacy-squad');
    await mkdir(claudeCommandsDir, { recursive: true });
    await this.copySlashCommands(templateDir, claudeCommandsDir);

    // Step 8: Generate AGENTS.md for Codex
    await this.generateAgentsMd(effectiveRoot, repoIndex.project.name);

    // Step 9: Write install log
    const logContent = [
      `Legacy Squad Framework — Install Log`,
      `Date: ${new Date().toISOString()}`,
      `Project: ${repoIndex.project.name}`,
      `Type: ${repoIndex.project.type}`,
      `Stack: ${repoIndex.stack.map((s) => s.name).join(', ')}`,
      `Modules: ${repoIndex.modules.length}`,
      `Dependencies: ${repoIndex.dependencies.length}`,
      `Findings: ${findings.length}`,
      `Context Packs: ${contextPacks.length}`,
      `Agents installed: ${ALL_AGENTS.length}`,
      `Requested root: ${projectRoot}`,
      `Effective root:  ${effectiveRoot}`,
    ].join('\n');

    await writeFile(
      path.join(effectiveRoot, '.legacy-squad', 'logs', 'install.log'),
      logContent,
      'utf-8',
    );

    return {
      repoIndexPath,
      findingsPath,
      contextPacksPath,
      agentCount: ALL_AGENTS.length,
      findingCount: findings.length,
      stackNames: repoIndex.stack.map((s) => s.name),
      moduleCount: repoIndex.modules.length,
      dependencyCount: repoIndex.dependencies.length,
      effectiveRoot,
      requestedRoot: projectRoot,
    };
  }

  private async copySlashCommands(
    templateDir: string,
    targetDir: string,
  ): Promise<void> {
    const commandFiles = [
      // Análise (rodam primeiro e produzem assessments)
      'security.md',
      'architecture.md',
      'legacy-code.md',
      'business-rules.md',
      'modernization.md',
      // Geradores de artefatos consolidados (rodam depois dos análise)
      'generate-prs.md',
      'generate-sdd.md',
      'generate-mmp.md',
      'generate-specs.md',
      // Utilitário
      'scan.md',
    ];

    for (const file of commandFiles) {
      const sourcePath = path.join(templateDir, file);
      const targetPath = path.join(targetDir, file);
      try {
        const content = await readFile(sourcePath, 'utf-8');
        await writeFile(targetPath, content, 'utf-8');
      } catch {
        // Template não encontrado — ignora (pode não existir em todas as versões)
      }
    }
  }

  private async generateAgentsMd(projectRoot: string, projectName: string): Promise<void> {
    const lines = [
      `# Legacy Squad Agents — ${projectName}`,
      '',
      'Este arquivo define os agentes do Legacy Squad Framework para Codex CLI.',
      'Ative um agente com: `@legacy-squad-{nome}`',
      '',
    ];

    for (const agent of ALL_AGENTS) {
      lines.push(`## ${agent.name} (@legacy-squad-${agent.id.replace('-agent', '')})`);
      lines.push('');
      lines.push(`**Role:** ${agent.role}`);
      lines.push(`**Pillar:** ${agent.pillar}`);
      lines.push(`**Frameworks:** ${agent.frameworks.join(', ')}`);
      lines.push('');
      lines.push('Leia `.legacy-squad/memory/` para contexto e produza o assessment em `.legacy-squad/outputs/assessments/`.');
      lines.push('');
    }

    await writeFile(path.join(projectRoot, 'AGENTS.md'), lines.join('\n'), 'utf-8');
  }

  private toYaml(obj: Record<string, unknown>, indent = 0): string {
    const lines: string[] = [];
    const prefix = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'object' && !Array.isArray(value)) {
        lines.push(`${prefix}${key}:`);
        lines.push(this.toYaml(value as Record<string, unknown>, indent + 1));
      } else if (Array.isArray(value)) {
        lines.push(`${prefix}${key}:`);
        for (const item of value) {
          lines.push(`${prefix}  - ${item}`);
        }
      } else {
        lines.push(`${prefix}${key}: ${value}`);
      }
    }

    return lines.join('\n');
  }
}
