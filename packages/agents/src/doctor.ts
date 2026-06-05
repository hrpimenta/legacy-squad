import { stat } from 'node:fs/promises';
import path from 'node:path';

export interface DoctorCheck {
  readonly name: string;
  readonly status: 'ok' | 'warning' | 'error';
  readonly message: string;
}

export class Doctor {
  async check(projectRoot: string): Promise<DoctorCheck[]> {
    const checks: DoctorCheck[] = [];

    checks.push(await this.checkFile(projectRoot, '.legacy-squad/memory/repo-index.json', 'Repo Index'));
    checks.push(await this.checkFile(projectRoot, '.legacy-squad/memory/findings.json', 'Findings'));
    checks.push(await this.checkFile(projectRoot, '.legacy-squad/memory/context-packs.json', 'Context Packs'));
    checks.push(await this.checkFile(projectRoot, '.legacy-squad/config/project.yaml', 'Project Config'));
    checks.push(await this.checkDir(projectRoot, '.claude/commands/legacy-squad', 'Claude Code Agents'));
    checks.push(await this.checkFile(projectRoot, 'AGENTS.md', 'Codex AGENTS.md'));
    checks.push(await this.checkDir(projectRoot, '.legacy-squad/outputs/assessments', 'Assessments Dir'));
    checks.push(await this.checkDir(projectRoot, '.legacy-squad/outputs/reports', 'Reports Dir'));

    return checks;
  }

  private async checkFile(root: string, relativePath: string, label: string): Promise<DoctorCheck> {
    try {
      const fullPath = path.join(root, relativePath);
      const s = await stat(fullPath);
      if (s.size === 0) {
        return { name: label, status: 'warning', message: `${relativePath} exists but is empty` };
      }
      return { name: label, status: 'ok', message: `${relativePath} ✓` };
    } catch {
      return { name: label, status: 'error', message: `${relativePath} not found` };
    }
  }

  private async checkDir(root: string, relativePath: string, label: string): Promise<DoctorCheck> {
    try {
      const fullPath = path.join(root, relativePath);
      const s = await stat(fullPath);
      if (!s.isDirectory()) {
        return { name: label, status: 'error', message: `${relativePath} is not a directory` };
      }
      return { name: label, status: 'ok', message: `${relativePath} ✓` };
    } catch {
      return { name: label, status: 'error', message: `${relativePath} not found` };
    }
  }
}
