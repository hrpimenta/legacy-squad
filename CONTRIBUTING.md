# Contributing to Legacy Squad

Thanks for considering a contribution. This document covers how to propose changes, the engineering standards the project follows, and the areas where contributions are most valuable.

If you only have **30 seconds**, jump to [Quick reference](#quick-reference) and pick the row that matches your intent.

---

## Quick reference

| I want to... | Start here |
|---|---|
| Report a bug | [Open an issue](https://github.com/hrpimenta/legacy-squad/issues/new?labels=bug) with reproduction steps |
| Suggest a feature or rule | [Open a discussion](https://github.com/hrpimenta/legacy-squad/discussions) first — saves rework |
| Add a new Compliance Engine rule | See [Adding a rule](#adding-a-rule) |
| Improve an agent template | See [Agent templates](#improving-agent-templates) |
| Add support for a new IDE | See [IDE support](#adding-ide-support) |
| Translate documentation | See [Translation](#translation) |
| Fix something small (typo, link, formatting) | Just open a PR — no issue required |
| Influence the roadmap | Open a [discussion](https://github.com/hrpimenta/legacy-squad/discussions) describing the use case |

---

## Before you contribute

1. **Check existing issues and discussions** — your idea may already be tracked.
2. **Read the [README](README.md), [ROADMAP](ROADMAP.md), and the [Principles](README.md#principles) section** — they define what fits and what doesn't.
3. **For anything beyond a small fix, open a discussion first.** This avoids the worst contributor experience: writing 200 lines of code and having the PR rejected because the direction doesn't match.

---

## Engineering standards

Legacy Squad operates under strict standards. These are not negotiable — they exist because the framework analyzes other people's legacy systems, and we cannot ship a framework that wouldn't pass its own diagnostics.

### Architecture

- **Clean Architecture** with explicit boundaries: domain types and ports live in `packages/core`, infrastructure adapters live in their respective packages.
- **SOLID principles** applied to every class. Methods over 20 lines or classes with multiple responsibilities will be flagged in review.
- **Dependency injection** wherever runtime composition matters — no hidden singletons, no service locators.

### Test-Driven Development

- **TDD is mandatory for new code:** Red → Green → Refactor.
- Tests come first, in the same PR as the implementation.
- Exceptions (e.g., urgent hotfixes) require justification and a retroactive test in the same PR.
- Test framework: [Vitest](https://vitest.dev/).

### Security

- **Zero credentials in source code.** No hardcoded passwords, tokens, API keys, connection strings, or PII. Use environment variables.
- **OWASP A03 (Injection) and A01 (Access Control):** all user-controlled input must be sanitized. No `$_GET/$_POST/$_REQUEST` directly in PHP examples, no string-concatenated SQL anywhere.
- **CWE references** in commit messages or PR descriptions when fixing a security issue (e.g., `CWE-22`, `CWE-89`).
- **Mask sensitive data in logs** before any `console.log` / `logger.info`.

### Documentation in code

- Every public function, method, and class needs a docblock (purpose, parameters, return, exceptions).
- Inline comments only for non-obvious logic, business rules, workarounds, or design decisions.
- Comments that simply restate the code are not accepted.
- **TypeScript:** JSDoc. **Java:** Javadoc. **PHP:** PHPDoc. **.NET:** XML Doc.

### Cross-platform compatibility

- All `path.relative` outputs must be converted to POSIX paths using the `toPosix()` helper. Backslashes break mock filesystem lookups and finding evidence paths on Windows.
- New filesystem code must be tested on at least Linux and Windows (or include a justification why one is not relevant).

---

## Development setup

### Prerequisites

- Node.js ≥ 18
- pnpm (workspace support)
- Git

### Clone and install

```bash
git clone https://github.com/hrpimenta/legacy-squad.git
cd legacy-squad
pnpm install
pnpm approve-builds esbuild
```

### Run tests

```bash
npx vitest run          # full suite
npx vitest --watch      # watch mode during development
```

### Run the CLI in dev mode (no build needed)

```bash
npx tsx apps/cli/src/index.ts install -p /path/to/test/project
```

### Build and test the bundled CLI

```bash
node build.mjs
node dist/cli.mjs install -p /path/to/test/project
```

---

## Project structure

```
legacy-squad/
├── packages/
│   ├── core/         # Domain types, ports (Clean Architecture)
│   ├── scanner/      # Stack detection, repo index generation
│   ├── context/      # Context packs builder
│   ├── rules/        # Compliance engine, rule catalog
│   ├── agents/       # Agent definitions, installer, doctor
│   └── output/       # PRS / SDD / MMP / Specs generators
├── apps/
│   └── cli/          # CLI entry point (Commander.js)
├── templates/
│   └── claude-commands/   # Slash command templates per agent
└── docs/
    └── plans/        # Architecture decisions, planning docs
```

When adding new code, place it in the right layer:

- **Domain logic and types** → `packages/core`
- **External integrations (filesystem, npm, git)** → adapter package (`scanner`, `context`, `rules`)
- **User-facing commands** → `apps/cli`
- **Agent prompts and templates** → `templates/claude-commands`

---

## How to contribute

### Adding a rule

The Compliance Engine ships deterministic rules based on OWASP and CWE. Each rule has a YAML definition and a corresponding test fixture.

1. Pick a rule from the [ROADMAP](ROADMAP.md) wish list, or open a discussion proposing a new one.
2. Create the rule definition in `packages/rules/src/catalog/`.
3. Add a test fixture in `packages/rules/tests/fixtures/` — a small code sample that should trigger the rule and another that should not.
4. Write the unit test first (TDD), then implement the detection logic.
5. Reference the OWASP / CWE / framework identifier in the rule metadata.

Example areas where rules are wanted:

- **PHP:** Eloquent raw queries, mass assignment without `$fillable`, blade `{!! !!}` with user input
- **.NET:** Entity Framework string-based SQL, `BinaryFormatter` deserialization, `WebClient` without TLS validation
- **Java:** Hibernate HQL concatenation, `ObjectInputStream.readObject` without filter, deprecated `Date` patterns
- **Mobile:** Insecure storage variants beyond AsyncStorage

### Improving agent templates

The agents live as slash command templates in `templates/claude-commands/`. Each template is a markdown file with the agent's persona, instructions, references, and output structure.

Good improvements:

- Sharper instructions reducing hallucination
- New references (frameworks, standards, methodologies)
- Better output structuring for downstream consumption by generators

When changing a template, validate the agent still works end-to-end by running the full diagnostic on a small test project.

### Adding IDE support

Currently supported: Claude Code, Codex CLI. On the roadmap: Cursor, Gemini CLI.

To add an IDE adapter:

1. Identify the IDE's command discovery mechanism (slash commands, custom directives, MCP, agent file format).
2. Create an installer adapter in `packages/agents/src/installers/`.
3. Generate the IDE-specific command files from the same templates used by other IDEs.
4. Add the `doctor` check to verify the installation.
5. Document the new IDE in [README](README.md) under [Quick Start](README.md#quick-start) and add it to supported IDEs.

### Translation

Documentation is bilingual (English primary, Portuguese mirror). Adding more languages is welcome.

To add a translation:

1. Copy the source file (e.g., `README.md`) to a language-suffixed version (e.g., `README.es.md`).
2. Update the language toggle in the main README header.
3. Keep file names and link targets identical to the source — only the prose translates.
4. Technical terms (PRS, SDD, MMP, OWASP, CWE, slash command names) stay in English.

### Tests and fixtures

Tests and fixtures for stacks not yet validated (PHP/Symfony, Java/Quarkus, .NET/Blazor, etc.) are always welcome. A solid test fixture includes:

- A `manifest.*` file with realistic dependencies
- 2–3 source files exercising patterns the framework should detect
- Expected output (number of findings, modules, dependencies)

---

## Commit conventions

The project uses **[Conventional Commits](https://www.conventionalcommits.org/)**. Examples from the existing history:

```
feat(templates): add SDD, MMP and Execution Specs generators
docs(readme): redesign with hero, quick start, comparison and demo
chore: add pre-commit hook to block corporate email commits
fix: normalize POSIX paths in scanner output on Windows
test: add fixture for PHP Laravel mass assignment
refactor(core): extract SafePath into dedicated module
```

### Accepted types

| Type | Use for |
|---|---|
| `feat` | New feature visible to the user |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `chore` | Maintenance, dependencies, scaffolding |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or correcting tests |
| `ci` | CI configuration |
| `perf` | Performance improvement |
| `style` | Formatting only |

Scope is optional but encouraged (`feat(scanner):`, `docs(readme-ptbr):`, etc.).

---

## Branch naming

Pick the prefix that matches the commit type:

```
feat/short-description
fix/short-description
docs/short-description
chore/short-description
refactor/short-description
release/x.y.z
```

Existing examples: `docs/landing-overhaul`, `docs/1.0.1-readme-fixes`, `feat/sdd-mmp-specs-generators`, `release/1.0.0`.

---

## Pre-commit hooks

The repository has a pre-commit hook that **blocks commits made with corporate email addresses**. This protects the project from accidental disclosure of the contributor's employer.

Before your first commit, verify your git email is personal:

```bash
git config user.email
```

If it returns a corporate address, set a personal one locally for this repo:

```bash
git config user.email "your-personal-email@example.com"
```

This sets the email only for this repository, not globally.

---

## Pull Request process

1. **Fork the repository** (or branch directly if you have write access).
2. **Create a branch** following the naming convention.
3. **Write tests first** (TDD), then implement.
4. **Run the full test suite locally:** `npx vitest run`.
5. **Push and open a PR** with:
   - A descriptive title (Conventional Commit style)
   - A description linking to the issue or discussion that motivated the change
   - The list of files changed, grouped by purpose
   - Test evidence (output of `npx vitest run`)
6. **Address review comments** by pushing additional commits to the same branch — do not force-push during review.
7. **Squash on merge** is the default — keeps the main branch history clean.

### PR checklist

Before requesting review, confirm:

- [ ] Tests are passing locally (`npx vitest run`)
- [ ] New behavior is covered by tests (TDD)
- [ ] No credentials, secrets, or PII anywhere in the diff
- [ ] Public APIs are documented (JSDoc / Javadoc / PHPDoc / XML Doc)
- [ ] Cross-platform paths use the `toPosix()` helper
- [ ] README or relevant docs updated if behavior changed
- [ ] Commit messages follow Conventional Commits
- [ ] Pre-commit hook is happy (personal email configured)

---

## What's out of scope (for now)

To save you time, here are areas where PRs will likely be deferred or rejected:

- **V2 Enterprise features** (refactoring engine, PR engine, QA gates, dashboard) — V2 is a separate, paid product. V1 PRs should not anticipate V2 internals.
- **Changes that violate the Principles** — see [README → Principles](README.md#principles). Most commonly: removing read-only guarantees, sending the full repository to an external LLM, hiding evidence behind opaque AI output.
- **General-purpose code transformation** — the framework diagnoses; it does not refactor in V1.
- **Replacing the IDE-native model** — the framework's value proposition is that AI runs in the developer's IDE. Proposals to host the AI in a server, behind an API gateway, or as a SaaS will not be accepted in V1.

---

## Code of conduct

Be respectful, assume good faith, and stay on the engineering merits. Disagreement on technical direction is normal and welcome — disagreement on someone's worth as a contributor is not.

If you observe a violation, contact the maintainers via a private channel (DM on GitHub, or email listed in the npm package metadata).

---

## Questions?

- **Specific technical questions:** [open a discussion](https://github.com/hrpimenta/legacy-squad/discussions).
- **Bugs:** [open an issue](https://github.com/hrpimenta/legacy-squad/issues/new) with reproduction steps.
- **Sensitive topics (security disclosures, conduct concerns):** contact the maintainers privately, not via public issues.

Thanks again for contributing. The framework gets better with every rule added, every template improvement, every stack validated.

— Legacy Squad maintainers
