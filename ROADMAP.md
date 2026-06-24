# Legacy Squad Roadmap

**Status:** Stable · v1.2.0
**Last updated:** 2026-06

> This roadmap reflects current direction, not commitments. Priorities shift based on user feedback, real-world validation, and contributions. To suggest a change, [open a discussion](https://github.com/hrpimenta/legacy-squad/discussions).

---

## Philosophy

Legacy Squad evolves under four constraints:

- **Evidence first.** New rules and agents must produce findings traceable to specific code locations.
- **Incremental over reinvention.** Every modernization step the framework recommends — and every release of the framework itself — must be reversible.
- **Production safety.** Read-only by default in V1. Write operations in V2 always require human approval gates.
- **IDE-native, no servers.** AI runs in the developer's IDE. The framework never sends repository content to an external server.

---

## Three horizons

| Horizon | What it means | Current phase |
|---|---|---|
| **Now** (Q2–Q3 2026) | Stabilizing V1 — patches, new rule packs, additional IDE support | 🔵 Active |
| **Next** (Q4 2026 – H1 2027) | V2 Enterprise — execution, refactoring, pull requests, QA gates | 🟡 In design |
| **Later** (H2 2027+) | V3 Autonomous — continuous modernization, multi-agent orchestration, enterprise dashboard | ⚪ Vision |

---

## V1 — Discovery Platform · Community Edition

### ✅ Shipped

- [x] Scanner with multi-stack detection (PHP / Laravel · .NET · Java / Spring · Node · React Native / Expo)
- [x] Install command with IDE integration (Claude Code, Codex CLI)
- [x] Compliance Engine with 14 deterministic rules (OWASP MASVS, ASVS, CWE Top 25)
- [x] Context Manager (per-module context packs, token-efficient)
- [x] 5 analysis agents as IDE slash commands (security, architecture, legacy-code, business-rules, modernization)
- [x] 4 artifact generators as IDE slash commands (PRS, SDD, MMP, Execution Specs)
- [x] Language-agnostic agent templates (stack-aware prompts at runtime)
- [x] End-to-end validation with real production project (~18k LoC, mobile)
- [x] Partitioned findings store — per-pillar files + slim index for token-efficient generators (v1.2.0)

### 🔵 Now — Continuous improvements

- [ ] Cursor IDE support
- [ ] Gemini CLI support
- [ ] Framework-specific rule packs (Eloquent raw queries, EF Core string-based SQL, Hibernate HQL)
- [ ] AST-based scanner (current implementation is regex / pattern-matching)
- [ ] Additional production validation cases (different stacks)
- [ ] Cross-platform path normalization edge cases (Windows nested-extraction scenarios)

---

## V2 — Execution Platform · Enterprise Edition

### 🟡 Next — In design and early development

- [ ] **Execution Engine** — AI-assisted refactoring driven by Execution Specs
- [ ] **Pull Request Engine** — automated PR generation with rollback plan and traceability to findings
- [ ] **QA Gates** — automated verification of acceptance criteria before PR opens
- [ ] **Git Worktree Manager** — isolated execution environments per spec
- [ ] **Stack Upgrade Engine** — controlled dependency and framework version migrations
- [ ] **CI/CD Integration** — GitHub Actions / GitLab CI hooks
- [ ] **Custom Rule Packs** — organization-specific compliance rules
- [ ] **Dashboard + Team Collaboration** — multi-user visibility, assignment, approval workflows

V2 is paid Enterprise. V1 remains MIT-licensed and complete on its own.

---

## V3 — Autonomous Modernization Platform

### ⚪ Later — Vision

- [ ] Multi-agent orchestration across long-running modernization initiatives
- [ ] Continuous re-analysis after each merged change
- [ ] Recurring compliance posture monitoring
- [ ] Enterprise governance layer (audit trails, role-based approval, policy enforcement)
- [ ] Cross-repository portfolio view

V3 is direction, not date. Shape and scope will depend on V2 adoption and real customer needs.

---

## How to influence the roadmap

The fastest way to move an item up — or add something new — is signal:

- **Open a [Discussion](https://github.com/hrpimenta/legacy-squad/discussions)** with the use case and the legacy stack involved.
- **Open an [Issue](https://github.com/hrpimenta/legacy-squad/issues)** for specific bugs or rule gaps, with code evidence.
- **Submit a PR** with a rule, agent template improvement, or stack adapter — see [CONTRIBUTING.md](CONTRIBUTING.md).
- **Star the repo** if you want to follow updates without committing to anything.

Priorities are reviewed publicly. Items move between horizons as evidence accumulates.

---

## Out of scope (for now)

Honest about what Legacy Squad is **not** trying to be:

- Not a SAST/SCA replacement for CVE scanning — keep using Snyk, Dependabot, or equivalents.
- Not a continuous code-quality monitor — SonarQube fits that role.
- Not an in-editor autocomplete assistant — Copilot and Cursor already cover that.
- Not a code transformation engine in V1 — execution lives in V2 with human approval gates.

Legacy Squad starts where those tools stop: methodology-bound diagnosis, structured modernization planning, and AI agents that operate under engineering discipline.