import type { LifecyclePhaseStatus, LifecycleSnapshot } from '@legacy-squad/core';

/** Régua horizontal do dashboard (mesmo estilo visual dos demais comandos da CLI). */
const RULE = '━'.repeat(40);

/**
 * Nomes curtos de exibição por step id. É conhecimento de apresentação (não de domínio):
 * mapeia os ids do lifecycle para rótulos compactos no dashboard. Ids sem entrada caem no próprio id.
 */
const STEP_DISPLAY: Record<string, string> = {
  scan: 'scan',
  security: 'security',
  architecture: 'architecture',
  'legacy-code': 'legacy-code',
  'business-rules': 'business-rules',
  modernization: 'modernization',
  'generate-prs': 'PRS',
  'generate-sdd': 'SDD',
  'generate-mmp': 'MMP',
  'generate-specs': 'Specs',
};

const display = (id: string): string => STEP_DISPLAY[id] ?? id;

/** Ícone da fase: completa (✓), parcial (◐) ou não iniciada (·). */
function phaseIcon(phase: LifecyclePhaseStatus): string {
  if (phase.totalCount > 0 && phase.doneCount === phase.totalCount) return '✓';
  if (phase.doneCount > 0) return '◐';
  return '·';
}

/** Detalhe da fase: o nome do passo (fases de 1 passo) ou contador + lista (fase de assessment). */
function phaseDetail(phase: LifecyclePhaseStatus): string {
  if (phase.steps.length === 1) {
    return display(phase.steps[0].id);
  }
  const names = phase.steps.map((s) => display(s.id)).join(' · ');
  return `${phase.doneCount}/${phase.totalCount}   ${names}`;
}

/**
 * Renderiza um {@link LifecycleSnapshot} como dashboard de terminal.
 * Função pura: a mesma entrada sempre produz a mesma string, sem efeitos colaterais
 * (a impressão fica a cargo do chamador na CLI). Consome apenas o snapshot já computado
 * pelo detector — não lê o sistema de arquivos nem deriva estado.
 */
export class DashboardRenderer {
  render(snapshot: LifecycleSnapshot): string {
    const lines: string[] = [RULE];

    if (snapshot.project) {
      const stack = snapshot.project.stack.join(', ');
      lines.push(`  Legacy Squad — ${snapshot.project.name}`);
      lines.push(`  ${snapshot.project.type}${stack ? ` · ${stack}` : ''}`);
    } else {
      lines.push('  Legacy Squad');
      lines.push('  (framework não instalado neste diretório)');
    }

    lines.push(RULE, '');
    lines.push(`  Maturity   Level ${snapshot.maturityLevel} — ${snapshot.maturityLabel}`);
    lines.push(`  Findings   ${snapshot.findingCount}`, '');

    const labelWidth = Math.max(...snapshot.phases.map((p) => p.label.length));
    for (const phase of snapshot.phases) {
      lines.push(`  ${phaseIcon(phase)} ${phase.label.padEnd(labelWidth)}   ${phaseDetail(phase)}`);
    }

    lines.push('');
    if (snapshot.nextStep) {
      const target = snapshot.nextStep.command ?? 'npx legacy-squad install';
      lines.push(`  → Próximo passo: ${target}`);
      lines.push(`    ${snapshot.nextStep.reason}`);
    } else {
      lines.push('  ✓ Lifecycle V1 completo — specs prontas para execução.');
    }
    lines.push(RULE);

    return lines.join('\n');
  }
}
