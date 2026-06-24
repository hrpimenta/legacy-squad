import { Command } from 'commander';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Installer, Doctor, FindingsWriter } from '@legacy-squad/agents';
import { NodeFileSystem, RepoScanner } from '@legacy-squad/scanner';
import { ComplianceEngine } from '@legacy-squad/rules';

const program = new Command();

/** Resolve o diretório de templates — funciona em dev (tsx) e bundled (dist/) */
function getTemplateDir(): string {
  const cliDir = path.dirname(fileURLToPath(import.meta.url));

  // Bundled mode: dist/cli.mjs → dist/templates/claude-commands
  const bundledPath = path.resolve(cliDir, 'templates', 'claude-commands');
  if (existsSync(bundledPath)) return bundledPath;

  // Dev mode: apps/cli/src/index.ts → templates/claude-commands
  const devPath = path.resolve(cliDir, '..', '..', '..', 'templates', 'claude-commands');
  if (existsSync(devPath)) return devPath;

  throw new Error('Templates not found. Run from the framework root or use the published package.');
}

program
  .name('legacy-squad')
  .description('AI-Powered Legacy Modernization Platform — Understand. Plan. Modernize.')
  .version('1.2.0');

program
  .command('install')
  .description('Install Legacy Squad Framework inside the current project')
  .option('-p, --path <dir>', 'Project root directory', '.')
  .action(async (opts: { path: string }) => {
    const projectRoot = path.resolve(opts.path);
    const templateDir = getTemplateDir();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Legacy Squad Framework V1 — Install');
    console.log('  Understand. Plan. Modernize.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📂 Project: ${projectRoot}\n`);

    console.log('🔍 Step 1/3 — Scanning & analyzing...');
    const installer = new Installer();
    const result = await installer.install(projectRoot, templateDir);

    // DT-004: avisar quando o framework precisou descer um nível
    if (result.effectiveRoot !== result.requestedRoot) {
      console.log(`   ⚠️  Manifest found in subdirectory — using: ${result.effectiveRoot}`);
    }

    console.log(`   Stack: ${result.stackNames.join(', ')}`);
    console.log(`   Modules: ${result.moduleCount} | Dependencies: ${result.dependencyCount}`);
    console.log(`   Findings: ${result.findingCount}`);

    console.log('\n🤖 Step 2/3 — Installing agents...');
    console.log(`   Claude Code: .claude/commands/legacy-squad/ (${result.agentCount} agents)`);
    console.log('   Codex CLI:   AGENTS.md');

    console.log('\n✅ Step 3/3 — Verifying installation...');
    const doctor = new Doctor();
    const checks = await doctor.check(result.effectiveRoot);
    const errors = checks.filter((c) => c.status === 'error');
    const ok = checks.filter((c) => c.status === 'ok');
    console.log(`   ${ok.length}/${checks.length} checks passed`);

    if (errors.length > 0) {
      for (const e of errors) {
        console.log(`   ❌ ${e.name}: ${e.message}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅ Installation complete!');
    console.log('');
    console.log(`  📂 Root:   ${result.effectiveRoot}`);
    console.log('  📂 Data:   .legacy-squad/memory/');
    console.log('  🤖 Agents: .claude/commands/legacy-squad/');
    console.log('');
    console.log('  Next steps:');
    console.log('    1. Open Claude Code: claude');
    console.log('');
    console.log('  Analysis (run in order):');
    console.log('    /legacy-squad-security');
    console.log('    /legacy-squad-architecture');
    console.log('    /legacy-squad-legacy-code');
    console.log('    /legacy-squad-business-rules');
    console.log('    /legacy-squad-modernization');
    console.log('');
    console.log('  Consolidated artifacts (run after analysis):');
    console.log('    /legacy-squad-generate-prs    (Product Refactor Specification)');
    console.log('    /legacy-squad-generate-sdd    (Software Design Document)');
    console.log('    /legacy-squad-generate-mmp    (Modernization Master Plan)');
    console.log('    /legacy-squad-generate-specs  (Execution Specs for V2)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });

program
  .command('scan')
  .description('Re-scan the project and update .legacy-squad/memory/')
  .option('-p, --path <dir>', 'Project root directory', '.')
  .action(async (opts: { path: string }) => {
    const projectRoot = path.resolve(opts.path);

    console.log(`\n🔍 Re-scanning: ${projectRoot}\n`);

    const fs = new NodeFileSystem();
    const scanner = new RepoScanner(fs);
    const repoIndex = await scanner.scan(projectRoot);
    const effectiveRoot = repoIndex.project.rootPath;

    if (effectiveRoot !== projectRoot) {
      console.log(`⚠️  Manifest found in subdirectory — using: ${effectiveRoot}\n`);
    }

    const compliance = new ComplianceEngine(fs);
    const findings = await compliance.evaluate(effectiveRoot, repoIndex);

    const { mkdir, writeFile } = await import('node:fs/promises');
    const memoryDir = path.join(effectiveRoot, '.legacy-squad', 'memory');
    await mkdir(memoryDir, { recursive: true });

    await writeFile(path.join(memoryDir, 'repo-index.json'), JSON.stringify(repoIndex, null, 2), 'utf-8');
    await new FindingsWriter(fs).write(findings, memoryDir);

    console.log(`✅ Stack: ${repoIndex.stack.map((s) => s.name).join(', ')}`);
    console.log(`📦 Modules: ${repoIndex.modules.length}`);
    console.log(`🔒 Findings: ${findings.length}`);
    console.log(`📄 Updated: ${path.join(effectiveRoot, '.legacy-squad', 'memory')}\n`);
  });

program
  .command('doctor')
  .description('Verify Legacy Squad installation health')
  .option('-p, --path <dir>', 'Project root directory', '.')
  .action(async (opts: { path: string }) => {
    const projectRoot = path.resolve(opts.path);

    console.log('\n🩺 Legacy Squad Doctor\n');

    const doctor = new Doctor();
    const checks = await doctor.check(projectRoot);

    for (const check of checks) {
      const icon = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      console.log(`  ${icon} ${check.name}: ${check.message}`);
    }

    const errors = checks.filter((c) => c.status === 'error');
    if (errors.length > 0) {
      console.log(`\n❌ ${errors.length} issues found. Run 'npx legacy-squad install' to fix.\n`);
    } else {
      console.log('\n✅ All checks passed.\n');
    }
  });

program.parse();
