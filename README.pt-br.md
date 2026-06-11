<p align="center">
  <h1 align="center">Legacy Squad Framework</h1>
  <p align="center"><strong>Plataforma de Modernização de Legados com IA</strong></p>
  <p align="center"><em>Understand. Plan. Modernize.</em></p>
  <p align="center">
    <strong>🇧🇷 Português</strong> · <a href="README.md">🇺🇸 English</a>
  </p>
</p>

---

Legacy Squad é um framework open-source que se instala dentro do seu projeto legado com um único comando, analisa automaticamente o código-fonte e disponibiliza agentes de IA especializados na sua IDE para produzir um diagnóstico completo — sem alterar uma linha de código.

```bash
npx legacy-squad install
```

---

## O Problema

Sistemas legados sustentam processos críticos, mas frequentemente apresentam:

- Documentação inexistente ou desatualizada
- Credenciais hardcoded em código-fonte
- Regras de negócio escondidas em condicionais que ninguém documentou
- Acoplamento que torna qualquer mudança arriscada
- Medo de alterar código em produção
- Dependência de 1-2 desenvolvedores que "conhecem o sistema"

Abordagens tradicionais (reescrita total, refatoração sem governança) são caras, lentas e arriscadas.

## A Solução

Legacy Squad combina **análise determinística** (scanner + compliance engine com regras OWASP/CWE) com **agentes de IA especializados** que rodam na sua IDE (Claude Code, Codex, Cursor) para produzir:

| Artefato | O que faz |
|----------|-----------|
| **Repo Index** | Inventário completo: stack, módulos, dependências, integrações, hotspots |
| **Findings** | Achados de segurança com evidência, impacto, referência OWASP e recomendação |
| **Security Assessment** | Análise profunda de autenticação, secrets, LGPD/GDPR, API security |
| **Architecture Assessment** | Mapeamento C4, acoplamento, riscos estruturais, arquitetura alvo |
| **Legacy Code Assessment** | Hotspots, migração JS→TS, duplicação, cobertura de testes |
| **Business Rules Assessment** | 60+ regras extraídas do código, preservation checklist |
| **Modernization Assessment** | Roadmap incremental em fases com rollback e scores |
| **PRS** | Product Refactor Specification — relatório consolidado de diagnóstico |
| **SDD** | Software Design Document — arquitetura atual/alvo com ADRs |
| **MMP** | Modernization Master Plan — roadmap em fases com scores de Execution Readiness e Deployability |
| **Execution Specs** | Unidades de trabalho atômicas, individualmente deployáveis, com critérios de aceite binários e rollback |

---

## Quick Start

### Pré-requisitos

- Node.js ≥ 18
- Uma IDE com IA: [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Codex CLI](https://github.com/openai/codex) ou [Cursor](https://cursor.sh)

### Instalação

```bash
cd seu-projeto-legado
npx legacy-squad install
```

O comando:
1. Detecta a stack (React Native, PHP, .NET, Java, Node — por manifesto)
2. Escaneia o repositório e gera o inventário
3. Roda o Compliance Engine (regras OWASP/CWE)
4. Gera Context Packs por módulo
5. Instala agentes como slash commands na IDE
6. Verifica a instalação (8 checks)

### Uso com Claude Code

```bash
claude                              # Abre Claude Code no projeto

# Passo 1 — Análise (5 agentes, rodar em ordem)
/legacy-squad-security              # Security Agent
/legacy-squad-architecture          # Architecture Agent
/legacy-squad-legacy-code           # Legacy Code Agent
/legacy-squad-business-rules        # Business Rules Agent
/legacy-squad-modernization         # Modernization Agent

# Passo 2 — Artefatos consolidados (4 geradores, rodar após a análise)
/legacy-squad-generate-prs          # Product Refactor Specification
/legacy-squad-generate-sdd          # Software Design Document
/legacy-squad-generate-mmp          # Modernization Master Plan
/legacy-squad-generate-specs        # Execution Specs (um YAML por unidade de trabalho)
```

### Uso com Codex CLI

```bash
codex                               # Abre Codex no projeto
# O AGENTS.md na raiz define os agentes disponíveis
@legacy-squad-security              # Ativa o Security Agent
```

### Outros Comandos

```bash
npx legacy-squad scan               # Re-escaneia sem reinstalar agentes
npx legacy-squad doctor             # Verifica saúde da instalação
```

---

## Como Funciona

```
                    ┌─────────────────────┐
                    │ npx legacy-squad    │
                    │     install         │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐  ┌────────────┐  ┌────────────┐
        │ Scanner  │  │ Compliance │  │  Context   │
        │ (stack,  │  │  Engine    │  │  Manager   │
        │ módulos) │  │ (OWASP)   │  │ (packs)    │
        └────┬─────┘  └─────┬──────┘  └─────┬──────┘
             │               │               │
             ▼               ▼               ▼
        ┌──────────────────────────────────────────┐
        │        .legacy-squad/memory/             │
        │  repo-index.json | findings.json |       │
        │  context-packs.json                      │
        └──────────────────┬───────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ .claude/ │ │ AGENTS.md│ │ .cursor/ │
        │ commands/│ │ (Codex)  │ │ rules/   │
        │ (Claude) │ │          │ │ (Cursor) │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │             │             │
             └─────────────┼─────────────┘
                           │
                    ┌──────▼──────┐
                    │  IDE + IA   │
                    │ (Claude Code│
                    │  Codex,     │
                    │  Cursor)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Assessments │
                    │ + PRS final │
                    └─────────────┘
```

**O framework prepara os dados e instala os agentes. A IA é executada pela IDE do dev.**

Zero API key necessária. Zero chamada a servidor externo. Tudo local.

---

## Estrutura Instalada no Projeto

Após `npx legacy-squad install`:

```
seu-projeto/
├── .legacy-squad/
│   ├── config/
│   │   └── project.yaml              # Configuração detectada
│   ├── memory/
│   │   ├── repo-index.json            # Inventário do repositório
│   │   ├── findings.json              # Achados do compliance engine
│   │   └── context-packs.json         # Contexto por módulo
│   ├── outputs/
│   │   ├── assessments/               # Assessments dos agentes (5 .md)
│   │   ├── reports/                   # PRS.md + PRS.json
│   │   ├── sdd/                       # SDD.md + SDD.json
│   │   ├── mmp/                       # MMP.md + MMP.json
│   │   └── specs/                     # SPEC-*.yaml + INDEX.md
│   └── logs/
│       └── install.log
├── .claude/
│   └── commands/
│       └── legacy-squad/
│           ├── security.md            # /legacy-squad-security
│           ├── architecture.md        # /legacy-squad-architecture
│           ├── legacy-code.md         # /legacy-squad-legacy-code
│           ├── business-rules.md      # /legacy-squad-business-rules
│           ├── modernization.md       # /legacy-squad-modernization
│           ├── generate-prs.md        # /legacy-squad-generate-prs
│           ├── generate-sdd.md        # /legacy-squad-generate-sdd
│           ├── generate-mmp.md        # /legacy-squad-generate-mmp
│           ├── generate-specs.md      # /legacy-squad-generate-specs
│           └── scan.md                # /legacy-squad-scan
└── AGENTS.md                          # Compatibilidade Codex
```

---

## Agentes

### Security Agent (`/legacy-squad-security`)

Analisa autenticação, secrets, armazenamento inseguro, exposição de PII e conformidade com leis de privacidade (LGPD, GDPR).

**Referências:** OWASP MASVS V2, OWASP ASVS, CWE Top 25, LGPD, GDPR, NIST SSDF

### Architecture Agent (`/legacy-squad-architecture`)

Mapeia arquitetura atual com diagramas C4, identifica acoplamento, riscos estruturais e propõe arquitetura alvo incremental.

**Referências:** C4 Model, Clean Architecture, arc42, ADR

### Legacy Code Agent (`/legacy-squad-legacy-code`)

Identifica hotspots, duplicação, progresso de migração JS→TS, cobertura de testes e prioridades de refatoração.

**Referências:** Clean Code, Sonar Rules, Cognitive Complexity

### Business Rules Agent (`/legacy-squad-business-rules`)

Extrai regras de negócio escondidas no código — validações, permissões, fluxos, magic numbers, regras implícitas em catch blocks.

**Referências:** DDD, Event Storming

### Modernization Agent (`/legacy-squad-modernization`)

Sintetiza todos os assessments em um plano incremental com fases, rollback, Deployability Score (1-10) e Execution Readiness Score (0-100).

**Referências:** Strangler Fig, Branch by Abstraction, Progressive Delivery

### PRS Generator (`/legacy-squad-generate-prs`)

Consolida todos os assessments no PRS (Product Refactor Specification) — o relatório de diagnóstico para decision makers.

### SDD Generator (`/legacy-squad-generate-sdd`)

Produz o Software Design Document com arquitetura atual e alvo (diagramas Mermaid C4), inventário de componentes, integrações, cross-cutting concerns (segurança, observabilidade, tratamento de erros, configuração), restrições e Architecture Decision Records (ADRs) com alternativas avaliadas.

**Referências:** C4 Model, arc42, ADR, Clean Architecture

### MMP Generator (`/legacy-squad-generate-mmp`)

Produz o Modernization Master Plan com roadmap em fases (Foundation → Core → Evolution, com fase Emergency opcional quando há achados críticos), plano de upgrade de stack, matriz de risco, estratégia de rollback por fase, Execution Readiness Score (0-100) justificado dimensão por dimensão, Deployability Score por fase e métricas de sucesso em segurança, qualidade de código, cobertura de testes e arquitetura.

**Referências:** Strangler Fig, Branch by Abstraction, Progressive Delivery

### Execution Specs Generator (`/legacy-squad-generate-specs`)

Decompõe o MMP em Execution Specs atômicas — um arquivo YAML por unidade de trabalho, cada uma individualmente deployável, com critérios de aceite binários, estratégia de rollback obrigatória, rastreabilidade de evidências (IDs de findings do compliance + referências aos assessments), grafo de dependências entre specs e flag explícita `human_approval_required` para mudanças de alto risco.

**Referências:** FRAMEWORK_SPECIFICATION Section 8 (schema da Execution Spec)

---

## Stacks Suportadas

### Detecção por Manifesto (Camada 1 — determinística)

| Manifesto | Stack |
|-----------|-------|
| `package.json` | Node.js, React, React Native, Expo, Next.js |
| `composer.json` | PHP, Laravel |
| `.csproj` | C#, .NET |
| `pom.xml` | Java, Spring Boot |

### Detecção por Extensão (Camada 2 — heurística)

TypeScript, JavaScript, PHP, C#, Java, Python, Dart

---

## Compliance Engine

O scanner roda automaticamente regras determinísticas baseadas em OWASP e CWE:

| Regra | Detecta | Stacks | Referência |
|-------|---------|--------|------------|
| SEC-CRED-001 | Credenciais hardcoded (senhas, API keys, tokens) | todas | OWASP MASVS, CWE-798 |
| SEC-CRED-002 | Keystores/certificados commitados no repositório | mobile, todas | OWASP MASVS, CWE-312 |
| SEC-SQL-001 | SQL injection (concatenação de string em queries) | PHP, .NET, Java, Node | OWASP A03, CWE-89 |
| SEC-CRYPTO-001 | Criptografia fraca (MD5, SHA1) | PHP, .NET, Java, Node | OWASP A02, CWE-327 |
| SEC-DESER-001 | Desserialização insegura (BinaryFormatter, `unserialize`, `readObject`) | .NET, PHP, Java | OWASP A08, CWE-502 |
| SEC-CMD-001 | Command injection (`exec`, `Runtime.exec`, `shell_exec` com input do usuário) | PHP, .NET, Java, Node | OWASP A03, CWE-78 |
| SEC-PATH-001 | Path traversal (paths de arquivo sem validação) | PHP, .NET, Java, Node | OWASP A01, CWE-22 |
| SEC-XSS-001 | XSS via output sem escape (`echo $_GET`, `Html.Raw`) | PHP, .NET | OWASP A03, CWE-79 |
| SEC-LOG-001 | `console.log` ativo em produção | JS/TS, mobile | CWE-532 |
| SEC-LOG-002 | PII (CPF, SSN, IDs) em logs/serviços externos | todas | CWE-532, LGPD/GDPR |
| SEC-ERR-001 | Catch blocks vazios | todas | CWE-390 |
| SEC-STORE-001 | Token em AsyncStorage (storage inseguro) | mobile | OWASP MASVS |
| CQ-MIX-001 | JS e TS misturados (migração TS incompleta) | JS/TS | Clean Code |
| CQ-DEPRECATED-001 | APIs deprecadas (`mysql_*`, `ereg`, `Vector`) | PHP, Java | CVE-classified |

Todo achado inclui: evidência (arquivo, linha, snippet), impacto, referência técnica e recomendação.

---

## Princípios

| Princípio | Descrição |
|-----------|-----------|
| **Install-First** | Um comando instala tudo no projeto. Sem configuração manual. |
| **IDE-Native** | Agentes são slash commands da IDE. A IA vem do ambiente do dev. |
| **Evidence-Driven** | Todo achado tem evidência concreta (arquivo, linha, snippet). |
| **Context-First** | Nenhum LLM recebe o repositório inteiro — apenas context packs. |
| **Read-Only** | O framework não altera código. Apenas lê e gera relatórios. |
| **Production-First** | Toda recomendação assume que o sistema está em produção. |
| **Incremental** | Toda modernização é incremental, reversível e deployável. |

---

## Validado em Produção

O framework foi validado contra um **app mobile em produção** (~18k linhas de código, 98 dependências, transações financeiras reais):

**Compliance Engine (determinístico):** 7 achados por pattern matching

**Agentes (IA via Claude Code):** +43 achados adicionais, incluindo:
- Credenciais de service account decodificadas de Base64 no código-fonte
- Flag de configuração remota capaz de bypassar toda a autenticação em produção
- Senhas de usuário gravadas em texto plano em banco de dados cloud
- PII usada como chave primária em banco cloud (enumerável)
- Gravação de sessão capturando dados sensíveis sem consentimento
- 63 regras de negócio extraídas do código (11 implícitas, nunca documentadas)
- Bug potencial em cálculo de datas afetando lógica de negócio central

**Artefatos gerados (4 entregáveis oficiais do V1):**
- **PRS** — Product Refactor Specification consolidando o diagnóstico
- **SDD** — Software Design Document com arquitetura atual/alvo e 8 ADRs
- **MMP** — Modernization Master Plan com roadmap em 4 fases (Emergência → Foundation → Core → Evolution), Execution Readiness Score 38→88/100, scores de deployability por fase e estratégias concretas de rollback
- **37 Execution Specs** — unidades de trabalho atômicas, individualmente deployáveis, com critérios de aceite binários, rollback obrigatório, rastreabilidade de evidências e grafo de dependências

**Total:** 50 achados + 4 artefatos consolidados + 37 specs executáveis a partir de um único `npx legacy-squad install` seguido de 9 ativações de slash command.

---

## Open Core

### Community Edition (V1) — Open Source

Foco: **Entender + Planejar**

- Scanner com detecção multi-stack (PHP/Laravel/Symfony, .NET/ASP.NET, Java/Spring, Node, React Native/Expo)
- Compliance Engine com 14 regras determinísticas (OWASP MASVS, ASVS, CWE Top 25)
- Context Manager (básico)
- **5 agentes de análise** como slash commands: security, architecture, legacy-code, business-rules, modernization
- **4 geradores de artefato** como slash commands: PRS, SDD, MMP, Execution Specs
- Suporte a Claude Code, Codex CLI (Cursor / Gemini CLI no roadmap)

### Enterprise Edition (V2) — Em desenvolvimento

Foco: **Modernizar**

- Execution Engine (refatoração assistida por IA)
- Pull Request Engine
- QA Gates
- Integração CI/CD
- Custom Rule Packs
- Dashboard + Colaboração em Equipe

---

## Roadmap

### V1 — Discovery Platform (Community Edition) ✅

- [x] Scanner + Compliance Engine
- [x] Comando install + integração com IDE
- [x] Context Manager (básico)
- [x] Validação end-to-end com projeto real (mobile, ~18k LoC)
- [x] Catálogo de regras multi-stack (PHP, .NET, Java, Node, mobile)
- [x] Templates de agentes language-agnostic (stack-aware analysis)
- [x] 4 artefatos oficiais (PRS, SDD, MMP, Execution Specs)

### V1 — Melhorias contínuas

- [ ] Suporte a Cursor + Gemini CLI
- [ ] Pacotes de regras framework-specific (Eloquent raw queries, EF Core, Hibernate HQL)
- [ ] Scanner baseado em AST (atual é regex)

### V2 — Execution Platform (Enterprise Edition) — Em desenvolvimento

- [ ] Execution Engine (refatoração assistida por IA a partir das Execution Specs)
- [ ] Pull Request Engine
- [ ] QA Gates
- [ ] Integração CI/CD
- [ ] Custom Rule Packs
- [ ] Dashboard + Colaboração em Equipe

---

## Desenvolvimento

```bash
git clone https://github.com/hrpimenta/legacy-squad.git
cd legacy-squad
pnpm install
pnpm approve-builds esbuild

# Testes
npx vitest run

# Modo dev (sem build)
npx tsx apps/cli/src/index.ts install -p /caminho/do/projeto

# Build
node build.mjs

# Testar versão bundled
node dist/cli.mjs install -p /caminho/do/projeto
```

### Estrutura do Monorepo

```
legacy-squad/
├── packages/
│   ├── core/         # Tipos de domínio, portas (Clean Architecture)
│   ├── scanner/      # Detecção de stack, geração de repo index
│   ├── context/      # Context packs builder
│   ├── rules/        # Compliance engine, catálogo de regras
│   ├── agents/       # Definições de agentes, installer, doctor
│   └── output/       # Gerador de PRS
├── apps/
│   └── cli/          # Entry point da CLI (Commander.js)
├── templates/
│   └── claude-commands/  # Templates dos slash commands
└── docs/
    └── plans/        # Decisões de arquitetura, planos
```

### Testes

```bash
npx vitest run          # 93 testes (domínio, scanner, compliance, agentes, installer)
npx vitest --watch      # Watch mode
```

---

## Contribuindo

1. Faça fork do repositório
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Siga os padrões: TDD (Red→Green→Refactor), SOLID, Clean Architecture
4. Rode os testes (`npx vitest run`)
5. Abra um PR

### Formas de contribuir

- Novas regras para o Compliance Engine (PHP, .NET, Java)
- Melhorias nos templates de agentes
- Suporte a novas IDEs
- Documentação e tradução
- Testes e fixtures para outras stacks

---

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.

---

<p align="center">
  <strong>Understand. Plan. Modernize.</strong>
  <br>
  <em>Legacy Squad Framework</em>
</p>
