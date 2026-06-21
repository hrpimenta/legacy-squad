\# Legacy Squad Framework



AI-powered legacy modernization platform. Open Core, IDE-native, v1.0.1 estável.

Slogan: Understand. Plan. Modernize.



\## Contexto persistente

\- Decisões arquiteturais e dívidas técnicas: @memory.md

\- Roadmap público: @ROADMAP.md

\- Como contribuir: @CONTRIBUTING.md



Documentos de produto (carregar sob demanda no prompt, não automaticamente):

\- `docs/FRAMEWORK\_SPECIFICATION\_ENTERPRISE\_V1.1.md` — metodologia

\- `docs/TAS\_ENTERPRISE\_V1.1.md` — arquitetura técnica

\- `docs/PRD\_ENTERPRISE\_V1.1.md` — produto e posicionamento



\## Preferências de trabalho

\- Responder sempre em pt-br.

\- Toda decisão arquitetural vira entrada DA-XXX no `memory.md` antes de codar.

\- Toda dívida técnica vira DT-XXX no `memory.md` com framework afetado, risco e prazo.

\- Nunca atribuir número DA/DT sem antes ler as últimas entradas do `memory.md`.

\- TDD obrigatório: Red → Green → Refactor. Testes em Vitest.

\- Feature branch + PR. Commits direto na `main` somente para docs/config (como este `CLAUDE.md`).

\- Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `refactor:`, `docs:`).

\- SOLID; refatorar duplicação imediatamente; comentários só onde a intenção não está clara no código.

\- Modular para reuso — funções e classes pequenas e com responsabilidade única.



\## Ambiente

\- Windows / CMD em `C:\\Temp\\legacy-squad`.

\- `pnpm` exige `set PATH=%PATH%;%APPDATA%\\npm` por sessão CMD.

\- Build: `node build.mjs`. Testes: `pnpm test`. Versão atual: 1.0.1.

\- Git: `user.email` = `hrpimenta@gmail.com`. Pre-commit em `.githooks/pre-commit` (já ativo via `core.hooksPath`).



\## Fluxo de trabalho atual

\- Em execução: \*\*DA-011\*\* — particionamento de `findings.json` por pilar → v1.2.0.

\- Em fila: \*\*DA-012\*\* — orquestrador `/legacy-squad` (dashboard + state detection) → v1.3.0, depende de DA-011.



\## Como esta sessão deve operar

1\. Antes de qualquer mudança em código que toque mais de um arquivo, apresente um plano em \*\*plan mode\*\* e aguarde aprovação.

2\. Toda alteração em código de `packages/` ou `apps/` é precedida por teste em vermelho (Vitest).

3\. Cada fase do trabalho termina com: testes passando, `memory.md` atualizado, e lista de commits feitos.

4\. Não misture escopos: uma sessão = uma fase coerente.

