\---

paths:

&#x20; - "packages/\*\*"

&#x20; - "apps/\*\*"

&#x20; - "templates/\*\*"

\---



\# Regras de engenharia (carregadas em código)



\## Segurança (OWASP / CWE)

\- Nunca usar `$\_GET`, `$\_POST`, `$\_REQUEST` direto em PHP sem sanitização centralizada.

\- Em .NET, sempre `SqlParameter` ou EF. Nunca SQL concatenado (CWE-89).

\- Em Node/TS, validar e tipar input em borda (controllers, CLIs, handlers).

\- Zero hardcode de senhas, tokens, chaves de API, connection strings, CPF/CNPJ, PII ou PHI.

\- Em logs, mascarar dados sensíveis antes de qualquer `console.log` / `logger.info`.



\## TDD obrigatório

\- Vermelho antes de verde. Escrever o teste que falha primeiro.

\- Refactor só depois do verde. Refactor não muda comportamento — testes continuam verdes.

\- Vitest é o runner único. Testes em `packages/<pkg>/tests/` espelhando a estrutura de `src/`.

\- Cobertura para nova feature: caminho feliz + ao menos um erro/edge case.



\## SOLID

\- Cada classe/módulo com uma responsabilidade. Se descrever com "e", separar.

\- Dependências por interface (porta), não por classe concreta. Implementações em camada externa.

\- Método > 20 linhas ou função com mais de 3 níveis de aninhamento = refatorar.

\- DRY: duplicação aparente vira função/utilitário. Duplicação semântica vira abstração só quando o padrão aparece 3 vezes.



\## Documentação no código

\- Toda função/método/classe pública: TSDoc/JSDoc com propósito, parâmetros, retorno, exceções.

\- Comentários inline apenas onde a intenção não está no nome — regras de negócio, workarounds, decisões de design.

\- Referenciar ticket, CWE ou OWASP quando o código existe por exigência de segurança ou compliance.

\- Proibido comentário óbvio que reescreve o código.



\## Convenções do projeto

\- Normalizar paths para POSIX no output via helper `toPosix()` antes de gravar findings/evidence.

\- Testes usam `resolve()` / `join()`, nunca paths POSIX hardcoded.

\- IDs de findings seguem `<PILAR>-<STACK>-<NNN>` (ex.: `SEC-MOB-001`, `CQ-MIX-001`).

\- Toda escrita em `.legacy-squad/memory/` passa por classe dedicada (não inline no installer).



\## Dívida técnica

\- Se uma regra acima não puder ser aplicada agora, registrar entrada DT-XXX no `memory.md` com:

&#x20; descrição, framework afetado (OWASP A03, CWE-89, etc.), risco (Alto/Médio/Baixo), prazo de correção.

\- Nenhuma exceção sem registro.



\## APIs e integrações externas

\- Implementação de cliente HTTP, SDK ou webhook segue documentação oficial do fornecedor.

\- Cobertura mínima: método, URL, headers, auth, payload in/out, status codes, tratamento de erro, timeout, retry com limite, idempotência, logs sem dados sensíveis, correlation ID.

