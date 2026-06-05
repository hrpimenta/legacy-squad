# Plan: Reestruturação Legacy Squad Framework — Modelo AIOX

**Data:** 2026-06-04
**Status:** Aguardando aprovação
**Impacto:** Arquitetura fundamental do framework

---

## Objetivo

Reestruturar o Legacy Squad Framework para seguir o modelo AIOX: **instalar-se dentro do projeto alvo** com um único comando, configurar agentes como slash commands nativos da IDE (Claude Code, Codex, Cursor), e usar a IA do ambiente do dev em vez de chamar API ou gerar prompts para copiar.

## Escopo

### Dentro
- CLI como pacote NPX (`npx legacy-squad install`)
- Instalação dentro do projeto alvo (`.legacy-squad/`, `.claude/commands/`)
- Agentes como slash commands nativos do Claude Code
- Scanner + Compliance Engine como step de instalação
- Suporte a Claude Code como IDE primária (Codex e Cursor como secundárias)

### Fora
- UI/Dashboard (V2+)
- Execução autônoma de refatoração (V2 Enterprise)
- LLM Routing / proxy de providers (complexidade prematura)

## O que muda vs. estado atual

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Instalação | Baixar zip, extrair, pnpm install | `npx legacy-squad install` |
| Onde roda | De fora do projeto | Dentro do projeto alvo |
| Agentes de IA | Prompt .md para copiar | Slash commands na IDE (`/legacy-squad-security`) |
| Quem executa a IA | Ninguém (era determinístico) | A IDE do dev (Claude Code, Codex) |
| Output | PRS gerado pelo framework | PRS consolidado dos assessments dos agentes |
| Scan | Comando separado | Roda automaticamente no `install` |

## Arquitetura Alvo

### Instalação: `npx legacy-squad install`

```
1. Detecta projeto (lê package.json, composer.json, .csproj, pom.xml)
2. Roda Scanner → gera repo-index.json
3. Roda Compliance Engine → gera findings.json
4. Gera context-packs.json
5. Instala .legacy-squad/ com dados
6. Instala .claude/commands/legacy-squad/ com agentes
7. Atualiza .claude/settings.json se necessário
8. Gera AGENTS.md na raiz (Codex compatibility)
9. Exibe resumo e próximos passos
```

### Estrutura instalada no projeto alvo

```
projeto-legado/
├── .legacy-squad/
│   ├── config/
│   │   └── project.yaml              # Configuração do projeto
│   ├── memory/
│   │   ├── repo-index.json            # Inventário do repositório
│   │   ├── findings.json              # Achados do compliance engine
│   │   └── context-packs.json         # Context packs por módulo
│   ├── outputs/
│   │   ├── reports/                   # PRS, SDD, MMP gerados
│   │   └── assessments/               # Assessments dos agentes (IA)
│   └── rules/
│       └── catalog.json               # Regras aplicadas
│
├── .claude/
│   └── commands/
│       └── legacy-squad/
│           ├── scan.md                # /legacy-squad-scan
│           ├── security.md            # /legacy-squad-security
│           ├── architecture.md        # /legacy-squad-architecture
│           ├── legacy-code.md         # /legacy-squad-legacy-code
│           ├── business-rules.md      # /legacy-squad-business-rules
│           ├── modernization.md       # /legacy-squad-modernization
│           └── generate-prs.md        # /legacy-squad-generate-prs
│
└── AGENTS.md                          # Codex CLI compatibility
```

### Fluxo do dev no Claude Code

```
1. cd projeto-legado
2. npx legacy-squad install          ← instala tudo
3. claude                            ← abre Claude Code
4. /legacy-squad-security            ← agente lê findings + source files
5. Claude analisa, produz assessment, salva em .legacy-squad/outputs/
6. /legacy-squad-architecture        ← repete para cada pilar
7. /legacy-squad-generate-prs        ← consolida tudo no PRS final
```

### Como o slash command funciona (exemplo security.md)

```markdown
Você é o Security Agent do Legacy Squad Framework.

Leia os seguintes arquivos para contexto:
- .legacy-squad/memory/repo-index.json (inventário do projeto)
- .legacy-squad/memory/findings.json (achados determinísticos)

Com base no repo-index, leia os arquivos-fonte mais relevantes para
segurança (stores, auth, config, utils) e produza um assessment
estruturado cobrindo:

1. Validação dos findings existentes
2. Novos achados que regex não detectou
3. Análise de fluxos de autenticação
4. Análise de tratamento de dados sensíveis
5. Recomendações priorizadas

Salve o resultado em: .legacy-squad/outputs/assessments/security-assessment.md
```

Claude Code tem acesso direto aos arquivos do projeto — não precisa
receber o código no prompt. Ele lê os arquivos indicados pelo agente.

## CLI Commands (modelo AIOX)

```bash
npx legacy-squad init <nome-projeto>    # Wizard para novo projeto
npx legacy-squad install                # Instalar em projeto existente
npx legacy-squad scan                   # Re-scan sem reinstalar agentes
npx legacy-squad doctor                 # Verificar saúde da instalação
npx legacy-squad update                 # Atualizar para versão mais recente
```

## Decisões de Design

### DD-001: Framework se instala dentro do projeto (não roda de fora)
**Contexto:** Modelo AIOX instala arquivos no projeto alvo.
**Decisão:** O `install` copia agentes + dados para dentro do projeto.
**Consequência:** Agentes são versionáveis junto com o código; IDE lê automaticamente.

### DD-002: IA vem da IDE, não do framework
**Contexto:** AIOX não chama API — prepara contexto para a IDE.
**Decisão:** Framework gera dados (scan, findings, context packs); a IDE executa a IA.
**Consequência:** Elimina necessidade de API key no framework; funciona com qualquer IDE que suporte agentes.

### DD-003: Slash commands como interface de agente
**Contexto:** AIOX usa `.claude/commands/AIOX/agents/{agent-id}.md`.
**Decisão:** Agentes instalados em `.claude/commands/legacy-squad/*.md`.
**Consequência:** Ativação nativa na IDE com `/legacy-squad-security` etc.

### DD-004: Scanner e Compliance Engine rodam no install
**Contexto:** O scan precisa acontecer antes dos agentes terem dados.
**Decisão:** `install` roda scan + compliance + context packs automaticamente.
**Consequência:** Após o install, os agentes já têm tudo que precisam.

## Riscos

- **IDE lock-in:** Claude Code como primária limita devs que usam outras IDEs → mitigação: AGENTS.md para Codex, .cursor/rules para Cursor
- **Dados desatualizados:** Se o código muda, o scan fica stale → mitigação: `npx legacy-squad scan` para re-scan
- **Tamanho do repo-index:** Projetos grandes geram index pesado → mitigação: Context Manager com token budget

## Critérios de aceite

1. `npx legacy-squad install` roda com uma linha e instala tudo no projeto
2. `/legacy-squad-security` funciona no Claude Code e produz assessment real
3. Assessment lê `.legacy-squad/memory/` e arquivos-fonte diretamente
4. 28+ testes passando no framework
5. Funciona no Windows CMD

## Impacto nos documentos do projeto

### TAS (Technical Architecture Specification)
- **Seção 3 (High-Level Architecture):** Adicionar camada de instalação e IDE integration
- **Seção 5 (Monorepo Structure):** Refletir pacote NPX + instalação no projeto alvo
- **Seção 6 (CLI Commands):** Atualizar para modelo `install`/`init`/`doctor`
- **Seção 8 (Generated Project Folder):** Refletir nova estrutura `.legacy-squad/`
- **Seção 15 (Agent Architecture):** Reescrever — agentes são slash commands, não serviços
- **Seção 17 (Provider Architecture):** Simplificar — provider é a IDE, não o framework

### Framework Specification
- **Seção 13 (Governance Model):** Adicionar IDE como camada de execução
- **Seção 15 (Open Core Boundary):** Clarificar que Community usa IDE; Enterprise adiciona automação

### PRD
- **Seção 9 (Core Capabilities):** Adicionar "IDE-Native Agent Execution"
- **Seção 11 (Differentiators):** Adicionar "Zero API Key Required"

## Passos de execução

1. Atualizar TAS com nova arquitetura
2. Atualizar Framework Spec e PRD (seções impactadas)
3. Reestruturar CLI como pacote NPX com `install` command
4. Criar slash command templates por agente
5. Implementar instalação no projeto alvo
6. Criar AGENTS.md generator para Codex
7. Testar end-to-end: install → Claude Code → assessment
8. Empacotar e entregar
