Execute o scanner do Legacy Squad Framework para atualizar os dados do projeto.

## Passos
1. Identifique o diretório raiz do projeto (onde está o package.json/composer.json/.csproj)
2. Execute: `npx legacy-squad scan`
3. Verifique que `.legacy-squad/memory/repo-index.json` foi atualizado
4. Verifique que `.legacy-squad/memory/findings/index.json` foi atualizado
5. Relate o resumo: stack detectada, módulos, findings

Se o comando `npx legacy-squad` não estiver disponível, execute diretamente:
`npx tsx [caminho-do-framework]/apps/cli/src/index.ts scan . -o .legacy-squad`
