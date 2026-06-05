import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type {
  OutputGeneratorPort,
  RepoIndex,
  Finding,
  ContextPack,
  Severity,
} from '@legacy-squad/core';

const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
  info: 'ℹ️',
};

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export class PRSGenerator implements OutputGeneratorPort {
  async generatePRS(
    repoIndex: RepoIndex,
    findings: Finding[],
    contextPacks: ContextPack[],
    outputDir: string,
  ): Promise<string> {
    await mkdir(outputDir, { recursive: true });

    const sortedFindings = [...findings].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    );

    const markdown = this.renderMarkdown(repoIndex, sortedFindings, contextPacks);
    const json = this.renderJson(repoIndex, sortedFindings, contextPacks);

    const mdPath = path.join(outputDir, 'PRS.md');
    const jsonPath = path.join(outputDir, 'PRS.json');

    await writeFile(mdPath, markdown, 'utf-8');
    await writeFile(jsonPath, JSON.stringify(json, null, 2), 'utf-8');

    return mdPath;
  }

  private renderMarkdown(
    repoIndex: RepoIndex,
    findings: Finding[],
    contextPacks: ContextPack[],
  ): string {
    const sections: string[] = [];

    sections.push(this.renderHeader(repoIndex));
    sections.push(this.renderExecutiveSummary(repoIndex, findings));
    sections.push(this.renderProjectOverview(repoIndex));
    sections.push(this.renderStackMap(repoIndex));
    sections.push(this.renderRiskSummary(findings));
    sections.push(this.renderFindingsByPillar(findings));
    sections.push(this.renderModuleMap(repoIndex, contextPacks));
    sections.push(this.renderRecommendations(findings));
    sections.push(this.renderFooter());

    return sections.join('\n\n---\n\n');
  }

  private renderHeader(repoIndex: RepoIndex): string {
    return [
      '# Product Refactor Specification (PRS)',
      '',
      `**Project:** ${repoIndex.project.name}`,
      `**Type:** ${repoIndex.project.type}`,
      `**Generated:** ${new Date().toISOString().split('T')[0]}`,
      `**Framework:** Legacy Squad Framework V1`,
      '',
      '> Understand. Plan. Modernize.',
    ].join('\n');
  }

  private renderExecutiveSummary(repoIndex: RepoIndex, findings: Finding[]): string {
    const critical = findings.filter((f) => f.severity === 'critical').length;
    const high = findings.filter((f) => f.severity === 'high').length;
    const medium = findings.filter((f) => f.severity === 'medium').length;
    const low = findings.filter((f) => f.severity === 'low').length;

    return [
      '## 1. Executive Summary',
      '',
      `The analysis of **${repoIndex.project.name}** identified **${findings.length} findings** across security and code quality pillars:`,
      '',
      `| Severity | Count |`,
      `|----------|-------|`,
      `| 🔴 Critical | ${critical} |`,
      `| 🟠 High | ${high} |`,
      `| 🟡 Medium | ${medium} |`,
      `| 🔵 Low | ${low} |`,
      '',
      `Stack: ${repoIndex.stack.map((s) => `${s.name} ${s.version}`).join(', ')}`,
      `Modules: ${repoIndex.modules.length} | Dependencies: ${repoIndex.dependencies.length} | Screens: ${repoIndex.entrypoints.filter((e) => e.type === 'screen').length}`,
    ].join('\n');
  }

  private renderProjectOverview(repoIndex: RepoIndex): string {
    const lines = [
      '## 2. Project Overview',
      '',
      `| Property | Value |`,
      `|----------|-------|`,
      `| Name | ${repoIndex.project.name} |`,
      `| Type | ${repoIndex.project.type} |`,
      `| Modules | ${repoIndex.modules.length} |`,
      `| Dependencies | ${repoIndex.dependencies.length} |`,
      `| Entrypoints | ${repoIndex.entrypoints.length} |`,
      `| Integrations | ${repoIndex.integrations.length} |`,
      `| Hotspots | ${repoIndex.hotspots.length} |`,
    ];
    return lines.join('\n');
  }

  private renderStackMap(repoIndex: RepoIndex): string {
    const lines = [
      '## 3. Technology Map',
      '',
      '| Component | Type | Version | Source |',
      '|-----------|------|---------|--------|',
    ];

    for (const item of repoIndex.stack) {
      lines.push(`| ${item.name} | ${item.type} | ${item.version} | ${item.source} |`);
    }

    return lines.join('\n');
  }

  private renderRiskSummary(findings: Finding[]): string {
    const lines = ['## 4. Risk Summary', ''];

    for (const finding of findings) {
      const emoji = SEVERITY_EMOJI[finding.severity];
      lines.push(`${emoji} **${finding.id}** — ${finding.title} (${finding.severity.toUpperCase()})`);
    }

    return lines.join('\n');
  }

  private renderFindingsByPillar(findings: Finding[]): string {
    const sections: string[] = ['## 5. Detailed Findings'];

    for (const finding of findings) {
      sections.push('');
      sections.push(`### ${finding.id}: ${finding.title}`);
      sections.push('');
      sections.push(`**Pillar:** ${finding.pillar} | **Severity:** ${finding.severity} | **Priority:** ${finding.priority}`);
      sections.push(`**Frameworks:** ${finding.frameworks.join(', ')}`);
      sections.push('');
      sections.push(`**Impact:** ${finding.impact}`);
      sections.push('');
      sections.push('**Evidence:**');
      sections.push('');

      for (const ev of finding.evidence.slice(0, 5)) {
        const lineInfo = ev.line > 0 ? `:${ev.line}` : '';
        sections.push(`- \`${ev.file}${lineInfo}\`: \`${ev.snippet}\``);
      }

      if (finding.evidence.length > 5) {
        sections.push(`- ... and ${finding.evidence.length - 5} more occurrences`);
      }

      sections.push('');
      sections.push(`**Recommendation:** ${finding.recommendation}`);
    }

    return sections.join('\n');
  }

  private renderModuleMap(repoIndex: RepoIndex, contextPacks: ContextPack[]): string {
    const lines = [
      '## 6. Module Map',
      '',
      '| Module | Files | Token Estimate |',
      '|--------|-------|----------------|',
    ];

    for (const pack of contextPacks.slice(0, 20)) {
      lines.push(`| ${pack.module} | ${pack.keyFiles.length} | ~${pack.tokenEstimate} |`);
    }

    return lines.join('\n');
  }

  private renderRecommendations(findings: Finding[]): string {
    const criticalFindings = findings.filter((f) => f.severity === 'critical' || f.severity === 'high');
    const lines = [
      '## 7. Recommended Next Steps',
      '',
      '### Immediate (P0/P1)',
      '',
    ];

    for (const f of criticalFindings) {
      lines.push(`1. **${f.id}**: ${f.recommendation}`);
    }

    lines.push('');
    lines.push('### Short-term (P2)');
    lines.push('');

    const mediumFindings = findings.filter((f) => f.severity === 'medium');
    for (const f of mediumFindings) {
      lines.push(`1. **${f.id}**: ${f.recommendation}`);
    }

    lines.push('');
    lines.push('### Long-term (P3/P4)');
    lines.push('');

    const lowFindings = findings.filter((f) => f.severity === 'low' || f.severity === 'info');
    for (const f of lowFindings) {
      lines.push(`1. **${f.id}**: ${f.recommendation}`);
    }

    return lines.join('\n');
  }

  private renderFooter(): string {
    return [
      '## Metadata',
      '',
      '```',
      `Generated by: Legacy Squad Framework V1`,
      `Date: ${new Date().toISOString()}`,
      `Mode: read-only, evidence-driven`,
      `Provider: compliance-engine (deterministic)`,
      '```',
      '',
      '**Understand. Plan. Modernize.**',
    ].join('\n');
  }

  private renderJson(
    repoIndex: RepoIndex,
    findings: Finding[],
    contextPacks: ContextPack[],
  ): object {
    return {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      framework: 'Legacy Squad Framework V1',
      project: repoIndex.project,
      stack: repoIndex.stack,
      modules: repoIndex.modules.length,
      dependencies: repoIndex.dependencies.length,
      entrypoints: repoIndex.entrypoints.length,
      integrations: repoIndex.integrations.length,
      findings,
      contextPacks: contextPacks.map((p) => ({
        id: p.id,
        module: p.module,
        tokenEstimate: p.tokenEstimate,
      })),
      summary: {
        total: findings.length,
        critical: findings.filter((f) => f.severity === 'critical').length,
        high: findings.filter((f) => f.severity === 'high').length,
        medium: findings.filter((f) => f.severity === 'medium').length,
        low: findings.filter((f) => f.severity === 'low').length,
      },
    };
  }
}
