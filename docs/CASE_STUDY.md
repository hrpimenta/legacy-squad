# Case Study: Variable Compensation Platform — Healthcare Organization

> Validated diagnostic of a production legacy system. All organization, product, and identifier references have been anonymized. Numbers and findings reflect the actual analysis output.

---

## TL;DR

| | |
|---|---|
| 🏥 **Sector** | Healthcare |
| 💻 **System** | Internal variable-compensation platform (backend + web frontend) |
| 📦 **Size** | ~265 backend source files · ~209 frontend source files · ~80 SQL files |
| ⚙️ **Stack** | Java 17 · Spring Boot 2.7.18 (EOL) · Angular 14 (EOL) · SQL Server |
| 🔍 **Findings** | **20 total** — 3 critical, 4 high, 8 medium, 5 low |
| 📐 **Business rules extracted** | **38** (several implicit, never documented) |
| 📄 **Official artifacts produced** | 4 (PRS · SDD · MMP · Execution Specs) |
| 🎯 **Execution specs generated** | **22** atomic, deployable units of work |
| 📈 **Execution Readiness Score** | **28 → 90 / 100** (across 5 phases) |
| ⏱️ **Modernization roadmap** | 32–44 weeks for Phases 0–3 |

---

## Context

The platform analyzed in this case study is an **internal Pay-for-Performance (P4P) system** at a healthcare organization. It calculates quality indicators for member participants, ranks results by percentile across peer groups, and determines monthly variable compensation based on two composite indices.

- **Architecture pattern:** REST API (Spring Boot, Java) serving a single-page application (Angular). All business calculation logic lives in stored procedures on SQL Server — the Java layer orchestrates and exposes data, but does not compute it.
- **System age:** Multi-year evolution. Both frontend and backend frameworks reached end-of-life in November 2023.
- **Motivation for analysis:** Preparation for a modernization initiative, with stakeholder need for evidence-based prioritization before committing engineering capacity to large-scale upgrades.

---

## What the framework produced in one run

After a single `npx legacy-squad install` followed by activation of the 5 analysis agents and 4 artifact generators inside the IDE:

| Artifact | What it contains |
|---|---|
| **Repo Index** (`repo-index.json`) | Stack detection, module inventory (4 modules across backend and frontend), file counts, integrations (6 external APIs), hotspots (top 5 by complexity score) |
| **Findings** (`findings.json`) | Deterministic findings from the Compliance Engine (OWASP / CWE) — hardcoded credentials, console.log statements in production, mixed JS/TS files, deprecated API usage |
| **5 Assessments** (one per pillar) | Security · Architecture · Legacy Code · Business Rules · Modernization |
| **PRS** (Product Refactor Specification) | Executive summary, current/target state, full risk inventory, business rules catalog, modernization opportunities, recommended next steps |
| **SDD** (Software Design Document) | Current architecture diagram, target architecture with phased migration path, 8 Architecture Decision Records (ADRs) |
| **MMP** (Modernization Master Plan) | 5-phase roadmap (Foundation → Spring Boot 3 → Stability → Angular 18 → Future State), rollback strategy per phase, Execution Readiness projection per phase |
| **22 Execution Specs** | One YAML per atomic unit of work, with binary acceptance criteria, mandatory rollback strategy, evidence traceability to findings, and dependency graph |

---

## Diagnostic highlights

The diagnostic surfaced findings across all five pillars. Five examples illustrate the depth of analysis — each anonymized, but each based on a concrete file:line evidence pair in the original output.

### 🔴 Security — Authentication bypass in production

The login flow accepts a request body parameter that, when set to a specific channel value, **skips password validation entirely**. Any HTTP client knowing an active username could authenticate without credentials. Evidence pinpointed the exact file, lines, and the conditional branch responsible. The finding required a 24-hour correction SLA per CWE-287.

### 🔴 Security — JWT tokens with no expiration

The JWT signing service emitted tokens with the `exp` claim set to `null`. Tokens captured via server logs (the system also accepted JWT via query parameter, compounding the issue) granted **permanent, non-revocable access**. Evidence cited `JWTSignatureService` line range and the call site in `LoginService`. CWE-613.

### 🟠 Legacy Code — Two end-of-life frameworks

Spring Boot 2.7.18 and Angular 14 both reached end-of-life in November 2023. The Modernization Agent identified the dependency tree implications: 68 source files requiring `javax.*` → `jakarta.*` package renames, RxJS major version bump, PrimeNG major version bump, Spring Security configuration rewrite from `WebSecurityConfigurerAdapter` to `SecurityFilterChain`.

### 🏗️ Architecture — Stored procedures as the system's anchor

The Architecture Agent flagged what initially looked like a smell as **a structural advantage for incremental modernization**: all business calculation logic lives in stored procedures on SQL Server, completely isolated from the Java application layer. This means the Java code (Spring Boot, Angular) can be modernized without risking regression in business calculations. The MMP explicitly recommended keeping the SQL layer untouched as the stable anchor during framework upgrades — a counter-intuitive but evidence-driven recommendation.

### 📐 Business Rules — 38 rules extracted, several implicit

The Business Rules Agent extracted **38 distinct business rules** from the codebase. Examples of implicit rules — never documented elsewhere — included:

- CSV imports are idempotent by `(participant_id, period)` — re-importing does not duplicate records.
- A specific indicator group is calculated as 50% of another indicator's value, hardcoded in a JPQL query.
- A specific group code receives a zero value starting from a specific period, encoded as a magic constant in repository code.
- The export flow uses `period + 1` as the production period, which is **not** the period being evaluated.

Each rule was tagged with file:line evidence, classified as critical-to-preserve or candidate-for-externalization, and linked to the corresponding execution spec.

---

## Modernization plan

The MMP organized the 22 execution specs across **five phases**, each independently deployable with explicit rollback strategy.

| Phase | Duration | Focus | Deployability Score |
|---|---|---|:---:|
| **0 — Foundation** | 6–8 weeks | Close 3 critical security findings, establish minimal test coverage | **8 / 10** |
| **1 — Spring Boot 3** | 8–12 weeks | `javax→jakarta`, `SecurityFilterChain`, dependency bump | **5 / 10** |
| **2 — Stability** | 6–8 weeks | Dead code removal, CSV consolidation, security headers, privacy compliance | **9 / 10** |
| **3 — Angular 18** | 12–16 weeks | Sequential migration ng14 → 18 with intermediate versions | **6 / 10** |
| **4 — Future State** | 6+ months | Java 21, rate limiting, observability stack, account management improvements | **7 / 10** |

**Total estimated effort for Phases 0–3:** 32–44 weeks (~8–11 months). Phase 4 is direction-only, not a commitment.

### Execution Readiness trajectory

| Checkpoint | Score |
|---|:---:|
| Today | **28 / 100** |
| After Phase 0 | 45 |
| After Phase 1 | 60 |
| After Phase 2 | 72 |
| After Phase 3 | 82 |
| After Phase 4 | **90 / 100** |

### Execution specs breakdown

| Dimension | Value |
|---|:---:|
| Total specs | 22 |
| Specs requiring human approval | 12 |
| Critical-risk specs | 2 |
| High-risk specs | 9 |
| Medium-risk specs | 8 |
| Low-risk specs | 3 |
| Average Deployability Score | 7.8 / 10 |

Each spec includes a dependency graph linking it to predecessors and successors, enabling sprint-level sequencing without manual coordination.

---

## What this means in practice

A **manual diagnostic at this depth** — covering security, architecture, code health, business rules, and a phased modernization plan with rollback strategy per phase — typically requires:

- A senior architect (4–6 weeks)
- A security engineer (2–3 weeks)
- A modernization specialist (2–3 weeks)
- Multiple stakeholder workshops to surface implicit business rules

Legacy Squad produced the equivalent diagnostic artifacts from a single `npx install` plus 9 IDE slash command activations, with **every finding traceable to file:line evidence** and every recommendation backed by a framework reference (OWASP / CWE / Clean Code / DDD / Strangler Fig).

The framework **does not replace** the architect's judgment — the MMP itself acknowledges that some findings (e.g., whether the bypass channel is an intentional integration path or an accident) require human investigation before remediation. What it does is **compress the discovery phase** from weeks of meetings and code reading to hours of evidence-bound output, freeing the senior engineering effort for decision-making rather than data gathering.

---

## Reproducibility note

This case study reflects the actual output of Legacy Squad Framework v1.0.0-beta.4 run against a real production codebase. Numerical figures (file counts, finding counts, scores, spec counts) are accurate; organization name, product name, domain names, identifier prefixes, and business-domain terminology have been generalized to remove identifying details.

For the framework's methodology, principles, and full feature scope, see the [main README](../README.md). For the roadmap, see [ROADMAP.md](../ROADMAP.md).

---

*Generated using the same `legacy-squad install` workflow available in the [open-source repository](https://github.com/hrpimenta/legacy-squad).*
