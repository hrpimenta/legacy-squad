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

### DT-008: Templates de agentes language-agnostic  ✅ RESOLVIDO 2026-06-09
**Framework:** TAS Section 16 — Agentes
**Resolução:** 6 templates de slash command reescritos com seção `## Stack-aware analysis` cobrindo PHP/Laravel/Symfony, .NET/ASP.NET, Java/Spring, React Native/mobile, Node backend. Coberto por 7 testes (multi-stack coverage + bias-check + invariantes de structure). Ver DA-009.

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
