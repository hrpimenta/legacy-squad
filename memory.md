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

### DT-008: Templates de agentes language-agnostic
**Framework:** TAS Section 16 — Agentes
**Risco:** Médio — templates atuais têm viés mobile/RN (AsyncStorage, LGPD/CPF). Quando o framework rodar em PHP/.NET/Java, os assessments precisam refletir as patterns dessas linguagens.
**Prazo sugerido:** PR 2 do Track A (próximo)
