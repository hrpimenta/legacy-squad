# Legacy Squad Framework — memory.md

## Decisões Arquiteturais

### [2026-06-04] DA-001: Monorepo pnpm + TypeScript + Vitest
**Contexto:** Necessidade de modularidade com compartilhamento de tipos entre pacotes.
**Alternativas:** npm workspaces, turborepo, nx.
**Decisão:** pnpm workspaces pela simplicidade e compatibilidade com Windows CMD.
**Consequências:** Requer pnpm 11.5+; `allowBuilds` necessário para esbuild.

### [2026-06-04] DA-002: Clean Architecture com camadas Domain → Application → Infrastructure
**Contexto:** Framework precisa ser extensível (novos providers, novas stacks, novas regras).
**Alternativas:** Feature-first, hexagonal.
**Decisão:** Clean Architecture clássica — Domain (core) nunca depende de nada externo.
**Consequências:** Todos os pacotes dependem de @legacy-squad/core; core não depende de ninguém.

### [2026-06-04] DA-003: Detecção de stack em camadas (manifesto → extensão → heurística)
**Contexto:** Usuário pediu que stack não fosse determinística fixa, mas o framework é evidence-driven.
**Alternativas:** Apenas manifesto; apenas LLM; escolha manual no wizard.
**Decisão:** Camada 1 determinística (manifesto), Camada 2 heurística (extensões), Camada 3 (futuro: LLM para ambiguidade).
**Consequências:** Funciona offline sem LLM; evidência rastreável no RepoIndex.

### [2026-06-04] DA-004: Compliance Engine determinístico com regras YAML-like
**Contexto:** Primeiro PRS precisa de achados reais sem depender de LLM.
**Alternativas:** Apenas agentes LLM; AST analysis.
**Decisão:** Pattern matching com regex para V1. AST reservado para V2.
**Consequências:** Pode ter falsos positivos em patterns genéricos; mitiga com evidência concreta.

### [2026-06-04] DA-005: Arquitetura IDE-Native (modelo AIOX)
**Contexto:** Framework gerava prompts para copiar. Modelo AIOX instala agentes como slash commands na IDE.
**Alternativas:** Framework chama API de LLM diretamente; prompt files para copiar; dashboard web.
**Decisão:** Framework se instala dentro do projeto (`npx legacy-squad install`), agentes como `.claude/commands/legacy-squad/*.md`, IA executada pela IDE do dev.
**Consequências:** Zero API key no framework; funciona com qualquer IDE que suporte agentes; package `providers` simplificado (não precisa de ClaudeProvider/CodexProvider).

### [2026-06-04] DA-006: Normalização de paths para POSIX no output
**Contexto:** `path.relative` no Windows gera `\`, quebrando testes e findings.
**Alternativas:** Deixar OS-native; usar `path.sep` em assertions.
**Decisão:** Toda saída do framework (findings, repo-index, context-packs) normalizada para POSIX `/`.
**Consequências:** Output consistente cross-platform; testes portáveis; regex de detecção simplificado.

### [2026-06-09] DA-007: Resolução de raiz efetiva com fallback de 1 nível
**Contexto:** Zips extraídos costumam criar estrutura aninhada (`foo-main/foo-main/package.json`). O scanner antigo só olhava o path passado pela CLI, falhando silenciosamente nesses casos (zero stack detectada).
**Alternativas:** (a) Forçar usuário a apontar o `--path` correto; (b) Buscar manifesto recursivamente em qualquer profundidade; (c) Descer no máximo 1 nível quando há subdir único com manifesto.
**Decisão:** Opção (c). O `RepoScanner.scan()` retorna `project.rootPath` apontando para o `effectiveRoot`. Quando há múltiplos subdirs com manifesto (monorepo), mantém raiz original — não tenta adivinhar. O `Installer` grava `.legacy-squad/` no `effectiveRoot`, registrando `requestedRoot` vs `effectiveRoot` no `install.log` para auditoria. A CLI exibe aviso quando os dois divergem.
**Consequências:** UX correto para o caso de zip aninhado sem ocultar monorepos. Auditoria preservada via log e via aviso visível. Quebra a invariante "tudo é escrito em `--path`" — quem consumir o `InstallResult` precisa usar `result.effectiveRoot`.

### [2026-06-09] DA-008: Catálogo de regras multi-linguagem via patterns regex por linguagem
**Contexto:** Catálogo inicial era 100% mobile/Node (8 regras). PHP, .NET e Java geravam zero findings determinísticos. Stack principal do consumidor (legados corporativos) ficava órfã.
**Alternativas:** (a) Uma regra por par linguagem×vulnerabilidade (ex: SEC-SQL-PHP, SEC-SQL-DOTNET); (b) Regras genéricas por linguagem em arquivos separados; (c) Uma regra por vulnerabilidade com múltiplos patterns regex internos (um por linguagem).
**Decisão:** Opção (c). Cada regra OWASP/CWE tem um único ID (SEC-SQL-001, SEC-CRYPTO-001, etc.) com 2-4 patterns regex específicos por linguagem. O `appliesTo` usa a constante `BACKEND_LANGUAGES` que cobre `php/laravel/symfony/codeigniter/dotnet/csharp/asp.net/java/spring-boot/spring-mvc/backend`. Falsos positivos cross-language são raros porque cada pattern referencia APIs/sintaxe exclusivas (`$_GET` só em PHP, `MD5.Create` só em .NET, `.getParameter` só em Servlet/Spring).
**Consequências:** Single source of truth por vulnerabilidade — recomendação e severidade não fragmentam por stack. Catálogo cresceu de 8 para 14 regras cobrindo OWASP Top 10 (A03 Injection, A02 Crypto, A05 Misconfig, A08 Deserialization). Tradeoff: regex é "linha-única" — quando uma vulnerabilidade exige cruzar 2+ linhas, recorre-se a um pattern mais específico (caso de `.readObject()` que sinaliza ObjectInputStream sem precisar achá-lo na mesma linha).

### [2026-06-09] DA-009: Templates de agentes language-agnostic com seção "Stack-aware analysis"
**Contexto:** Templates de slash commands (`templates/claude-commands/*.md`) tinham viés mobile/RN explícito — `legacy-code.md` falava em "Migração JS→TS"; `architecture.md` em "State management/Navegação"; `security.md` em "stores/telas de login". Quando o framework rodava em projeto PHP/Java/.NET, o Compliance Engine entregava findings corretos (DA-008) mas os agentes interpretavam com vocabulário fora do contexto.
**Alternativas:** (a) Múltiplos templates por stack (`security-php.md`, `security-dotnet.md`, etc.); (b) Template único com sections condicionais por stack; (c) Manter genéricos e deixar a IA adaptar livremente.
**Decisão:** Opção (b). Cada template ganha uma seção `## Stack-aware analysis` listando 4-6 stacks (PHP/Laravel/Symfony, .NET/ASP.NET, Java/Spring, React Native/mobile, Node backend) com patterns e vocabulário específicos. A IA lê o `repo-index.json` antes e usa a seção pertinente. Mantém DRY (1 template por agente) e contextualização (vocabulário certo por stack). Verificado por testes que cravam multi-stack coverage e bias-check de termos mobile-only.
**Consequências:** Templates passam de ~50-70 linhas para ~80-110 linhas (~50% maior). Em troca, ganho de qualidade dos assessments quando a stack não é mobile. Testes de garantia (5 cobrindo multi-stack + 1 bias-check) protegem contra regressão futura.

### [2026-06-09] DA-010: Geradores de artefatos consolidados (SDD, MMP, Specs) como slash commands
**Contexto:** A FRAMEWORK_SPECIFICATION (§6-8) define 4 artefatos oficiais: PRS (diagnóstico), SDD (desenho técnico), MMP (plano mestre), Execution Specs (decomposição executável). Até a beta.7 só `generate-prs.md` existia. Sem SDD/MMP/Specs, o V1 entregava só metade do framework — diagnosticava bem, mas não desenhava o alvo nem decompunha em unidades de trabalho.
**Alternativas:** (a) Implementar SDD/MMP/Specs como código TypeScript no `output` package (geradores determinísticos a partir de assessments); (b) Slash commands que delegam síntese pra IA com prompts estruturados.
**Decisão:** Opção (b). SDD/MMP/Specs exigem síntese qualitativa (ADRs com justificativas, risk matrix com mitigações, specs com critérios de aceite binários) — algo que regex/templates determinísticos não conseguem. A IA é a ferramenta certa, com guard-rails via prompt estruturado. Cada template enumera estrutura obrigatória + regras invioláveis (rollback obrigatório em cada spec, no big-bang, business rules a preservar, etc.). Para Execution Specs, o template lista todos os 12 campos obrigatórios do schema FRAMEWORK_SPECIFICATION §8.
**Consequências:** V1 do framework completo conforme especificação. Os 4 artefatos oficiais (PRS/SDD/MMP/Specs) podem ser gerados via slash commands no Claude Code. Cada gerador valida pré-requisitos (e.g., generate-mmp exige modernization-assessment.md). Tradeoff: qualidade dos artefatos depende da qualidade dos prompts e da IA — não há validação determinística do output (é prosa estruturada). Testes garantem invariantes estruturais (campos obrigatórios da spec, leitura de assessments anteriores, output em path canônico).

### [2026-06-21] DA-011: Particionamento de findings por pilar (findings/ + index slim)
**Contexto:** `.legacy-squad/memory/findings.json` é monolítico e carregado integralmente pelos 4 geradores (PRS, SDD, MMP, Specs), mesmo quando cada um precisa apenas de um subconjunto de pilares. Em projeto real validado (~18k LoC, 50 findings) isso força auto-compactação manual da conversa no Claude Code. Relacionado ao DT-009 (custo de contexto dos geradores) — endereça a mitigação (b).
**Alternativas:** (a) manter o monolito; (b) LLM-side filtering (cada gerador lê tudo e descarta o irrelevante — não reduz tokens de entrada); (c) partição por severidade (não casa com o consumo dos geradores, que é por pilar).
**Decisão:** substituir o arquivo único por uma pasta `findings/` contendo `index.json` (slim: `id`, `pillar`, `severity`, `title`, `priority`) + um arquivo por pilar com a evidência completa (`security.json`, `architecture.json`, `legacy-code.json`, `business-rules.json`, `modernization.json`). Pilar sem achados não gera arquivo. O `index.json` é um array de entradas slim — sem `evidence`/`recommendation`/`impact`/`frameworks`. O nome do arquivo deriva do `pillar` convertendo `_`→`-` (ex.: `legacy_code` → `legacy-code.json`). A escrita passa por classe dedicada (`FindingsWriter`) recebendo uma `FileWriterPort` por injeção — porta segregada de `FileSystemPort` (ISP), já que esta é somente-leitura.
**Consequências:** breaking change na estrutura de `memory/`. Requer bump **1.2.0** com migração **assistida via mensagem do `doctor.ts`** (não auto-migração) — a implementação dessa mensagem fica para a Sessão 2 (integração). Os geradores passarão a carregar `index.json` + apenas os arquivos de pilar que consomem. Encerra a escrita inline de findings que hoje existe no `installer.ts` (ver Estado de DA-011, pendência da Sessão 2).

### [2026-06-24] DA-012: Orchestrator `/legacy-squad` com lifecycle dashboard e state detection determinístico
**Contexto:** O framework tem 10 slash commands (5 análise + 4 geradores + scan) mas nenhum ponto de entrada que mostre onde o projeto está no lifecycle (Discovery→Assessment→Design→Planning→Execution) nem qual o próximo passo. Em sessões retomadas (troca de máquina) ou projetos parciais, o dev precisa inspecionar `.legacy-squad/` manualmente. O `Doctor` já faz checagem determinística de presença de arquivos, mas não mapeia o lifecycle nem deriva próximo passo.
**Alternativas:** (a) Slash command puro — template instrui a IA a inspecionar `.legacy-squad/` e renderizar o dashboard; zero código novo, mas estado "calculado" pela IA (não determinístico, pode divergir). (b) Comando de CLI determinístico (`status`) que computa e imprime o dashboard; testável por TDD clássico, mas roda fora da IDE. (c) Híbrido: `LifecycleDetector` determinístico em TS exposto tanto como comando de CLI (`status`, com `--json`) quanto consumido pelo slash command `/legacy-squad`, que renderiza sobre o estado já computado.
**Decisão:** Opção (c). Determinismo onde dá (cálculo de progresso, maturity level e próximo passo em TS testável), IA só para síntese/conversa — mesma linha de DA-004/DA-010. O `LifecycleDetector` recebe `FileSystemPort` (somente-leitura) por injeção (DI/ISP, como DA-011). O estado vira a entidade de domínio `LifecycleSnapshot` em `@legacy-squad/core`. O slash command `/legacy-squad` (arquivo `.claude/commands/legacy-squad.md`, virando comando puro `/legacy-squad`) instrui a IA a rodar `npx legacy-squad status --json` e renderizar sobre o JSON, com fallback de leitura direta. Maturity Level segue FRAMEWORK_SPECIFICATION §10; fases seguem §3. Próximo passo derivado do primeiro gap na ordem canônica (scan → 5 assessments → PRS → SDD → MMP → Specs), o que satisfaz as dependências duras (SDD←architecture-assessment, MMP←modernization-assessment, Specs←MMP) sem regra extra. ERS/Deployability Score ficam fora do detector (saídas qualitativas da IA nos artefatos, não deriváveis por existência de arquivo).
**Consequências:** Novo comando de CLI `status` e novo slash command `/legacy-squad` (alvo 1.3.0). `LifecycleSnapshot` no core consumido por CLI e renderer (Sessão 2). Reusa primitivas de leitura via `FileSystemPort` (`NodeFileSystem` já implementa). Não refatora o `Doctor` (usa `node:fs` direto, `pathExists` privado) — eventual duplicação conceitual de "exists" fica como candidato a DT-011. Entregue em 4 sessões na branch `feat/da-012-orchestrator` (Sessão 1: núcleo do detector via TDD).

### [2026-06-25] DA-013: Caso de uso `Rescanner` consolidando o re-scan (scan + compliance + context + write memory)
**Contexto:** A sequência "scan → effectiveRoot → compliance → grava `memory/`" estava duplicada no `installer.ts` (Steps 1–4) e no comando `scan` da CLI (DT-010). Mudanças no fluxo de escrita exigiam edição em dois lugares; além disso o `scan` gravava a `memory/` parcialmente (sem `context-packs.json`), divergindo do `install`.
**Alternativas:** (a) `MemoryWriter` mínimo — extrai só a gravação de repo-index + findings; (b) `Rescanner` use case — extrai a operação completa de re-scan (scan + compliance + context packs + escrita de toda a `memory/`); (c) refatorar o `Installer` num pipeline de Steps composável.
**Decisão:** Opção (b), variante **full**. `Rescanner` em `@legacy-squad/agents` recebe `FileSystemPort & FileWriterPort` por injeção (mesmo padrão de DA-011/DA-012), compõe `RepoScanner` + `ComplianceEngine` + `ContextBuilder` + `FindingsWriter` e devolve um `RescanResult` (`repoIndex`, `findings`, `contextPacks`, `effectiveRoot`, `requestedRoot`, `memoryDir`, `repoIndexPath`, `findingsPath`, `contextPacksPath`). O `Rescanner` é dono de **toda** a `memory/`. O `Installer` passa a compô-lo + (config, outputs, slash commands, orchestrator, AGENTS.md, install.log); o comando `scan` da CLI vira uma chamada single-line.
**Consequências:** Resolve **DT-010** (single source of truth do re-scan). O método `install` cai de 9 para ~6 responsabilidades. Mudança de comportamento observável: o `scan` agora (re)grava `context-packs.json` — melhoria que alinha o comando à sua descrição ("update .legacy-squad/memory/") e elimina packs obsoletos. `InstallResult` inalterado. Abre caminho para reuso futuro (ex.: re-scan determinístico que o orchestrator possa precisar). Sem bump nesta sessão; o ganho do `scan` pode ser anotado num 1.3.1 futuro. Entregue na branch `refactor/dt-010-rescanner` via TDD estrito.

## Débitos Técnicos

### DT-001: AST-based detection para V2
**Framework:** Scanner V2 (TAS Section 9)
**Risco:** Médio
**Prazo sugerido:** Sprint 5+

### DT-002: Agentes como slash commands na IDE
**Framework:** TAS Section 14-15
**Risco:** Alto — core do modelo AIOX ainda não implementado como install
**Prazo sugerido:** Sprint 2 (próximo)

### DT-003: Regras de segurança para PHP, Java, .NET  ✅ RESOLVIDO 2026-06-09
**Framework:** OWASP ASVS / OWASP Top 10
**Resolução:** 7 novas regras multi-linguagem no catálogo (SEC-SQL-001, SEC-CRYPTO-001, SEC-DESER-001, SEC-CMD-001, SEC-PATH-001, SEC-XSS-001, CQ-DEPRECATED-001). Stack-detector estendido com Symfony, CodeIgniter, ASP.NET Core/.NET Framework, Spring MVC, Java Gradle. Coberto por 25 testes novos (catálogo + detector). Ver DA-008.

### DT-004: Scanner buscar manifesto um nível abaixo do root  ✅ RESOLVIDO 2026-06-09
**Framework:** Scanner V1
**Resolução:** `RepoScanner.resolveRoot()` desce 1 nível se houver subdir único com manifesto; ver DA-007. Coberto por 6 testes (4 unitários + 2 E2E com fs real).

### DT-005: Remover package providers (substituído por IDE-Native)  ✅ RESOLVIDO 2026-06-09
**Framework:** DA-005
**Resolução:** `packages/providers/` removido. `ProviderPort` removido de `core/ports.ts`. Dependência `@legacy-squad/providers` removida do `apps/cli/package.json`. Bundle do CLI ficou ~48KB (sem mudança perceptível). Zero importações residuais.

### DT-006: Suporte Codex (AGENTS.md) e Cursor (.cursor/rules)
**Framework:** TAS Section 14
**Risco:** Médio — Claude Code é primária, outros IDEs são secundários. AGENTS.md já gerado; Cursor pendente.
**Prazo sugerido:** Sprint 5

### DT-007: Regras framework-specific (Eloquent raw, EF Core, Hibernate HQL)
**Framework:** Catálogo de regras
**Risco:** Baixo — regras genéricas por linguagem cobrem 80% do valor. Refinamento de framework cobre os 20% restantes.
**Prazo sugerido:** Sprint 6+

### DT-011: `toPosix` no `prs-generator.ts`  ❌ DESCARTADO 2026-06-25
**Framework:** Clean Architecture (DRY) / DA-006
**Investigação:** Hipótese de que `prs-generator.ts` reimplementaria `toPosix` localmente. Leitura completa do arquivo (`packages/output/src/prs-generator.ts`) descartou a hipótese: não existe `toPosix` local nem `.replace(/\\/g, '/')` inline. O gerador só consome strings já normalizadas a montante (`ev.file` já chega POSIX porque o Compliance Engine usa o `toPosix` centralizado em `@legacy-squad/core/src/paths.ts`). A DA-006 (POSIX em todo output) está sendo honrada sem necessidade de helper local neste módulo.
**Resolução:** Não há débito. Registro mantido para evitar reabertura futura.

### DT-008: Templates de agentes language-agnostic  ✅ RESOLVIDO 2026-06-09
**Framework:** TAS Section 16 — Agentes
**Resolução:** 6 templates de slash command reescritos com seção `## Stack-aware analysis` cobrindo PHP/Laravel/Symfony, .NET/ASP.NET, Java/Spring, React Native/mobile, Node backend. Coberto por 7 testes (multi-stack coverage + bias-check + invariantes de structure). Ver DA-009.

### DT-010: Duplicação de orquestração de escrita de findings  ✅ RESOLVIDO 2026-06-26
**Framework:** Clean Architecture (DRY)
**Contexto:** A sequência `mkdir(memoryDir)` + `new FindingsWriter(fs).write(findings, memoryDir)` era duplicada em `installer.ts` e `apps/cli/src/index.ts` (comando `scan`). Ambos instanciavam `NodeFileSystem` e `FindingsWriter` independentemente.
**Resolução:** Caso de uso `Rescanner` (DA-013, Opção B-full) extraído em `packages/agents/src/rescanner.ts`. `Rescanner` é dono de toda a `memory/` (repo-index + findings particionado + context-packs). O `Installer` compõe `Rescanner` + (config, outputs, slash commands, orchestrator, AGENTS.md, install.log). O comando `scan` da CLI virou single-line via `Rescanner`. Mudança de comportamento: `scan` agora (re)grava `context-packs.json`. 134 testes verdes (131 + 3 do Rescanner). Branch `refactor/dt-010-rescanner`.

### DT-009: Custo de contexto dos geradores consolidados (PRS/SDD/MMP/Specs)
**Framework:** PRD §15 (Riscos técnicos — excesso de contexto)
**Contexto:** Durante a validação ponta-a-ponta da beta.8 num projeto real (~25k LoC, fan-out de 253 arquivos), rodar os 4 geradores em sequência consumiu contexto suficiente para forçar 2 compactações de conversa no Claude Code (Opus médio). Causa: cada gerador lê repo-index + findings + N assessments anteriores; MMP lê SDD; Specs lê MMP. Em projetos grandes o context window vira gargalo.
**Risco:** Médio — não bloqueia uso, mas degrada UX em projetos > 20k LoC ou aumenta custo de chamada de IA.
**Mitigações futuras possíveis:** (a) Templates pedirem output mais conciso por padrão com modo "expansive" opcional via flag; (b) `generate-specs` particionar por pilar (1 chamada por pilar em vez de uma única chamada gerando 37 specs); (c) Context Manager descrito em DA-006 amadurecer para gerar summaries dos assessments antes de alimentar os geradores; (d) Documentar no README a recomendação de rodar geradores em sessões separadas do IDE para projetos grandes.
**Prazo sugerido:** 1.1.x — não bloqueia 1.0.0. Documentar no README como limitação conhecida; tratar como otimização posterior.

## Marcos

### [2026-06-10] 1.0.0 — Saída do beta e primeiro release estável
**Status:** Promovido após validação ponta-a-ponta em projeto real de produção (RN/Expo, ~25k LoC), gerando os 4 artefatos oficiais (PRS, SDD, MMP, 37 Execution Specs) com qualidade adequada para execução. 93 testes verdes, 10 templates de slash command, catálogo de 14 regras multi-stack. V1 do framework agora completo conforme `FRAMEWORK_SPECIFICATION_ENTERPRISE_V1.md`. Saídas registradas em DA-006 a DA-010. Débitos remanescentes: DT-001 (AST), DT-002 (parcial), DT-006 (Cursor/Gemini), DT-007 (framework-specific rules), DT-009 (custo de contexto).

### [2026-06-11] 1.0.1 — Patch de documentação
**Status:** Patch release que corrige inconsistências no README.md e README.pt-br.md detectadas após o publish 1.0.0. 6 seções desatualizadas foram atualizadas: tabela "The Solution" (adicionado SDD/MMP/Specs), Usage with Claude Code (4 geradores listados), Installed Structure (10 templates + 4 pastas de output), Agents (descrição dos 3 novos generators), Compliance Engine (8 → 14 regras com coluna Stacks), Tests (28 → 93). Zero mudança em código de produção, templates ou comportamento — somente documentação. 93 testes continuam verdes.

### [2026-06-21] 1.2.0 — Particionamento de findings por pilar (DA-011)
**Status:** `findings.json` monolítico substituído por `.legacy-squad/memory/findings/` (`index.json` slim + um arquivo por pilar) para reduzir o custo de contexto dos geradores (mitiga DT-009). Breaking change na estrutura de `memory/`; migração assistida via `doctor.ts` (sem auto-migração). Entregue em 4 sessões na branch `feat/da-011-findings-partitioning`; 113 testes verdes. Ver DA-011 e `## Estado de DA-011`.

### [2026-06-25] 1.3.0 — Orchestrator `/legacy-squad` + lifecycle dashboard (DA-012)
**Status:** Framework ganhou ponto de entrada único no IDE — slash command `/legacy-squad` que mostra deterministicamente onde o projeto está no lifecycle (Discovery → Assessment → Design → Planning → Execution), o Maturity Level e o próximo passo. Cálculo via `LifecycleDetector` em TS (DI via `FileSystemPort`), exposto como entidade `LifecycleSnapshot` em `@legacy-squad/core` e como comando de CLI `status` (+`--json`). 131 testes verdes, branch `feat/da-012-orchestrator`. Validado emp. no Claude Code real (`/legacy-squad` aparece em paralelo com `/legacy-squad:<cmd>`, IA dispara `npx legacy-squad status --json` exatamente como contratado pelo template). Ver DA-012 e `## Estado de DA-012`.

### [2026-06-25] 1.3.0 — Patch de documentação (READMEs alinhados à release)
**Status:** Sessão de housekeeping pós-1.3.0. README.md e README.pt-br.md tinham ficado para trás em duas releases (1.2.0 + 1.3.0). Correções aplicadas em paridade nos dois arquivos: formato dos slash commands `/legacy-squad-<cmd>` → `/legacy-squad:<cmd>` (era erro que fazia o usuário copiar comando inválido); `findings.json` → `findings/index.json` (refletindo DA-011); documentação do orchestrator `/legacy-squad` e do comando `status`/`status --json` (entregas da DA-012); 8 health checks → 9; testes 93 → 131; badge `status-beta` → `status-stable`; Cursor marcado como `soon` no tagline, pré-requisitos e diagrama (alinha o doc com o estado real do DT-006, que ainda não entregou suporte Cursor). Hipótese registrada anteriormente de "bug do installer / DA-013 candidato" oficialmente derrubada pela validação empírica da Sessão 2.5 (DA-012): o subdiretório do installer produz corretamente `/legacy-squad:<cmd>` no Claude Code; sem DA-013 a abrir. Zero mudança de código ou comportamento. Issue #10 (DA-012) fechada no GitHub. Pendente: confirmar formato real do Codex CLI (`@legacy-squad-<cmd>` vs alternativa) — sem validação empírica ainda; mantido como está nos READMEs até confirmação.

## Estado de DA-011

### Sessão 1 de 4 — concluída [2026-06-21]
**Escopo:** registro da decisão DA-011 + Fase 1 (classe `FindingsWriter` via TDD estrito). Sem integração com installer/doctor/templates.

**Entregue:**
- DA-011 registrada em `## Decisões Arquiteturais`.
- `toPosix()` promovido para `@legacy-squad/core` (`core/src/paths.ts`, exportado) e reusado; cópia privada removida do `compliance-engine.ts` (refactor puro — testes do `rules` seguem verdes).
- `FileWriterPort` adicionada em `core/src/ports.ts`: porta de escrita segregada de `FileSystemPort` (ISP), já que esta é somente-leitura.
- `FindingsWriter` em `packages/agents/src/findings-writer.ts`: `write(findings, memoryDir)` grava `findings/index.json` (slim: id, pillar, severity, title, priority) + um arquivo por pilar (`<pilar>.json`, slug `_`→`-` via helper privado `pillarToFileName`), pulando pilares sem achados; paths de saída normalizados para POSIX. Recebe `FileWriterPort` por injeção. Exportado em `packages/agents/src/index.ts`.
- 4 testes em `packages/agents/tests/findings-writer.test.ts`: (a) multi-pilar gera index + arquivos completos; (b) pilar vazio não gera arquivo; (c) index slim com exatamente 5 campos; (d) paths POSIX.

**Commits da Sessão 1 (ordem):**
1. `docs(memory): registra DA-011 — particionamento de findings por pilar`
2. `feat(core): adiciona util toPosix e porta FileWriterPort`
3. `test(findings): adiciona testes do FindingsWriter (vermelho)`
4. `feat(findings): implementa FindingsWriter com partição por pilar`
5. `refactor(rules): reusa toPosix do core no compliance-engine`
6. `docs(memory): registra estado da Sessão 1 de DA-011`

**Para a Sessão 2 (integração):**
- **Eliminar a escrita inline de findings no `installer.ts`.** Hoje o `installer.ts` escreve `findings.json` direto via `node:fs/promises` (`writeFile(findingsPath, JSON.stringify(findings...))`), violando a regra "toda escrita em `memory/` passa por classe dedicada". A Sessão 2 precisa **remover esse `writeFile` inline** e passar a escrever via `FindingsWriter`, além de fazer o `NodeFileSystem` (ou um adapter) implementar `FileWriterPort`.
- Atualizar os 9 templates de slash command em `templates/claude-commands/` que apontam para `findings.json`, para lerem `findings/index.json` + os arquivos de pilar relevantes a cada gerador.
- Atualizar o `doctor.ts` com a mensagem de migração (estrutura antiga → nova), sem auto-migração, incluindo estratégia de abort/aviso para `findings.json` legado.
- Bump de versão para 1.2.0 fica para o fim da feature (não nesta sessão).

**A registrar após o merge de DA-011:** DT-010 — duplicação remanescente de `toPosix` no `prs-generator.ts` (não tocado nesta feature) e duplicação de lógica `installer.ts` ↔ `apps/cli/src/index.ts`.

### Sessão 2 de 4 — concluída [2026-06-21]
**Escopo:** integração do `FindingsWriter` — `NodeFileSystem` implementa `FileWriterPort`; escrita inline de `findings.json` eliminada do `installer.ts` e do comando `scan` da CLI; testes de integração adicionados; DT-010 registrado.

**Entregue:**
- `packages/scanner/tests/node-filesystem.test.ts` (novo): 3 testes de `FileWriterPort` com fs real (mkdtemp) — writeFile round-trip, mkdir idempotente, writeFile em dir inexistente rejeita.
- `NodeFileSystem` em `packages/scanner/src/node-filesystem.ts`: implementa `FileSystemPort, FileWriterPort`; métodos `mkdir` (recursive) e `writeFile` (UTF-8) com TSDoc.
- `core/src/ports.ts`: pré-condição documentada em `FileWriterPort.writeFile`.
- `packages/agents/src/installer.ts`: `writeFile(findingsPath, ...)` inline substituído por `new FindingsWriter(fs).write(findings, memoryDir)`; `findingsPath` aponta para `findings/index.json`; TSDoc de `InstallResult.findingsPath` atualizado.
- `packages/agents/tests/agents.test.ts`: asserts de DA-011 no teste DT-004 (index.json existe, findings.json não existe); novo describe `Installer — DA-011` com 1 teste de integração ponta-a-ponta.
- `apps/cli/src/index.ts` (comando `scan`): escrita inline de `findings.json` substituída por `FindingsWriter`.
- DT-010 registrado em `## Débitos Técnicos`.
- 101 testes verdes (97 anteriores + 4 novos).

**Commits da Sessão 2 (ordem):**
1. `test(scanner): adiciona testes de FileWriterPort no NodeFileSystem (vermelho)`
2. `feat(scanner): NodeFileSystem implementa FileWriterPort`
3. `refactor(agents): installer usa FindingsWriter via FileWriterPort`
4. `refactor(cli): apps/cli usa FindingsWriter via FileWriterPort`
5. `docs(memory): registra DT-010 — duplicação de orquestração de escrita de findings`
6. `docs(memory): registra estado da Sessão 2 de DA-011`

**Para a Sessão 3 (templates + doctor):**
- Atualizar os 9 templates de slash command em `templates/claude-commands/` que apontam para `findings.json` legado, para lerem `findings/index.json` + arquivos de pilar relevantes a cada gerador.
- Atualizar o `doctor.ts` com mensagem de migração assistida (estrutura antiga → nova), sem auto-migração, com aviso para `findings.json` legado detectado.
- Bump de versão para 1.2.0 fica para o fim da feature (Sessão 4).

### Sessão 3 de 4 — concluída [2026-06-21]
**Escopo:** migração dos 9 templates de slash command para a estrutura particionada + check de migração no `doctor.ts`. Sem bump de versão (Sessão 4).

**Entregue:**
- `packages/agents/tests/doctor.test.ts` (novo): 3 testes com fs real — (a) `findings/index.json` presente → ok; (b) `findings.json` legado sem `findings/` → error com mensagem de migração; (c) nenhum → error sem mensagem de migração.
- `packages/agents/src/doctor.ts`: `checkFindingsStructure()` com TSDoc substitui `checkFile(...findings.json...)` em `check()`; helper privado `pathExists()`.
- `packages/agents/tests/agents.test.ts`: 9 novos asserts no bloco DT-008 — 4 templates de análise referenciam `findings/<pilar>.json`, 4 geradores referenciam `findings/index.json`, `scan.md` referencia `findings/index.json`; nenhum referencia `memory/findings.json` monolítico.
- `templates/claude-commands/` (9 arquivos): substituição cirúrgica da linha de contexto `findings.json` → estrutura particionada. Mapeamento: analysis 1:1 com pilar + `index.json`; geradores com `index.json` + pilares relevantes; `scan.md` verificação atualizada.
- 113 testes verdes (101 anteriores + 3 doctor + 9 novos asserts DT-008).

**Commits da Sessão 3 (ordem):**
1. `test(agents): doctor detecta findings.json legado e estrutura nova (vermelho)`
2. `feat(agents): doctor sinaliza estrutura legada e orienta re-install (sem auto-migração)`
3. `test(agents): templates devem referenciar findings/ particionado (vermelho)`
4. `feat(templates): migra slash commands de findings.json para findings/`
5. `docs(memory): registra estado da Sessão 3 de DA-011`

**Para a Sessão 4 (encerramento da DA-011):**
- Validação E2E com `npx legacy-squad install` em projeto real (confirmar que a estrutura `findings/` é gerada corretamente e o `doctor` passa).
- Atualização do `ROADMAP.md` registrando a DA-011 como entregue em v1.2.0.
- Bump de versão para 1.2.0 nos `package.json` relevantes.
- Fechamento formal da DA-011 no `memory.md` (status final).

### Sessão 4 de 4 — concluída [2026-06-21]
**Escopo:** validação E2E da partição via CLI real, bump 1.2.0 e fechamento da DA-011.

**Entregue:**
- **Validação E2E:** `npx legacy-squad install` em projeto real gerou `.legacy-squad/memory/findings/index.json` (array slim) + arquivos por pilar; `findings.json` monolítico ausente; `npx legacy-squad doctor` reportou a estrutura de findings como `ok`.
- **Bump 1.2.0** sincronizado em `package.json` (raiz), `.version()` da CLI (`apps/cli/src/index.ts`) e `framework_version` do `installer.ts` (todos saindo de `1.0.0`/`1.0.1`).
- `ROADMAP.md` atualizado: header para `v1.2.0` e item "Partitioned findings store" em Shipped.
- Marco 1.2.0 registrado em `## Marcos`; DA-011 fechada (abaixo).
- 113 testes verdes mantidos.

**Commits da Sessão 4 (ordem):**
1. `chore(release): bump versão para 1.2.0 e sincroniza strings de versão`
2. `docs: atualiza ROADMAP para 1.2.0 (findings particionado por pilar)`
3. `docs(memory): fecha DA-011 e registra Sessão 4 + marco 1.2.0`

### DA-011 — concluída [2026-06-21]
**Status:** entregue em **1.2.0** ao longo de 4 sessões. O `findings.json` monolítico foi substituído por `.legacy-squad/memory/findings/` com `index.json` slim + um arquivo por pilar — escrita via `FindingsWriter` + `FileWriterPort` (porta segregada, ISP), integrada no `installer.ts` e no comando `scan` da CLI; 9 templates migrados; `doctor.ts` detecta estrutura legada e orienta re-install sem auto-migração. Débito remanescente: **DT-010** (duplicação de orquestração de escrita installer ↔ CLI). Follow-up não numerado: dedup de `toPosix` no `prs-generator.ts` (candidato a DT-011). Passos manuais pós-fechamento: merge do PR + `npm publish` da 1.2.0 (estável).

## Estado de DA-012

### Sessão 1 de 4 — concluída [2026-06-24]
**Escopo:** registro da decisão DA-012 + núcleo determinístico (`LifecycleDetector` via TDD estrito). Sem CLI, sem slash command, sem installer/doctor.

**Entregue:**
- DA-012 registrada em `## Decisões Arquiteturais`.
- Entidades de lifecycle em `@legacy-squad/core` (`core/src/entities.ts`, reexportadas pelo barrel): `MaturityLevel`, `LifecyclePhaseId`, `LifecycleStepStatus`, `LifecyclePhaseStatus`, `LifecycleNextStep`, `LifecycleSnapshot`.
- `LifecycleDetector` em `packages/agents/src/lifecycle-detector.ts`: `detect(projectRoot)` computa o `LifecycleSnapshot` deterministicamente a partir da existência dos artefatos canônicos; recebe `FileSystemPort` por injeção (DI/ISP, reusa `exists`/`readFile`); paths canônicos como constantes; próximo passo = primeiro gap na ordem canônica (scan → 5 assessments → PRS → SDD → MMP → Specs); Maturity Level §10 (specs→5, mmp→4, 5 assessments→3, scan→2, senão 1). Exportado em `packages/agents/src/index.ts`.
- 7 testes em `packages/agents/tests/lifecycle-detector.test.ts` com mock de `FileSystemPort`: não-instalado, scan-only, parcial 3/5, 5 assessments sem PRS, dependência dura (não sugere generate-mmp sem modernization-assessment), MMP→specs, completo.
- 120 testes verdes (113 anteriores + 7 novos). Sem refactor adicional (código saiu limpo).

**Paths canônicos fixados (lidos dos templates de análise/geradores):**
- assessments: `outputs/assessments/{security,architecture,legacy-code,business-rules,modernization}-assessment.md`
- artefatos: `outputs/reports/PRS.md`, `outputs/sdd/SDD.md`, `outputs/mmp/MMP.md`, `outputs/specs/INDEX.md`

**Commits da Sessão 1 (ordem):**
1. `docs(memory): registra DA-012 — orchestrator /legacy-squad com lifecycle dashboard`
2. `feat(core): adiciona entidades de lifecycle (LifecycleSnapshot e tipos)`
3. `test(agents): adiciona testes do LifecycleDetector (vermelho)`
4. `feat(agents): implementa LifecycleDetector determinístico via FileSystemPort`
5. `docs(memory): registra estado da Sessão 1 de DA-012`

**Para a Sessão 2 (CLI status + renderer):**
- Adicionar comando `status` em `apps/cli/src/index.ts` que instancia `LifecycleDetector` (com `NodeFileSystem`) e imprime o dashboard; flag `--json` emite o `LifecycleSnapshot` cru (contrato consumido pelo slash command na Sessão 3).
- Criar `DashboardRenderer` como função pura `snapshot → string` (SRP, testável isolado), com testes determinísticos de formatação.
- Sem bump de versão (Sessão 4).

### Sessão 2 de 4 — concluída [2026-06-24]
**Escopo:** comando de CLI `status` (+`--json`) e `DashboardRenderer`; correção do formato dos slash commands no detector (consequência da Sessão 1). Sem slash command orchestrator (Sessão 3), sem bump (Sessão 4).

**Correção da Sessão 1:** o formato real dos slash commands é flat com prefixo hífen — `/legacy-squad-<cmd>` (arquivos `legacy-squad-<cmd>.md` em `.claude/commands/`), não namespace `:`. O detector emitia `/legacy-squad:<cmd>`; corrigido em `STEPS` (command + reason) e nos 2 asserts do teste. Confirmado pelo texto do `install`, que sempre usou hífen.

**Entregue:**
- `packages/output/src/dashboard-renderer.ts`: `DashboardRenderer.render(snapshot)` — função pura (não lê fs, não deriva estado; só formata o `LifecycleSnapshot`). Ícones de fase `✓`/`◐`/`·`; nomes curtos (PRS/SDD/MMP/Specs) via mapa de apresentação com fallback para o id; estados "não instalado" e "completo" tratados. Exportado no barrel de `@legacy-squad/output`.
- `packages/output/tests/dashboard-renderer.test.ts` (novo; pasta `tests/` criada): 4 testes via `toContain`/`toMatch` (scan-only, fase parcial com `◐` e `3/6`, completo sem "próximo passo", não-instalado); um assert garante que o formato `:` não vaza.
- `apps/cli/src/index.ts`: comando `status` com `--json`; fiação `LifecycleDetector` (NodeFileSystem) → `DashboardRenderer` → `console.log`. Imports de `LifecycleDetector` (@legacy-squad/agents) e `DashboardRenderer` (@legacy-squad/output) adicionados.
- Smoke manual: `status` e `status --json` na raiz (sem `.legacy-squad`) renderizam o estado "não instalado" corretamente.
- 124 testes verdes (120 + 4 do renderer; detector mantém 7).

**Commits da Sessão 2 (ordem):**
1. `test(agents): ajusta asserts do detector para o formato real /legacy-squad-<cmd> (vermelho)`
2. `fix(agents): detector emite slash commands no formato /legacy-squad-<cmd>`
3. `test(output): adiciona testes do DashboardRenderer (vermelho)`
4. `feat(output): implementa DashboardRenderer + export no barrel`
5. `feat(cli): adiciona comando status com --json (dashboard do lifecycle)`
6. `docs(memory): registra estado da Sessão 2 de DA-012`

**Para a Sessão 3 (slash command orchestrator + integração):**
- Criar `templates/claude-commands/legacy-squad.md` (orchestrator `/legacy-squad`): instrui a IA a rodar `npx legacy-squad status --json` e renderizar/explicar sobre o JSON, com fallback de leitura direta de `.legacy-squad/`; respeita a ordem canônica e oferece o próximo passo.
- Ajustar o `installer.ts` para copiar o orchestrator. **Confirmar primeiro** como os comandos são instalados (flat com prefixo `legacy-squad-`): o orchestrator deve virar `legacy-squad.md` → `/legacy-squad`. Reler o `installer.ts` antes de mexer.
- Ajustar `doctor.ts`/teste de invariante de template se fizer sentido (verificar orchestrator instalado).
- Sem bump (Sessão 4).

**Nota:** smoke com estados parciais/completo exige projeto instrumentado (usar `C:\Temp\ls-e2e` no E2E da Sessão 4).

### Sessão 2.5 — correção de formato [2026-06-25]
**Motivo:** validação empírica no Claude Code (CLI nativo, instalado no Windows) provou que o formato real dos slash commands instalados em subdiretório é namespace com dois-pontos — `/legacy-squad:<cmd>` — e que o `/legacy-squad` puro (arquivo `legacy-squad.md` na raiz de `commands`) aparece em paralelo, comprovando que o orchestrator pode usar esse caminho. O autocomplete listou exatamente: `/legacy-squad`, `/legacy-squad:scan`, `/legacy-squad:security`, `/legacy-squad:legacy-code`, `/legacy-squad:generate-prs`.

**O que estava errado:**
- A Sessão 1 usava `:` (correto), mas eu reli o texto do `install` em `apps/cli/src/index.ts` e dele extraí `-` como formato real — enganado por strings hardcoded que estavam erradas desde antes da DA-012.
- A Sessão 2 trocou detector + renderer + testes para `-` em cima dessa premissa falsa.
- Documentação oficial atual do Claude Code afirma que subdiretório só afeta a descrição, não o nome — contradiz a evidência, então a doc está desatualizada. A tela do autocomplete é a fonte de verdade.

**Entregue (correção):**
- `packages/agents/src/lifecycle-detector.ts`: reverte os 10 `command`/`reason` para `/legacy-squad:<cmd>`; atualiza comentário do `STEPS` descrevendo o esquema real (subdir → namespace `:`).
- `packages/agents/tests/lifecycle-detector.test.ts`: 2 asserts de comando voltam para `:`.
- `packages/output/tests/dashboard-renderer.test.ts`: todos os mocks de comando trocados para `:`; salvaguarda invertida (`not.toContain('/legacy-squad-')`) agora prova que o formato `-` não vaza.
- `apps/cli/src/index.ts`: 9 strings de comando no texto do `install` corrigidas (`/legacy-squad:<cmd>`).
- `DashboardRenderer` em si não foi alterado — ele só repassa o `command` do snapshot; renderer continua agnóstico ao separador.
- Não há DA-013: o installer (subdir) está correto, não há migração de esquema.
- 124 testes verdes esperados.

**Commits da correção:**
1. `test(agents): asserts do detector voltam para /legacy-squad:<cmd> (vermelho)`
2. `fix(agents): detector emite slash commands no formato /legacy-squad:<cmd>`
3. `test(output): ajusta asserts do renderer para o formato /legacy-squad:<cmd>`
4. `fix(cli): corrige texto do install para o formato real /legacy-squad:<cmd>`
5. `docs(memory): registra correção empírica de formato (Sessão 2.5)`

**Aprendizado:** decisões sobre comportamento observável exigem validação empírica antes da implementação, não leitura de doc nem inspeção de strings de UI. Antes da Sessão 3, sempre rodar `claude` num projeto-cobaia se o comportamento envolver o IDE.

### Sessão 3 de 4 — concluída [2026-06-25]
**Escopo:** template do orchestrator `/legacy-squad`; integração no `installer.ts` (cópia para a raiz de `commands`); check do orchestrator no `doctor.ts`; invariantes de template (DT-008). Sem E2E (Sessão 4), sem bump (Sessão 4).

**Pré-leitura (lição da 2.5):** reli `installer.ts`, `doctor.ts`, `agents.test.ts` e um template de referência antes de tocar em qualquer coisa.

**Entregue:**
- `templates/claude-commands/legacy-squad.md` (novo): instrui a IA a rodar `npx legacy-squad status --json`; declara **fallback** de leitura direta de `.legacy-squad/` (`repo-index.json`, `findings/index.json`, assessments, artefatos); reforça a ordem canônica do lifecycle (FRAMEWORK_SPEC §3); orienta a oferecer o `snapshot.nextStep` ao usuário antes de executar qualquer coisa; explicita que **não** escreve em `.legacy-squad/outputs/`.
- `packages/agents/src/installer.ts`: novo método `copyOrchestrator(templateDir, commandsRoot)` (SRP, mesmo estilo silencioso de `copySlashCommands`). Step 7 do `install()` agora extrai `claudeCommandsRoot` (`.claude/commands`) e chama `copyOrchestrator` depois de `copySlashCommands`. Resultado: `.claude/commands/legacy-squad/<cmd>.md` (subdir, vira `/legacy-squad:<cmd>`) **e** `.claude/commands/legacy-squad.md` (raiz, vira `/legacy-squad` puro). `copySlashCommands` não foi alterado.
- `packages/agents/src/doctor.ts`: novo check `Orchestrator /legacy-squad` para `.claude/commands/legacy-squad.md`.
- `packages/agents/tests/agents.test.ts`: nova suite `Orchestrator /legacy-squad — DA-012` com 5 testes (existe; instrui `status --json`; declara fallback com paths canônicos; reforça fases + nextStep; installer copia para a raiz, **não** para o subdir).
- `packages/agents/tests/doctor.test.ts`: 2 testes novos (orchestrator presente → ok; ausente → error).
- 131 testes verdes (124 + 5 do orchestrator + 2 do doctor).

**Decisões de implementação (visíveis nos diffs):**
- O orchestrator vive em `.claude/commands/legacy-squad.md` (raiz), não em `.claude/commands/legacy-squad/legacy-squad.md`. Validado emp. na Sessão 2.5 (autocomplete listou `/legacy-squad` em paralelo com `/legacy-squad:scan` etc.).
- O orchestrator delega o cálculo do estado ao `LifecycleDetector` via `npx legacy-squad status --json` — a IA não inventa progresso. Fallback (leitura direta de `.legacy-squad/`) cobre o caso de o `status` não estar disponível; em ambos os caminhos as fontes de verdade são os mesmos arquivos canônicos.
- Doctor agora cobre **7+1+1** ítens (estrutura existente + orchestrator); testes existentes do doctor selecionam por `name`, não por contador total — nada quebrou.

**Commits da Sessão 3 (ordem):**
1. `feat(templates): adiciona orchestrator /legacy-squad (template para Claude Code)`
2. `test(agents): adiciona invariantes do orchestrator e teste do install na raiz de commands (DT-008 + DA-012)`
3. `feat(agents): installer copia legacy-squad.md para .claude/commands/ (raiz, não subdir)`
4. `test(agents): adiciona check do orchestrator no doctor (DA-012)`
5. `feat(agents): doctor verifica presença do orchestrator /legacy-squad`
6. `docs(memory): registra estado da Sessão 3 de DA-012`

**Para a Sessão 4 (E2E + release):**
- Validar emp. no `appcooperado-main` (já tem framework instalado): re-rodar `npx tsx apps/cli/src/index.ts install` para entregar o orchestrator; abrir `claude` e confirmar que `/legacy-squad` aparece com a descrição do novo template; pedir `/legacy-squad` ao Claude e verificar que ele chama `npx legacy-squad status --json` e renderiza/orienta corretamente.
- Validar em projeto fresco (`C:\Temp\ls-e2e`) o ciclo não-instalado → scan-only → com assessment parcial, verificando que o dashboard responde corretamente em cada estado.
- Bump 1.3.0 (`package.json` + `framework_version` no `installer.ts`), publish `--access public`, marco 1.3.0 no `memory.md`, atualizar ROADMAP em Shipped.

### Sessão 4 de 4 — concluída [2026-06-25]
**Escopo:** validação empírica no Claude Code real + bump 1.3.0 + atualização de ROADMAP. Sem código novo de produto (só strings de versão e docs).

**E2E entregue:**
- Reinstalação do framework em `appcooperado-main` (instalação nested em `appcooperado-main\appcooperado-main`): 9/9 checks no `doctor` (era 8/8; entrou `Orchestrator /legacy-squad`).
- Conferido fisicamente em disco que o template do orchestrator aterrissou em `.claude/commands/legacy-squad.md` (raiz, 2876 bytes, conteúdo do template) e os 10 comandos no subdir `.claude/commands/legacy-squad/`.
- No Claude Code: autocomplete listou `/legacy-squad` puro com a descrição do novo template (`"Você é o **Orchestrator** do Legacy Squad Framework..."`), em paralelo com `/legacy-squad:scan` etc.
- Ao invocar `/legacy-squad`, o Claude Code disparou exatamente o comando contratado pelo template: `npx legacy-squad status --json`. O contrato orchestrator → detector ficou comprovado ponta a ponta.
- O comando em si retornaria erro até a 1.3.0 ser publicada (a 1.2.0 no npm não tem o `status`) — esse é o motivo de o release ser o passo seguinte, não anterior. Validação final do fluxo IA → `status --json` fica como pós-release.
- Resto da Sessão 3.5 (lixo do teste de plantão no nivel pai do `appcooperado-main`) limpo.

**Achado para futuro DT:** o comando `status` não reusa a heurística de aninhamento do `RepoScanner` (DT-004) — ele resolve para o `.legacy-squad/` do path passado, não detecta automaticamente quando o projeto real está um nível abaixo. Em projetos com manifesto aninhado isso entrega um dashboard "vazio" enganador. Candidato a DT-011 (numeração livre depois da DA-011) ou no próximo disponível.

**Release 1.3.0 (estes commits ainda vão ser feitos manualmente):**
- `package.json`: 1.2.0 → **1.3.0**.
- `apps/cli/src/index.ts`: `program.version('1.2.0')` → **`'1.3.0'`**.
- `packages/agents/src/installer.ts`: `framework_version: '1.2.0'` → **`'1.3.0'`** (único ponto de truth de versão que ainda o installer escreve no `project.yaml` do projeto-alvo).
- `ROADMAP.md`: header em 1.3.0 + DA-012 em Shipped (orchestrator `/legacy-squad`, dashboard, status CLI).
- `memory.md`: este registro + fechamento da DA-012 e marco 1.3.0 (logo abaixo).

**Commits da Sessão 4 (ordem):**
1. `chore(release): bump versão para 1.3.0 e sincroniza strings de versão`
2. `docs: atualiza ROADMAP para 1.3.0 (orchestrator /legacy-squad)`
3. `docs(memory): fecha DA-012 e registra Sessão 4 + marco 1.3.0`

### DA-012 — concluída [2026-06-25]
**Status:** entregue em **1.3.0** ao longo de 4 sessões (+ 1 correção 2.5 de formato). O framework ganhou um ponto de entrada único no IDE — o slash command `/legacy-squad` — que mostra deterministicamente onde o projeto está no lifecycle (Discovery → Assessment → Design → Planning → Execution), o `Maturity Level` (FRAMEWORK_SPEC §10) e qual o próximo passo. Cálculo do estado feito pelo `LifecycleDetector` em TS, via `FileSystemPort` injetada, exposto como entidade de domínio `LifecycleSnapshot` em `@legacy-squad/core` e como comando de CLI `status` (+`--json`). O orchestrator-slash chama o `status --json` e renderiza/orienta sem inventar progresso. Total: **131 testes verdes**, **6 novos arquivos**, **branch `feat/da-012-orchestrator`**. Débito candidato remanescente: `status` não-aware-de-aninhamento (DT a numerar). Passos manuais pós-fechamento: merge do PR + `npm publish` da 1.3.0 (estável); reinstalar no `appcooperado-main` com a 1.3.0 publicada para fechar o E2E do `/legacy-squad → status --json`.

## Estado de DA-013

### Sessão única — concluída [2026-06-26]
**Escopo:** extração do caso de uso `Rescanner` via TDD estrito (Red → Green → Refactor), resolvendo DT-010.

**Entregue:**
- DA-013 registrada em `## Decisões Arquiteturais`.
- `packages/agents/src/rescanner.ts` (novo): classe `Rescanner` + interface `RescanResult`. Recebe `FileSystemPort & FileWriterPort` por injeção (mesmo padrão DA-011/DA-012). Compõe `RepoScanner` + `ComplianceEngine` + `ContextBuilder` + `FindingsWriter`. Grava toda a `memory/` (`repo-index.json`, `findings/` particionado, `context-packs.json`). TSDoc completo.
- `packages/agents/src/index.ts`: exporta `Rescanner` e `RescanResult`.
- `packages/agents/tests/rescanner.test.ts` (novo): 3 testes com real temp dir + `NodeFileSystem` — (a) memory completa gravada incl. context-packs e sem findings.json monolítico; (b) effectiveRoot aninhado (DT-004) grava em inner/; (c) RescanResult com paths corretos.
- `packages/agents/src/installer.ts`: Steps 1–4 substituídos por `Rescanner.rescan()`; imports órfãos removidos (`RepoScanner`, `ComplianceEngine`, `ContextBuilder`, `FindingsWriter`, `cp`). `InstallResult` inalterado.
- `apps/cli/src/index.ts`: comando `scan` virou single-line via `Rescanner`; imports órfãos removidos (`RepoScanner`, `ComplianceEngine`, `FindingsWriter`, `await import('node:fs/promises')`). Imports de `@legacy-squad/rules` e `@legacy-squad/scanner/RepoScanner` eliminados da CLI.
- Mudança de comportamento: `scan` agora (re)grava `context-packs.json` — alinha o comando à sua descrição e elimina packs obsoletos.
- DT-010 marcado como RESOLVIDO.
- 134 testes verdes (131 + 3 do Rescanner). Zero regressão.

**Commits (ordem):**
1. `docs(memory): registra DA-013 — Rescanner use case (resolve DT-010)`
2. `test(agents): adiciona testes do Rescanner (vermelho)`
3. `feat(agents): implementa Rescanner + export no barrel`
4. `refactor(agents): installer compõe Rescanner e elimina escrita inline de memory`
5. `refactor(cli): comando scan usa Rescanner (DT-010)`
6. `docs(memory): fecha DT-010 e registra Sessão DA-013`

### DA-013 — concluída [2026-06-26]
**Status:** entregue em sessão única na branch `refactor/dt-010-rescanner` via TDD estrito. `Rescanner` é a single source of truth do re-scan, composta pelo `Installer` e pelo comando `scan` da CLI. DT-010 resolvido. Sem bump nesta sessão; ganho do `scan` pode ser anotado num 1.3.1 futuro. Passos manuais pós-fechamento: merge do PR.
