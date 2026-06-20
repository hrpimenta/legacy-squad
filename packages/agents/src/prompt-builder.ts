import type { RepoIndex, Finding, ContextPack } from '@legacy-squad/core';
import type { AgentDefinition } from './agent-definitions.js';
import { ALL_AGENTS } from './agent-definitions.js';

export interface AgentPrompt {
  readonly agentId: string;
  readonly agentName: string;
  readonly pillar: string;
  readonly prompt: string;
  readonly estimatedTokens: number;
}

const TOKENS_PER_CHAR = 0.25;

export class PromptBuilder {
  buildAllPrompts(
    repoIndex: RepoIndex,
    findings: Finding[],
    contextPacks: ContextPack[],
  ): AgentPrompt[] {
    return ALL_AGENTS.map((agent) =>
      this.buildPrompt(agent, repoIndex, findings, contextPacks),
    );
  }

  buildPrompt(
    agent: AgentDefinition,
    repoIndex: RepoIndex,
    findings: Finding[],
    contextPacks: ContextPack[],
  ): AgentPrompt {
    const pillarFindings = findings.filter((f) => f.pillar === agent.pillar);
    const relevantPacks = this.selectRelevantPacks(agent, contextPacks);

    const sections: string[] = [];

    sections.push(this.renderAgentHeader(agent));
    sections.push(this.renderProjectContext(repoIndex));
    sections.push(this.renderComplianceFindings(pillarFindings, agent));
    sections.push(this.renderContextPacks(relevantPacks));
    sections.push(this.renderOutputInstructions(agent));

    const prompt = sections.join('\n\n---\n\n');

    return {
      agentId: agent.id,
      agentName: agent.name,
      pillar: agent.pillar,
      prompt,
      estimatedTokens: Math.round(prompt.length * TOKENS_PER_CHAR),
    };
  }

  private renderAgentHeader(agent: AgentDefinition): string {
    return [
      `# ${agent.name} — Legacy Squad Framework V1`,
      '',
      agent.instructions,
      '',
      `**Expertise:** ${agent.expertise.join(', ')}`,
      `**Reference Frameworks:** ${agent.frameworks.join(', ')}`,
    ].join('\n');
  }

  private renderProjectContext(repoIndex: RepoIndex): string {
    const stackList = repoIndex.stack
      .map((s) => `- ${s.name} ${s.version} (${s.type})`)
      .join('\n');

    const moduleList = repoIndex.modules
      .slice(0, 15)
      .map((m) => `- ${m.path} (${m.filesCount} files)`)
      .join('\n');

    const integrationList = repoIndex.integrations
      .slice(0, 10)
      .map((i) => `- ${i.name} (${i.type}): ${i.evidence}`)
      .join('\n');

    return [
      '## Project Context (from Repo Index)',
      '',
      `**Project:** ${repoIndex.project.name} (${repoIndex.project.type})`,
      `**Dependencies:** ${repoIndex.dependencies.length}`,
      `**Entrypoints:** ${repoIndex.entrypoints.length}`,
      `**Hotspots:** ${repoIndex.hotspots.length}`,
      '',
      '### Stack',
      stackList,
      '',
      '### Modules',
      moduleList,
      '',
      '### External Integrations',
      integrationList,
    ].join('\n');
  }

  private renderComplianceFindings(findings: Finding[], agent: AgentDefinition): string {
    if (findings.length === 0) {
      return [
        `## Compliance Findings (${agent.pillar})`,
        '',
        'No deterministic findings detected for this pillar. Your analysis should identify findings that pattern matching cannot detect.',
      ].join('\n');
    }

    const findingBlocks = findings.map((f) => {
      const evidenceList = f.evidence
        .slice(0, 5)
        .map((e) => `  - \`${e.file}:${e.line}\`: \`${e.snippet}\``)
        .join('\n');

      return [
        `### ${f.id}: ${f.title}`,
        `**Severity:** ${f.severity} | **Priority:** ${f.priority}`,
        `**Frameworks:** ${f.frameworks.join(', ')}`,
        `**Impact:** ${f.impact}`,
        '**Evidence:**',
        evidenceList,
        `**Recommendation:** ${f.recommendation}`,
      ].join('\n');
    });

    return [
      `## Compliance Findings (${agent.pillar}) — ${findings.length} detected`,
      '',
      'These findings were detected deterministically by the Compliance Engine. Validate, refine, and ADD new findings that regex cannot detect.',
      '',
      ...findingBlocks,
    ].join('\n');
  }

  private renderContextPacks(packs: ContextPack[]): string {
    if (packs.length === 0) {
      return '## Context Packs\n\nNo context packs available for this pillar.';
    }

    const packBlocks = packs.map((p) => {
      const files = p.keyFiles.slice(0, 5).map((f) => `  - ${f}`).join('\n');
      return [
        `### ${p.module}`,
        `**Summary:** ${p.summary}`,
        `**Key Files:**`,
        files,
        `**Entrypoints:** ${p.entrypoints.join(', ') || 'none'}`,
        `**Token Estimate:** ~${p.tokenEstimate}`,
      ].join('\n');
    });

    return [
      '## Context Packs (summarized modules)',
      '',
      'These packs represent the key modules. For deeper analysis, request the full source of specific files.',
      '',
      ...packBlocks,
    ].join('\n');
  }

  private renderOutputInstructions(agent: AgentDefinition): string {
    const sections = agent.outputSections
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n');

    return [
      '## Expected Output',
      '',
      'Produce your assessment as a Markdown document with these sections:',
      '',
      sections,
      '',
      'For each finding or observation:',
      '- Cite the evidence (file, line, or pattern)',
      '- Classify severity (critical/high/medium/low/info)',
      '- Provide actionable recommendation',
      '- Consider production impact',
      '',
      'End with a summary table of all findings (ID, title, severity, file).',
    ].join('\n');
  }

  private selectRelevantPacks(
    agent: AgentDefinition,
    packs: ContextPack[],
  ): ContextPack[] {
    const relevanceMap: Record<string, string[]> = {
      security: ['stores', 'auth', 'login', 'utils', 'config'],
      architecture: ['stores', 'routes', 'screens', 'comps', 'utils'],
      legacy_code: ['stores', 'screens', 'comps', 'utils'],
      business_rules: ['stores', 'screens', 'routes'],
      modernization: ['stores', 'screens', 'comps', 'routes', 'utils', 'config'],
    };

    const keywords = relevanceMap[agent.pillar] ?? [];
    const relevant = packs.filter((p) =>
      keywords.some((kw) => p.module.toLowerCase().includes(kw)),
    );

    return relevant.length > 0 ? relevant : packs.slice(0, 5);
  }
}
