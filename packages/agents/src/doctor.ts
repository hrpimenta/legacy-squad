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
    checks.push(await this.checkFindingsStructure(projectRoot));
    checks.push(await this.checkFile(projectRoot, '.legacy-squad/memory/context-packs.json', 'Context Packs'));
    checks.push(await this.checkFile(projectRoot, '.legacy-squad/config/project.yaml', 'Project Config'));
    checks.push(await this.checkDir(projectRoot, '.claude/commands/legacy-squad', 'Claude Code Agents'));
    checks.push(await this.checkFile(projectRoot, 'AGENTS.md', 'Codex AGENTS.md'));
    checks.push(await this.checkDir(projectRoot, '.legacy-squad/outputs/assessments', 'Assessments Dir'));
    checks.push(await this.checkDir(projectRoot, '.legacy-squad/outputs/reports', 'Reports Dir'));

    return checks;
  }

  /**
   * Verifica a estrutura de findings conforme DA-011:
   * - `findings/index.json` presente → ok (estrutura particionada)
   * - `findings.json` presente sem `findings/` → error com orientação de re-install
   * - Nenhum dos dois → error (não instalado)
   */
  private async checkFindingsStructure(root: string): Promise<DoctorCheck> {
    const indexPath = path.join(root, '.legacy-squad', 'memory', 'findings', 'index.json');
    const legacyPath = path.join(root, '.legacy-squad', 'memory', 'findings.json');

    if (await this.pathExists(indexPath)) {
      return { name: 'Findings', status: 'ok', message: '.legacy-squad/memory/findings/index.json ✓' };
    }

    if (await this.pathExists(legacyPath)) {
      return {
        name: 'Findings',
        status: 'error',
        message:
          'Estrutura legada detectada (.legacy-squad/memory/findings.json). ' +
          'Execute npx legacy-squad install para regenerar na estrutura particionada (DA-011). ' +
          'A migração não é automática — nenhum dado foi alterado.',
      };
    }

    return {
      name: 'Findings',
      status: 'error',
      message: '.legacy-squad/memory/findings/index.json not found',
    };
  }

  /** Retorna true se o path existir (arquivo ou diretório), false caso contrário. */
  private async pathExists(fullPath: string): Promise<boolean> {
    try {
      await stat(fullPath);
      return true;
    } catch {
      return false;
    }
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
