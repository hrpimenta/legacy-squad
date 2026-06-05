# Legacy Squad Framework
## Product Requirements Document (PRD) Enterprise v1.0.1

**Slogan:** Understand. Plan. Modernize.
**Positioning:** AI-Powered Legacy Modernization Platform
**Model:** Open Core
**V1:** Discovery Platform / Community Edition
**V2:** Execution Platform / Enterprise Edition
**Revision:** 1.0.1 — IDE-Native Agent Architecture

---

## 1. Executive Summary

Legacy Squad Framework é uma plataforma Open Core para modernização de sistemas legados com agentes de IA nativos da IDE.

A plataforma se instala dentro do repositório alvo com um único comando (`npx legacy-squad install`), analisa o sistema automaticamente, e disponibiliza agentes especializados como slash commands na IDE do desenvolvedor (Claude Code, Codex, Cursor).

A V1 é focada em diagnóstico e planejamento. A V2 adiciona execução assistida, refatoração, QA e geração de pull requests como parte monetizável da estratégia Enterprise.

---

## 2. Problem Statement

Sistemas legados costumam sustentar processos críticos, mas frequentemente apresentam:

- baixa documentação;
- alto acoplamento;
- tecnologia obsoleta;
- regras de negócio escondidas no código;
- baixa testabilidade;
- dependência de especialistas;
- medo de alteração em produção;
- risco alto de regressão.

Abordagens tradicionais, como reescrita total ou refatoração manual sem governança, tendem a ser caras, lentas e arriscadas.

---

## 3. Vision

Transformar sistemas legados em ativos preparados para modernização contínua por meio de:

- instalação com um comando;
- agentes de IA nativos da IDE;
- engenharia de software;
- arquitetura;
- segurança;
- compliance técnico;
- planejamento incremental.

---

## 4. Product Positioning

Legacy Squad Framework não é uma ferramenta de geração de código.

É uma plataforma de modernização de legados com foco em:

- compreensão automatizada do sistema;
- avaliação orientada por evidências;
- agentes especializados na IDE;
- planejamento de modernização;
- geração de especificações executáveis;
- zero API key necessária.

---

## 5. Target Market

### Enterprise

- bancos;
- seguradoras;
- operadoras de saúde;
- telecom;
- varejo;
- indústria;
- governo.

### Consultorias

- modernização de sistemas;
- arquitetura;
- transformação digital;
- gestão de dívida técnica.

### Software Houses

- manutenção evolutiva;
- sustentação;
- atualização tecnológica;
- migração controlada.

---

## 6. Personas

### Modernization Architect

Responsável por diagnóstico, arquitetura e estratégia de evolução.

Dores:
- falta de visão do legado;
- dificuldade de priorizar modernização;
- risco de impacto em produção.

Como usa: `npx legacy-squad install` → `/legacy-squad-architecture` → `/legacy-squad-modernization`

### Tech Lead

Responsável pela execução técnica e qualidade da entrega.

Dores:
- código acoplado;
- baixa documentação;
- ausência de testes;
- backlog técnico mal estruturado.

Como usa: `npx legacy-squad install` → `/legacy-squad-legacy-code` → `/legacy-squad-security`

### Engineering Manager

Responsável por investimento, roadmap e governança.

Dores:
- custo alto de modernização;
- baixa previsibilidade;
- risco operacional;
- dificuldade de justificar investimento.

Como usa: revisa PRS gerado pelos agentes.

### PO / PM

Responsável por valor de produto e priorização.

Dores:
- dificuldade de entender impacto técnico;
- baixa clareza de fases;
- medo de interromper evolução funcional.

Como usa: revisa Business Rules Assessment e MMP.

---

## 7. Product Strategy

### Community Edition — V1 Discovery Platform

Foco: **Install + Understand + Plan**

Inclui:

- CLI (install, scan, doctor);
- Scanner com detecção em camadas;
- Repo Index;
- Context Manager;
- Compliance Engine;
- Agentes de diagnóstico (slash commands);
- PRS via agente;
- Suporte a Claude Code, Codex, Cursor.

### Enterprise Edition — V2 Execution Platform

Foco: **Modernize**

Inclui:

- Refactoring Engine;
- QA Engine;
- Pull Request Engine;
- Worktree Manager;
- Execution Orchestrator;
- Advanced Stack Upgrade Engine;
- Dashboard;
- Team Collaboration;
- Custom Rule Packs;
- CI/CD Integration.

---

## 8. Product Pillars

### Segurança

Referências: OWASP ASVS, OWASP SAMM, OWASP MASVS, NIST SSDF.

### Arquitetura

Referências: C4 Model, arc42, ADR, Clean Architecture.

### Código Legado

Referências: Clean Code, Sonar Rules, Cognitive Complexity.

### Regras de Negócio

Referências: Domain-Driven Design, Event Storming, User Story Mapping.

### Modernização Incremental

Referências: Strangler Fig, Branch by Abstraction, Progressive Delivery, Canary Release, Feature Flags.

---

## 9. Core Capabilities V1

### Installation

Instala o framework no projeto alvo com um comando. Configura agentes, gera dados, prepara tudo para a IDE.

### Discovery

Mapeia stack (em camadas), módulos, dependências, entrypoints e integrações.

### Assessment — IDE-Native

Agentes especializados na IDE avaliam segurança, arquitetura, código legado, regras de negócio e modernização. A IA vem da IDE; o framework fornece contexto e dados.

### Design

Gera o SDD com arquitetura atual, arquitetura alvo e decisões técnicas.

### Modernization Planning

Gera o MMP com fases, riscos, rollback, stack upgrade e roadmap.

### Execution Planning

Gera specs pequenas, rastreáveis e preparadas para execução futura na V2.

---

## 10. Key Artifacts

### PRS — Product Refactor Specification

Documento de diagnóstico consolidado do legado. Gerado pelo agente `/legacy-squad-generate-prs` a partir dos assessments individuais.

### SDD — Software Design Document

Documento de desenho técnico e arquitetura alvo.

### MMP — Modernization Master Plan

Plano mestre de modernização incremental.

### Specs — Execution Specifications

Especificações pequenas e rastreáveis para execução assistida.

---

## 11. Differentiators

### Install-First

Um comando instala tudo. Sem setup manual, sem configuração de API keys.

### IDE-Native Agents

Agentes são slash commands na IDE. O dev não copia prompts — ativa o agente e recebe análise.

### Zero API Key Required

A IA é executada pela IDE do dev (Claude Code, Codex, Cursor). O framework não precisa de credenciais de LLM.

### Context Manager

Reduz tokens e ruído, evitando envio do repositório inteiro para a LLM.

### Compliance Engine

Gera achados determinísticos com evidência, impacto, padrão relacionado e recomendação.

### Evidence Driven

Dois níveis de análise: determinístico (Compliance Engine) e profundo (agentes LLM via IDE).

### Execution Readiness Score

Mede o quanto o sistema está pronto para execução assistida por IA.

### Deployability Score

Mede a segurança de uma mudança ir para produção de forma isolada.

---

## 12. Roadmap

### V1 — Discovery Platform

Objetivo: instalar, entender e planejar.

Entregas:
- CLI (install, scan, doctor);
- Scanner com detecção em camadas;
- Repo Index;
- Context Manager;
- Compliance Engine;
- Agentes como slash commands;
- PRS via agente;
- Suporte multi-IDE.

### V2 — Execution Platform

Objetivo: executar e monetizar.

Entregas:
- refatoração assistida;
- geração de código;
- testes;
- QA Gates;
- worktrees;
- pull requests;
- stack upgrade controlado;
- custom rule packs;
- CI/CD integration.

### V3 — Autonomous Modernization Platform

Objetivo: modernização contínua supervisionada.

Entregas:
- orquestração multiagente;
- dashboard enterprise;
- execução contínua;
- análise recorrente;
- governança corporativa.

---

## 13. Monetization Strategy

Modelo Open Core:

- Community Edition aberta para adoção;
- Enterprise Edition paga para execução;
- serviços profissionais para diagnóstico, implantação e modernização;
- regras customizadas por segmento;
- custom rule packs;
- suporte corporativo.

---

## 14. Success Metrics

### Técnicas

- percentual de achados com evidência;
- economia de tokens via context packs;
- cobertura de módulos mapeados;
- qualidade das specs;
- precisão da stack detectada.

### Produto

- tempo até primeiro diagnóstico (meta: < 10 minutos);
- número de repositórios com framework instalado;
- taxa de ativação de agentes após install;
- taxa de conversão V1 → V2;
- adoção por consultorias;
- retenção de uso.

### Negócio

- redução de tempo de diagnóstico;
- redução do risco percebido;
- geração de pipeline para execução Enterprise.

---

## 15. Risks

### Técnicos

- alucinação da IA no assessment dos agentes;
- excesso de contexto;
- baixa precisão em stacks específicas;
- variação entre IDEs.

### Produto

- percepção de que V1 "só documenta";
- dificuldade de comunicar valor;
- IDE lock-in (Claude Code como primária).

### Mitigações

- Evidence Driven (Compliance Engine como baseline determinístico);
- Context Manager com token budget;
- Suporte multi-IDE (Claude Code + Codex + Cursor);
- V2 separada como execução paga.

---

## 16. Acceptance Criteria V1

A V1 é aceita quando:

- `npx legacy-squad install` funciona com um comando;
- Scanner gera Repo Index;
- Compliance Engine gera Findings;
- Context Manager gera Context Packs;
- agentes estão instalados como slash commands;
- `/legacy-squad-security` produz assessment real no Claude Code;
- `/legacy-squad-generate-prs` consolida PRS;
- funciona no Windows CMD e Unix;
- Claude Code, Codex e Cursor são suportados.

---

## 17. Product Vision Statement

Legacy Squad Framework existe para ajudar organizações a compreender, planejar e modernizar sistemas legados com um único comando de instalação, agentes nativos da IDE, e inteligência artificial executada no ambiente do desenvolvedor.

**Understand. Plan. Modernize.**
