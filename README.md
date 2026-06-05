<p align="center">
  <h1 align="center">Legacy Squad Framework</h1>
  <p align="center"><strong>AI-Powered Legacy Modernization Platform</strong></p>
  <p align="center"><em>Understand. Plan. Modernize.</em></p>
  <p align="center">
    <a href="README.pt-br.md">🇧🇷 Português</a> · <strong>🇺🇸 English</strong>
  </p>
</p>

---

Legacy Squad is an open-source framework that installs inside your legacy project with a single command, automatically analyzes the codebase, and provides specialized AI agents in your IDE to produce a complete diagnostic — without changing a single line of code.

```bash
npx legacy-squad install
```

---

## The Problem

Legacy systems support critical processes, but frequently suffer from:

- Missing or outdated documentation
- Hardcoded credentials in source code
- Business rules buried in conditionals no one documented
- Coupling that makes any change risky
- Fear of modifying production code
- Dependency on 1-2 developers who "know the system"

Traditional approaches (full rewrites, unstructured refactoring) are expensive, slow, and risky.

## The Solution

Legacy Squad combines **deterministic analysis** (scanner + compliance engine with OWASP/CWE rules) with **specialized AI agents** that run in your IDE (Claude Code, Codex, Cursor) to produce:

| Artifact | What it does |
|----------|-------------|
| **Repo Index** | Full inventory: stack, modules, dependencies, integrations, hotspots |
| **Findings** | Security findings with evidence, impact, OWASP reference and recommendation |
| **Security Assessment** | Deep analysis of auth, secrets, LGPD/GDPR, API security |
| **Architecture Assessment** | C4 diagrams, coupling analysis, structural risks, target architecture |
| **Legacy Code Assessment** | Hotspots, JS→TS migration, duplication, test coverage |
| **Business Rules Assessment** | 60+ rules extracted from code, preservation checklist |
| **Modernization Plan** | Incremental phased roadmap with rollback and scores |
| **PRS** | Product Refactor Specification — consolidated report for decision makers |

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- An AI-enabled IDE: [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Codex CLI](https://github.com/openai/codex), or [Cursor](https://cursor.sh)

### Installation

```bash
cd your-legacy-project
npx legacy-squad install
```

The command:
1. Detects the stack (React Native, PHP, .NET, Java, Node — via manifest)
2. Scans the repository and generates the inventory
3. Runs the Compliance Engine (OWASP/CWE rules)
4. Generates Context Packs per module
5. Installs agents as slash commands in your IDE
6. Verifies the installation (8 checks)

### Usage with Claude Code

```bash
claude                              # Open Claude Code in the project
/legacy-squad-security              # Run Security Agent
/legacy-squad-architecture          # Run Architecture Agent
/legacy-squad-legacy-code           # Run Legacy Code Agent
/legacy-squad-business-rules        # Run Business Rules Agent
/legacy-squad-modernization         # Run Modernization Agent
/legacy-squad-generate-prs          # Consolidate everything into the final PRS
```

### Usage with Codex CLI

```bash
codex                               # Open Codex in the project
# AGENTS.md at the root defines available agents
@legacy-squad-security              # Activate Security Agent
```

### Other Commands

```bash
npx legacy-squad scan               # Re-scan without reinstalling agents
npx legacy-squad doctor             # Verify installation health
```

---

## How It Works

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
        │ modules) │  │ (OWASP)   │  │ (packs)    │
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
                    │  IDE + AI   │
                    │ (Claude Code│
                    │  Codex,     │
                    │  Cursor)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Assessments │
                    │ + Final PRS │
                    └─────────────┘
```

**The framework prepares data and installs agents. AI runs in the dev's IDE.**

Zero API keys required. Zero external server calls. Everything runs locally.

---

## Installed Structure

After `npx legacy-squad install`:

```
your-project/
├── .legacy-squad/
│   ├── config/
│   │   └── project.yaml              # Detected configuration
│   ├── memory/
│   │   ├── repo-index.json            # Repository inventory
│   │   ├── findings.json              # Compliance engine findings
│   │   └── context-packs.json         # Context per module
│   ├── outputs/
│   │   ├── assessments/               # Agent assessments
│   │   └── reports/                   # Consolidated PRS
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
│           └── scan.md               # /legacy-squad-scan
└── AGENTS.md                          # Codex compatibility
```

---

## Agents

### Security Agent (`/legacy-squad-security`)

Analyzes authentication, secrets, insecure storage, PII exposure, and privacy compliance (LGPD, GDPR).

**References:** OWASP MASVS V2, OWASP ASVS, CWE Top 25, LGPD, GDPR, NIST SSDF

### Architecture Agent (`/legacy-squad-architecture`)

Maps current architecture with C4 diagrams, identifies coupling, structural risks, and proposes incremental target architecture.

**References:** C4 Model, Clean Architecture, arc42, ADR

### Legacy Code Agent (`/legacy-squad-legacy-code`)

Identifies hotspots, duplication, JS→TS migration progress, test coverage, and refactoring priorities.

**References:** Clean Code, Sonar Rules, Cognitive Complexity

### Business Rules Agent (`/legacy-squad-business-rules`)

Extracts business rules hidden in code — validations, permissions, flows, magic numbers, implicit rules in catch blocks.

**References:** DDD, Event Storming

### Modernization Agent (`/legacy-squad-modernization`)

Synthesizes all assessments into an incremental plan with phases, rollback, Deployability Score (1-10), and Execution Readiness Score (0-100).

**References:** Strangler Fig, Branch by Abstraction, Progressive Delivery

### PRS Generator (`/legacy-squad-generate-prs`)

Consolidates all assessments into the PRS (Product Refactor Specification) — the final document for decision makers.

---

## Supported Stacks

### Manifest Detection (Layer 1 — deterministic)

| Manifest | Stack |
|----------|-------|
| `package.json` | Node.js, React, React Native, Expo, Next.js |
| `composer.json` | PHP, Laravel |
| `.csproj` | C#, .NET |
| `pom.xml` | Java, Spring Boot |

### Extension Detection (Layer 2 — heuristic)

TypeScript, JavaScript, PHP, C#, Java, Python, Dart

---

## Compliance Engine

The scanner automatically runs deterministic rules based on OWASP and CWE:

| Rule | Detects | Reference |
|------|---------|-----------|
| SEC-CRED-001 | Hardcoded credentials | OWASP MASVS, CWE-798 |
| SEC-CRED-002 | Keystores/certificates in repository | OWASP MASVS, CWE-312 |
| SEC-LOG-001 | Active console.log in production | CWE-532 |
| SEC-LOG-002 | PII (CPF, SSN, IDs) in logs/external services | CWE-532, LGPD/GDPR |
| SEC-ERR-001 | Empty catch blocks | CWE-390 |
| SEC-STORE-001 | Token in AsyncStorage | OWASP MASVS |
| CQ-MIX-001 | Mixed JS and TS files | Clean Code |
| CQ-DEP-001 | Transitive dependencies | Clean Code |

Every finding includes: evidence (file, line, snippet), impact, technical reference, and recommendation.

---

## Principles

| Principle | Description |
|-----------|-------------|
| **Install-First** | One command installs everything. No manual setup. |
| **IDE-Native** | Agents are IDE slash commands. AI comes from the dev's environment. |
| **Evidence-Driven** | Every finding has concrete evidence (file, line, snippet). |
| **Context-First** | No LLM receives the entire repository — only context packs. |
| **Read-Only** | The framework does not modify code. It only reads and generates reports. |
| **Production-First** | Every recommendation assumes the system is in production. |
| **Incremental** | Every modernization step is incremental, reversible, and deployable. |

---

## Validated in Production

The framework was validated against a **production mobile app** (~18k lines of code, 98 dependencies, real financial transactions):

**Compliance Engine (deterministic):** 7 findings via pattern matching

**AI Agents (via Claude Code):** +43 additional findings, including:
- Service account credentials decoded from Base64 in source code
- Remote config flag capable of bypassing all authentication in production
- User passwords logged in plaintext to a cloud database
- PII used as primary key in a cloud database (enumerable)
- Session recording capturing sensitive data without user consent
- 63 business rules extracted from code (11 implicit, never documented)
- Potential bug in a date calculation affecting core business logic
- 36-week modernization roadmap with scores: Deployability 3→9/10, Readiness 22→87/100

**Total:** 50 findings across 5 pillars, from a single `npx legacy-squad install` + 6 agent activations.

---

## Open Core

### Community Edition (V1) — Open Source

Focus: **Understand + Plan**

- Scanner, Compliance Engine, Context Manager
- 7 agents as slash commands
- PRS, assessments, modernization plan
- Claude Code, Codex, Cursor support

### Enterprise Edition (V2) — In development

Focus: **Modernize**

- Execution Engine (AI-assisted refactoring)
- Pull Request Engine
- QA Gates
- CI/CD Integration
- Custom Rule Packs
- Dashboard + Team Collaboration

---

## Roadmap

- [x] Sprint 1 — Scanner + Compliance Engine
- [x] Sprint 2 — Install command + IDE integration
- [x] Sprint 3 — Context Manager (basic)
- [x] Sprint 4 — End-to-end validation with real project
- [ ] Sprint 5 — Multi-IDE (Cursor, Gemini CLI)
- [ ] Sprint 6 — Rules for PHP, .NET, Java
- [ ] Sprint 7 — SDD + MMP agents
- [ ] Sprint 8 — Execution Specs agent + npm publish

---

## Development

```bash
git clone https://github.com/hrpimenta/legacy-squad.git
cd legacy-squad
pnpm install
pnpm approve-builds esbuild

# Tests
npx vitest run

# Dev mode (no build)
npx tsx apps/cli/src/index.ts install -p /path/to/project

# Build
node build.mjs

# Test bundled version
node dist/cli.mjs install -p /path/to/project
```

### Monorepo Structure

```
legacy-squad/
├── packages/
│   ├── core/         # Domain types, ports (Clean Architecture)
│   ├── scanner/      # Stack detection, repo index generation
│   ├── context/      # Context packs builder
│   ├── rules/        # Compliance engine, rule catalog
│   ├── agents/       # Agent definitions, installer, doctor
│   └── output/       # PRS generator
├── apps/
│   └── cli/          # CLI entry point (Commander.js)
├── templates/
│   └── claude-commands/  # Slash command templates
└── docs/
    └── plans/        # Architecture decisions, plans
```

### Tests

```bash
npx vitest run          # 28 tests (domain, scanner, compliance, agents)
npx vitest --watch      # Watch mode
```

---

## Contributing

1. Fork the repository
2. Create a branch (`git checkout -b feature/my-feature`)
3. Follow the standards: TDD (Red→Green→Refactor), SOLID, Clean Architecture
4. Run tests (`npx vitest run`)
5. Open a PR

### Ways to contribute

- New rules for the Compliance Engine (PHP, .NET, Java)
- Agent template improvements
- New IDE support
- Documentation and translation
- Tests and fixtures for other stacks

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Understand. Plan. Modernize.</strong>
  <br>
  <em>Legacy Squad Framework</em>
</p>
