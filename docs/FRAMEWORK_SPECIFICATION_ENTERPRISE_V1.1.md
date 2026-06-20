# Legacy Squad Framework
## Framework Specification Enterprise v1.0.1

**Slogan:** Understand. Plan. Modernize.
**Revision:** 1.0.1 — IDE-Native Agent Execution

---

## 1. Purpose

O Legacy Squad Framework define uma metodologia estruturada para compreender, avaliar, planejar e modernizar sistemas legados de forma incremental usando IA nativa da IDE, padrões de engenharia e governança técnica.

O framework responde:

- O que temos?
- Qual o risco?
- Como evoluir?
- Em que ordem?
- Como minimizar impacto?
- Quando estamos prontos para executar?

---

## 2. Principles

### Evidence Driven

Nenhuma recomendação deve ser baseada apenas em interpretação da IA.
Todo diagnóstico deve possuir evidência, impacto, referência técnica e recomendação.

### Context First

Nenhuma LLM recebe o repositório completo.
O contexto passa por Repo Index, Summaries e Context Packs.

### Install-First

O framework se instala dentro do projeto alvo com um único comando. Agentes, dados e configuração vivem no repositório.

### IDE-Native

A IA é executada pela IDE do desenvolvedor (Claude Code, Codex, Cursor). O framework gera dados e contexto; a IDE executa os agentes.

### Incremental Modernization

Toda modernização deve ser incremental, reversível, observável, testável e deployável.

### Production First

O sistema legado é assumido como estando em produção.
Toda recomendação deve minimizar risco operacional.

### Human Governance

IA recomenda.
Humano aprova.

---

## 3. Lifecycle

```text
Installation
↓
Discovery
↓
Assessment (IDE-Native)
↓
Design
↓
Modernization Planning
↓
Execution Planning
↓
Execution Platform (V2)
```

---

## 4. Installation Phase

### Objetivo

Instalar o framework dentro do projeto alvo e preparar dados para os agentes.

### Atividades

- detectar stack;
- escanear repositório;
- gerar Repo Index;
- executar Compliance Engine;
- gerar Findings;
- gerar Context Packs;
- instalar agentes na IDE.

### Saídas

- `.legacy-squad/memory/` com repo-index, findings, context-packs;
- `.claude/commands/legacy-squad/` com agentes;
- `AGENTS.md` para Codex.

---

## 5. Discovery Phase

### Objetivo

Compreender tecnicamente o sistema (via scanner determinístico).

### Atividades

- escanear repositório;
- identificar stack em camadas (manifesto → extensão → heurística);
- mapear módulos;
- mapear entrypoints;
- mapear integrações;
- mapear dependências;
- gerar Repo Index.

### Saídas

- Inventory Report;
- Technology Map;
- Repository Map;
- Repo Index.

---

## 6. Assessment Phase

### Objetivo

Avaliar qualidade, risco e maturidade usando agentes nativos da IDE.

### Security Assessment

Agente: `/legacy-squad-security`

Referências: OWASP ASVS, OWASP SAMM, OWASP MASVS, NIST SSDF.

Input: repo-index + findings + source files.

Saída: Security Assessment Report.

### Architecture Assessment

Agente: `/legacy-squad-architecture`

Referências: C4, arc42, ADR, Clean Architecture.

Input: repo-index + context packs + source files.

Saída: Architecture Assessment Report.

### Legacy Code Assessment

Agente: `/legacy-squad-legacy-code`

Referências: Clean Code, Sonar Rules, Cognitive Complexity.

Input: repo-index + hotspots + source files.

Saída: Legacy Code Assessment Report.

### Business Rules Assessment

Agente: `/legacy-squad-business-rules`

Referências: DDD, Event Storming.

Input: context packs + source files.

Saída: Business Rules Catalog.

### Modernization Assessment

Agente: `/legacy-squad-modernization`

Referências: Strangler Fig, Branch by Abstraction, Progressive Delivery.

Input: todos os assessments anteriores + repo-index.

Saída: Modernization Assessment Report.

---

## 7. Design Phase

### Objetivo

Definir arquitetura alvo e decisões técnicas.

### Artefato

SDD — Software Design Document.

### Conteúdo

- arquitetura atual;
- arquitetura alvo;
- componentes;
- integrações;
- segurança;
- observabilidade;
- restrições;
- decisões arquiteturais.

---

## 8. Modernization Planning Phase

### Objetivo

Criar estratégia incremental de modernização.

### Artefato

MMP — Modernization Master Plan.

### Conteúdo

- estratégia de modernização;
- roadmap em fases;
- atualização de stack;
- matriz de risco;
- estratégia de rollback;
- Deployability Score;
- Execution Readiness Score.

---

## 9. Execution Planning Phase

### Objetivo

Transformar plano em trabalho executável.

### Artefato

Execution Specs.

### Estrutura da Spec

Cada spec deve conter:

- id;
- título;
- pilar;
- fase;
- risco;
- arquivos afetados;
- objetivo;
- comportamento atual;
- comportamento esperado;
- critérios de aceite;
- rollback;
- dependências;
- deployability score;
- human approval required.

---

## 10. Compliance Lifecycle

Todo achado segue:

```text
Achado
↓
Evidência
↓
Impacto
↓
Framework relacionado
↓
Justificativa
↓
Recomendação
↓
Prioridade
```

---

## 11. Framework Maturity Model

### Level 1 — Unknown

Sistema sem documentação e sem visão arquitetural.

### Level 2 — Installed

Framework instalado. Repo Index e Findings disponíveis.

### Level 3 — Assessed

Agentes executaram assessments dos pilares.

### Level 4 — Planned

MMP aprovado.

### Level 5 — Modernization Ready

Specs geradas e sistema preparado para execução assistida.

### Level 6 — Continuously Modernized

Modernização contínua supervisionada pela plataforma.

---

## 12. Execution Readiness Score

Mede o preparo para execução por agentes.

Escala: 0 a 100.

Critérios:

- arquitetura: 20%;
- segurança: 20%;
- acoplamento: 20%;
- testabilidade: 20%;
- deployabilidade: 20%.

---

## 13. Deployability Score

Mede a segurança de uma mudança ser implantada isoladamente.

Escala: 1 a 10.

---

## 14. Governance Model

### Framework

Responsável por metodologia, compliance, consistência e templates.

### IDE + Agentes

Responsáveis por análise, diagnóstico, consolidação e geração de artefatos. Executados pela IDE do dev (Claude Code, Codex, Cursor).

### Humano

Responsável por validação, priorização, aceite e aprovação.

---

## 15. Standard Artifacts

### PRS

Product Refactor Specification.
Consolida diagnóstico, riscos, regras e oportunidades.

### SDD

Software Design Document.
Define arquitetura atual, arquitetura alvo e decisões técnicas.

### MMP

Modernization Master Plan.
Define plano incremental, fases, riscos e rollback.

### Execution Specs

Transformam o plano em trabalho executável para V2.

---

## 16. Open Core Boundary

### Community Edition

Foco:

- instalar;
- entender;
- avaliar (via IDE);
- planejar.

### Enterprise Edition

Foco:

- executar;
- refatorar;
- testar;
- abrir PRs;
- automatizar modernização;
- CI/CD integration;
- custom rule packs.

---

## 17. Success Definition

O framework é bem-sucedido quando um dev pode, com um único comando de instalação e ativação de agentes na IDE, transformar um sistema legado em:

```text
Instalado
↓
Compreendido
↓
Avaliado
↓
Planejado
↓
Preparado para modernização
```

sem exigir reescrita completa e sem interromper produção.

---

## 18. Framework Vision

Legacy Squad Framework é uma metodologia de modernização incremental orientada por evidências, com agentes nativos da IDE, projetada para transformar sistemas legados em ativos preparados para evolução contínua.

**Understand. Plan. Modernize.**
