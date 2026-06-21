import path from 'node:path';
import type {
  ComplianceEnginePort,
  FileSystemPort,
  RepoIndex,
  Finding,
  Evidence,
  Rule,
  Severity,
  Priority,
} from '@legacy-squad/core';
import { toPosix } from '@legacy-squad/core';
import { ALL_RULES } from './rule-catalog.js';

const SEVERITY_TO_PRIORITY: Record<Severity, Priority> = {
  critical: 'P0',
  high: 'P1',
  medium: 'P2',
  low: 'P3',
  info: 'P4',
};

const SOURCE_EXTENSIONS = /\.(tsx?|jsx?|php|cs|java|py|dart)$/;

export class ComplianceEngine implements ComplianceEnginePort {
  constructor(private readonly fs: FileSystemPort) {}

  loadRules(): Rule[] {
    return ALL_RULES;
  }

  async evaluate(rootPath: string, repoIndex: RepoIndex): Promise<Finding[]> {
    const applicableRules = this.filterApplicableRules(repoIndex);
    const allFiles = await this.collectAllFiles(rootPath);
    const findings: Finding[] = [];

    for (const rule of applicableRules) {
      const ruleFindings = await this.evaluateRule(rule, rootPath, allFiles);
      findings.push(...ruleFindings);
    }

    return this.deduplicateFindings(findings);
  }

  private filterApplicableRules(repoIndex: RepoIndex): Rule[] {
    const projectTags = new Set<string>();
    projectTags.add(repoIndex.project.type);
    for (const item of repoIndex.stack) {
      projectTags.add(item.name);
    }

    return ALL_RULES.filter((rule) =>
      rule.appliesTo.some((tag) => projectTags.has(tag)),
    );
  }

  private async collectAllFiles(rootPath: string): Promise<string[]> {
    return this.fs.glob(rootPath, SOURCE_EXTENSIONS.source);
  }

  private async evaluateRule(
    rule: Rule,
    rootPath: string,
    files: string[],
  ): Promise<Finding[]> {
    switch (rule.detection.type) {
      case 'pattern':
        return this.evaluatePatternRule(rule, rootPath, files);
      case 'filename':
        return this.evaluateFilenameRule(rule, rootPath, files);
      case 'structure':
        return this.evaluateStructureRule(rule, rootPath, files);
      default:
        return [];
    }
  }

  private async evaluatePatternRule(
    rule: Rule,
    rootPath: string,
    files: string[],
  ): Promise<Finding[]> {
    const allEvidence: Evidence[] = [];

    for (const file of files) {
      try {
        const content = await this.fs.readFile(file);
        const lines = content.split('\n');
        const relative = toPosix(path.relative(rootPath, file));

        for (const pattern of rule.detection.patterns) {
          const regex = new RegExp(pattern, 'gi');
          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              allEvidence.push({
                file: relative,
                line: i + 1,
                snippet: lines[i].trim().substring(0, 120),
              });
            }
            regex.lastIndex = 0;
          }
        }
      } catch {
        // Arquivo ilegível — ignora
      }
    }

    if (allEvidence.length === 0) return [];

    return [{
      id: rule.id,
      title: rule.title,
      pillar: rule.category,
      severity: rule.severity,
      evidence: allEvidence.slice(0, 10),
      frameworks: rule.frameworks,
      impact: rule.impact,
      recommendation: rule.recommendation,
      priority: SEVERITY_TO_PRIORITY[rule.severity],
    }];
  }

  private async evaluateFilenameRule(
    rule: Rule,
    rootPath: string,
    _files: string[],
  ): Promise<Finding[]> {
    const allEvidence: Evidence[] = [];

    for (const pattern of rule.detection.patterns) {
      const matchingFiles = await this.fs.glob(rootPath, pattern);
      for (const file of matchingFiles) {
        const relative = toPosix(path.relative(rootPath, file));
        allEvidence.push({
          file: relative,
          line: 0,
          snippet: `File matches sensitive pattern: ${pattern}`,
        });
      }
    }

    if (allEvidence.length === 0) return [];

    return [{
      id: rule.id,
      title: rule.title,
      pillar: rule.category,
      severity: rule.severity,
      evidence: allEvidence,
      frameworks: rule.frameworks,
      impact: rule.impact,
      recommendation: rule.recommendation,
      priority: SEVERITY_TO_PRIORITY[rule.severity],
    }];
  }

  private async evaluateStructureRule(
    rule: Rule,
    rootPath: string,
    files: string[],
  ): Promise<Finding[]> {
    if (rule.detection.patterns.includes('mixed-js-ts')) {
      return this.checkMixedJsTs(rule, rootPath, files);
    }
    return [];
  }

  private async checkMixedJsTs(
    rule: Rule,
    rootPath: string,
    files: string[],
  ): Promise<Finding[]> {
    const hasJs = files.some((f) => f.endsWith('.js') || f.endsWith('.jsx'));
    const hasTs = files.some((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

    if (!hasJs || !hasTs) return [];

    const jsFiles = files.filter((f) => f.endsWith('.js') || f.endsWith('.jsx'));

    return [{
      id: rule.id,
      title: rule.title,
      pillar: rule.category,
      severity: rule.severity,
      evidence: jsFiles.slice(0, 5).map((f) => ({
        file: toPosix(path.relative(rootPath, f)),
        line: 0,
        snippet: 'JavaScript file in a TypeScript project',
      })),
      frameworks: rule.frameworks,
      impact: rule.impact,
      recommendation: rule.recommendation,
      priority: SEVERITY_TO_PRIORITY[rule.severity],
    }];
  }

  private deduplicateFindings(findings: Finding[]): Finding[] {
    const seen = new Set<string>();
    return findings.filter((f) => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });
  }
}
