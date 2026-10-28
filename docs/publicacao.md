# Publicação do repositório

## Conteúdo destinado ao GitHub

Podem ser versionados código, testes com dados sintéticos, schema e migrations, seeds, arquivos de dependências, Dockerfiles, exemplos de configuração, workflows e documentação.

Mantenha fora do Git:

- `.env`, `.env.production`, senhas, tokens, certificados e chaves privadas;
- bancos, dumps, uploads e dados de usuários;
- `node_modules`, builds, cobertura, logs e relatórios Playwright;
- configurações locais em `deploy/`, ajustes pessoais de ferramentas e evidências em `tcc-evidencias/`.

Esses arquivos locais são preservados e excluídos pelo `.gitignore`. Exemplos `.env.example` devem conter apenas valores fictícios. Migrations SQL são parte do código e permanecem versionadas.

## Antes de publicar uma revisão

1. Revise `git status --short` e `git diff --check`. Adicione somente o que pretende disponibilizar.
2. Execute as verificações descritas em [testes](testes.md), com banco exclusivo para os testes HTTP.
3. Consulte `npm audit` nos dois diretórios e avalie as pendências. Atualizações precisam de build e testes; evite `--force` sem avaliar a migração.
4. Busque credenciais no estado atual e no histórico. `.gitignore` não remove dados de commits antigos. Uma chave exposta precisa ser revogada antes de tratar o histórico.
5. Confira licença, autoria e permissão de uso de materiais externos. O projeto contém licença MIT; `private: true` nos pacotes impede publicação acidental no npm e não controla a visibilidade do GitHub.
6. Confira se o README descreve funcionalidades implementadas e se os links relativos abrem.

## Ao mudar a visibilidade para pública

A visibilidade no GitHub é separada do commit/push. Revise também branches, tags, issues, pull requests, comentários, releases e artefatos de Actions, que não são cobertos por uma busca nos arquivos locais. Verifique as opções de proteção de branch, detecção de segredos e relato privado de vulnerabilidades disponíveis nas configurações.

O workflow de produção executa em pushes para `main`; publicar código nessa branch também pode implantar a aplicação. Consulte [implantação](implantacao.md#deploy-por-github-actions).

O código pode ser disponibilizado para análise acadêmica sem publicar banco, contas, credenciais ou evidências locais do TCC. Uma tag de entrega pode identificar a revisão avaliada; os resultados do TCC devem corresponder a ela.
