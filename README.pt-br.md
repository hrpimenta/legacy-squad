<p align="center">
  <h1 align="center">Legacy Squad Framework</h1>
  <p align="center"><strong>Plataforma de Modernização de Legados com IA</strong></p>
  <p align="center"><em>Understand. Plan. Modernize.</em></p>
  <p align="center">
    <strong>🇧🇷 Português</strong> · <a href="README.md">🇺🇸 English</a>
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/legacy-squad"><img src="https://img.shields.io/npm/v/legacy-squad?color=cb3837&label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/legacy-squad"><img src="https://img.shields.io/npm/dm/legacy-squad?color=blue" alt="downloads"></a>
  <a href="https://github.com/hrpimenta/legacy-squad/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="license"></a>
  <a href="https://github.com/hrpimenta/legacy-squad/stargazers"><img src="https://img.shields.io/github/stars/hrpimenta/legacy-squad?style=social" alt="stars"></a>
  <img src="https://img.shields.io/badge/status-beta-orange" alt="beta">
  <img src="https://img.shields.io/badge/node-%E2%89%A518-brightgreen" alt="node">
</p>

---

> **Um comando. Cinco agentes de IA na sua IDE.**  
> **50 achados, 4 documentos de engenharia e 37 execution specs** — sem alterar uma única linha do seu código.

```bash
npx legacy-squad install
```

<p align="center">
  <img src="docs/assets/demo.svg" alt="Saída do install do Legacy Squad" width="780">
</p>

<p align="center">
  🔑 <strong>Zero API keys</strong> &nbsp;·&nbsp;
  ☁️ <strong>Zero servidores externos</strong> &nbsp;·&nbsp;
  💻 <strong>Roda na sua própria IDE</strong> (Claude Code, Codex, Cursor)
</p>

---

## 📊 Validado em Produção

Aplicativo mobile real em produção — **~18.000 LoC**, **98 dependências**, transações financeiras reais:

| | |
|---|---|
| 🔍 **50 achados** (7 determinísticos + 43 dos agentes de IA) | 📐 **63 regras de negócio** extraídas do código (11 implícitas) |
| 📄 **4 documentos oficiais** (PRS · SDD · MMP · Specs) | 🎯 **37 execution specs**, atômicas e deployáveis |
| 📈 **Execution Readiness:** 38 → 88 / 100 | 🚀 **Deployability:** pontuado por fase |

A partir de um único `npx legacy-squad install` seguido por 9 slash commands na IDE.

[**→ Leia o case study completo**](docs/CASE_STUDY.md)

---

## 🚀 Início Rápido

> Do zero ao seu primeiro achado gerado por IA em minutos.

### Pré-requisitos

- **Node.js ≥ 18**
- **Uma IDE com IA habilitada:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Codex CLI](https://github.com/openai/codex) ou [Cursor](https://cursor.sh)

### 1. Instale no seu projeto legado

```bash
cd seu-projeto-legado
npx legacy-squad install
```

Logo em seguida, você verá os artefatos do framework em `.legacy-squad/memory/`:

- `repo-index.json` — inventário completo (stack, módulos, dependências, integrações)
- `findings.json` — achados de segurança determinísticos (OWASP / CWE)
- `context-packs.json` — contexto por módulo, preparado para os agentes de IA

<details>
<summary><strong>O que o comando install faz internamente</strong></summary>

1. Detecta a stack pelo manifesto (`package.json`, `composer.json`, `.csproj`, `pom.xml`)
2. Faz o scan do repositório e monta o inventário
3. Executa o Compliance Engine com regras OWASP / CWE
4. Gera Context Packs por módulo (eficientes em tokens)
5. Instala os 9 agentes como slash commands na sua IDE
6. Verifica a instalação (8 health checks)

</details>

### 2. Rode seu primeiro agente de IA

Abra sua IDE no projeto e acione o Security Agent.

**Claude Code**
```bash
claude
/legacy-squad-security
```

**Codex CLI**
```bash
codex
@legacy-squad-security
```

O assessment é escrito em:

```
.legacy-squad/outputs/assessments/security.md
```

Orientado por evidência: todo achado inclui referência arquivo:linha, mapeamento OWASP / CWE, impacto e recomendação — gerado pela IA rodando inteiramente dentro da sua IDE.

### 3. Rode o diagnóstico completo

Depois de validar o primeiro agente, execute os quatro restantes e os quatro geradores de artefatos.

<details>
<summary><strong>Workflow completo — 5 agentes + 4 geradores</strong></summary>

**Etapa 1 — Análise (rode em ordem)**

```bash
/legacy-squad-security              # Security Agent
/legacy-squad-architecture          # Architecture Agent
/legacy-squad-legacy-code           # Legacy Code Agent
/legacy-squad-business-rules        # Business Rules Agent
/legacy-squad-modernization         # Modernization Agent
```

**Etapa 2 — Artefatos consolidados (rode após a análise)**

```bash
/legacy-squad-generate-prs          # Product Refactor Specification
/legacy-squad-generate-sdd          # Software Design Document
/legacy-squad-generate-mmp          # Modernization Master Plan
/legacy-squad-generate-specs        # Execution Specs (um YAML por unidade de trabalho)
```

</details>

### Outros comandos

```bash
npx legacy-squad scan               # Re-escaneia sem reinstalar agentes
npx legacy-squad doctor             # Verifica a saúde da instalação
```

---

## Por que Legacy Squad

A maioria das ferramentas existentes cobre uma única dimensão da modernização de legados. O Legacy Squad cobre o ciclo completo — do inventário ao plano executável — e trata agentes de IA como **contribuidores submetidos a uma metodologia**, não como chat livre.

| Capacidade | Static Analyzers<br>(SonarQube) | SAST / SCA<br>(Snyk, Checkmarx) | AI Coding Assistants<br>(Copilot, Cursor) | **Legacy Squad** |
|---|:---:|:---:|:---:|:---:|
| Regras de segurança determinísticas (OWASP / CWE) | ✅ | ✅ | — | ✅ |
| Vulnerabilidades de CVE / dependências | — | ✅ | — | — |
| Code smells e complexidade cognitiva | ✅ | parcial | — | ✅ |
| Mapeamento de arquitetura (C4, acoplamento) | — | — | — | ✅ |
| Extração de regras de negócio do código | — | — | — | ✅ |
| Plano de modernização em fases (MMP) | — | — | — | ✅ |
| Execution specs atômicas e deployáveis | — | — | — | ✅ |
| Agentes de IA com saída orientada por evidência | — | — | livre | ✅ |
| Roda na sua própria IDE (sem servidor, sem API key) | — | — | ✅ | ✅ |
| Repositório nunca é enviado por completo para a LLM | n/a | n/a | — | ✅ |

Em uma frase: o Legacy Squad combina **escaneamento determinístico** com **agentes de IA submetidos a metodologia** que produzem **artefatos de engenharia estruturados** (PRS, SDD, MMP, Execution Specs) — não histórico de chat.

### Quando o Legacy Squad faz sentido

- Você tem um sistema legado em produção e precisa de um **diagnóstico estruturado** antes de decidir o que modernizar.
- Você quer que todo achado carregue **evidência, referência ao framework, impacto e recomendação** — não sugestões sem justificativa.
- Você precisa de um **plano de modernização em fases**, reversível, deployável e passível de aprovação humana antes da execução.
- Você quer assistência de IA **sem enviar seu código-fonte para um servidor externo** nem pagar por mais uma seat.

### Quando não faz

- Para escaneamento puro de CVE / vulnerabilidades de dependência, use [Snyk](https://snyk.io), [Dependabot](https://github.com/dependabot) ou equivalentes — eles são especializados nisso e o Legacy Squad não os substitui.
- Para gates de qualidade contínuos em CI/CD, use [SonarQube](https://www.sonarsource.com/products/sonarqube/) — o Legacy Squad é um framework de **diagnóstico e planejamento**, não um monitor contínuo de qualidade.
- Para autocomplete no editor ou chat genérico de código, [GitHub Copilot](https://github.com/features/copilot) e [Cursor](https://cursor.sh) já cumprem esse papel — o Legacy Squad começa onde essas ferramentas param.

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
        │ módulos) │  │ (OWASP)    │  │  (packs)   │
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

**O framework prepara os dados e instala os agentes. A IA roda na IDE do dev.**

Zero API keys necessárias. Zero chamadas a servidores externos. Tudo roda localmente.

---

## Estrutura Instalada

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
│   │   ├── assessments/               # Assessments dos agentes (5 arquivos .md)
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

Analisa autenticação, secrets, armazenamento inseguro, exposição de PII e conformidade de privacidade (LGPD, GDPR).

**Referências:** OWASP MASVS V2, OWASP ASVS, CWE Top 25, LGPD, GDPR, NIST SSDF

### Architecture Agent (`/legacy-squad-architecture`)

Mapeia a arquitetura atual com diagramas C4, identifica acoplamento, riscos estruturais e propõe uma arquitetura alvo incremental.

**Referências:** C4 Model, Clean Architecture, arc42, ADR

### Legacy Code Agent (`/legacy-squad-legacy-code`)

Identifica hotspots, duplicação, progresso da migração JS→TS, cobertura de testes e prioridades de refatoração.

**Referências:** Clean Code, Sonar Rules, Cognitive Complexity

### Business Rules Agent (`/legacy-squad-business-rules`)

Extrai regras de negócio escondidas no código — validações, permissões, fluxos, números mágicos, regras implícitas em catch blocks.

**Referências:** DDD, Event Storming

### Modernization Agent (`/legacy-squad-modernization`)

Sintetiza todos os assessments em um plano incremental com fases, rollback, Deployability Score (1-10) e Execution Readiness Score (0-100).

**Referências:** Strangler Fig, Branch by Abstraction, Progressive Delivery

### PRS Generator (`/legacy-squad-generate-prs`)

Consolida todos os assessments no PRS (Product Refactor Specification) — o relatório de diagnóstico para tomadores de decisão.

### SDD Generator (`/legacy-squad-generate-sdd`)

Produz o Software Design Document com arquitetura atual e alvo (diagramas Mermaid C4), inventário de componentes, integrações, preocupações transversais (segurança, observabilidade, tratamento de erros, configuração), restrições e Architecture Decision Records (ADRs) com alternativas consideradas.

**Referências:** C4 Model, arc42, ADR, Clean Architecture

### MMP Generator (`/legacy-squad-generate-mmp`)

Produz o Modernization Master Plan com roadmap em fases (Foundation → Core → Evolution, com fase Emergency opcional quando há achados críticos), plano de upgrade de stack, matriz de risco, estratégia de rollback por fase, Execution Readiness Score (0-100) justificado dimensão por dimensão, Deployability Score por fase e métricas de sucesso cobrindo segurança, qualidade de código, cobertura de testes e arquitetura.

**Referências:** Strangler Fig, Branch by Abstraction, Progressive Delivery

### Execution Specs Generator (`/legacy-squad-generate-specs`)

Decompõe o MMP em Execution Specs atômicas — um arquivo YAML por unidade de trabalho, individualmente deployável, com critérios de aceite binários, estratégia de rollback obrigatória, rastreabilidade de evidência (IDs de findings de compliance + referências de assessment), grafo de dependência entre specs e flag explícita `human_approval_required` para mudanças de alto risco.

**Referências:** FRAMEWORK_SPECIFICATION Seção 8 (schema de Execution Spec)

---

## Stacks Suportadas

### Detecção por Manifesto (Camada 1 — determinística)

| Manifesto | Stack |
|----------|-------|
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
|------|---------|--------|-----------|
| SEC-CRED-001 | Credenciais hardcoded (senhas, API keys, tokens) | todas | OWASP MASVS, CWE-798 |
| SEC-CRED-002 | Keystores/certificados commitados no repositório | mobile, todas | OWASP MASVS, CWE-312 |
| SEC-SQL-001 | SQL injection (concatenação de string em queries) | PHP, .NET, Java, Node | OWASP A03, CWE-89 |
| SEC-CRYPTO-001 | Criptografia fraca (MD5, SHA1) | PHP, .NET, Java, Node | OWASP A02, CWE-327 |
| SEC-DESER-001 | Desserialização insegura (BinaryFormatter, `unserialize`, `readObject`) | .NET, PHP, Java | OWASP A08, CWE-502 |
| SEC-CMD-001 | Command injection (`exec`, `Runtime.exec`, `shell_exec` com input do usuário) | PHP, .NET, Java, Node | OWASP A03, CWE-78 |
| SEC-PATH-001 | Path traversal (caminhos de arquivo não validados) | PHP, .NET, Java, Node | OWASP A01, CWE-22 |
| SEC-XSS-001 | XSS por saída sem escape (`echo $_GET`, `Html.Raw`) | PHP, .NET | OWASP A03, CWE-79 |
| SEC-LOG-001 | `console.log` ativo em produção | JS/TS, mobile | CWE-532 |
| SEC-LOG-002 | PII (CPF, SSN, IDs) em logs/serviços externos | todas | CWE-532, LGPD/GDPR |
| SEC-ERR-001 | Catch blocks vazios | todas | CWE-390 |
| SEC-STORE-001 | Token em AsyncStorage (armazenamento inseguro) | mobile | OWASP MASVS |
| CQ-MIX-001 | Arquivos JS e TS misturados (migração TS incompleta) | JS/TS | Clean Code |
| CQ-DEPRECATED-001 | APIs depreciadas (`mysql_*`, `ereg`, `Vector`) | PHP, Java | classificadas por CVE |

Todo achado inclui: evidência (arquivo, linha, snippet), impacto, referência técnica e recomendação.

---

## Princípios

| Princípio | Descrição |
|-----------|-------------|
| **Install-First** | Um comando instala tudo. Sem setup manual. |
| **IDE-Native** | Agentes são slash commands da IDE. A IA vem do ambiente do dev. |
| **Evidence-Driven** | Todo achado tem evidência concreta (arquivo, linha, snippet). |
| **Context-First** | Nenhuma LLM recebe o repositório inteiro — apenas context packs. |
| **Read-Only** | O framework não modifica código. Apenas lê e gera relatórios. |
| **Production-First** | Toda recomendação assume que o sistema está em produção. |
| **Incremental** | Todo passo de modernização é incremental, reversível e deployável. |

---

## Validado em Produção

O framework foi validado contra um **app mobile em produção** (~18k linhas de código, 98 dependências, transações financeiras reais):

**Compliance Engine (determinístico):** 7 achados via pattern matching

**Agentes de IA (via Claude Code):** +43 achados adicionais, incluindo:
- Credenciais de service account decodificadas a partir de Base64 no código-fonte
- Flag de remote config capaz de bypassar toda a autenticação em produção
- Senhas de usuário logadas em texto claro em um banco de dados na nuvem
- PII usado como chave primária em banco de dados na nuvem (enumerável)
- Gravação de sessão capturando dados sensíveis sem consentimento do usuário
- 63 regras de negócio extraídas do código (11 implícitas, nunca documentadas)
- Possível bug em cálculo de data afetando lógica de negócio central

**Artefatos gerados (4 entregáveis oficiais da V1):**
- **PRS** — Product Refactor Specification consolidando o diagnóstico
- **SDD** — Software Design Document com arquitetura atual/alvo e 8 ADRs
- **MMP** — Modernization Master Plan com roadmap em 4 fases (Emergency → Foundation → Core → Evolution), Execution Readiness Score 38→88/100, Deployability scores por fase e estratégias concretas de rollback
- **37 Execution Specs** — unidades de trabalho atômicas e individualmente deployáveis, com critérios de aceite binários, rollback obrigatório, rastreabilidade de evidência e grafo de dependência

**Total:** 50 achados + 4 artefatos consolidados + 37 specs executáveis a partir de um único `npx legacy-squad install` seguido por 9 ativações de slash command.

---

## Open Core

### Community Edition (V1) — Open Source

Foco: **Understand + Plan**

- Scanner com detecção multi-stack (PHP/Laravel/Symfony, .NET/ASP.NET, Java/Spring, Node, React Native/Expo)
- Compliance Engine com 14 regras determinísticas (OWASP MASVS, ASVS, CWE Top 25)
- Context Manager (básico)
- **5 agentes de análise** como slash commands: security, architecture, legacy-code, business-rules, modernization
- **4 geradores de artefatos** como slash commands: PRS, SDD, MMP, Execution Specs
- Suporte a Claude Code, Codex CLI (Cursor / Gemini CLI no roadmap)

### Enterprise Edition (V2) — Em desenvolvimento

Foco: **Modernize**

- Execution Engine (refatoração assistida por IA)
- Pull Request Engine
- QA Gates
- Integração CI/CD
- Custom Rule Packs
- Dashboard + Team Collaboration

---

## Roadmap

| Horizonte | Fase | Status |
|---|---|---|
| **Now** | V1 Community — melhorias contínuas | 🔵 Ativo |
| **Next** | V2 Enterprise — execução, refatoração, PRs | 🟡 Em desenho |
| **Later** | V3 Autonomous — modernização contínua | ⚪ Visão |

[**→ Roadmap completo**](ROADMAP.md) · [**→ Influencie a direção**](https://github.com/hrpimenta/legacy-squad/discussions)

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
│   ├── core/         # Tipos de domínio, ports (Clean Architecture)
│   ├── scanner/      # Detecção de stack, geração de repo index
│   ├── context/      # Builder de context packs
│   ├── rules/        # Compliance engine, catálogo de regras
│   ├── agents/       # Definições de agentes, instalador, doctor
│   └── output/       # Gerador do PRS
├── apps/
│   └── cli/          # Entry point da CLI (Commander.js)
├── templates/
│   └── claude-commands/  # Templates de slash commands
└── docs/
    └── plans/        # Decisões de arquitetura, planos
```

### Testes

```bash
npx vitest run          # 93 testes (domain, scanner, compliance, agents, installer)
npx vitest --watch      # Modo watch
```

---

## Como Contribuir

Agradecemos contribuições. Consulte o arquivo [CONTRIBUTING.md](CONTRIBUTING.md) para obter informações sobre:

- Como adicionar uma regra ao Compliance Engine
- Como aprimorar os modelos de agentes
- Como adicionar suporte a IDEs
- Padrões de engenharia (TDD, SOLID, segurança)
- Convenções de commit e processo de pull request

Para perguntas e propostas, [abra uma discussão](https://github.com/hrpimenta/legacy-squad/discussions).

---

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.

---

<p align="center">
  <strong>Understand. Plan. Modernize.</strong>
  <br>
  <em>Legacy Squad Framework</em>
</p>
