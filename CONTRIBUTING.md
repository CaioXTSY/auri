# Como contribuir

Abra uma issue descrevendo o problema ou proposta antes de mudanças maiores. Não inclua credenciais, dados de alunos/professores, dumps, logs privados ou arquivos enviados por usuários.

## Preparação

1. Siga o [guia de instalação](docs/instalacao.md).
2. Trabalhe em uma branch própria e agrupe mudanças relacionadas.
3. Utilize dados fictícios e um banco exclusivo para testes HTTP.
4. Execute as verificações relevantes do [guia de testes](docs/testes.md).

## Pull requests

Descreva o problema, o comportamento resultante e como verificou a mudança. Inclua prints de interface quando ajudarem, sem informações pessoais. Atualize os exemplos de ambiente e a documentação se os comandos ou configurações mudarem.

Não envie `node_modules`, builds, `.env`, uploads ou relatórios locais. Mantenha os `package-lock.json` junto de alterações de dependências para permitir instalação com `npm ci`.

As contribuições seguem a licença [MIT](LICENSE) do projeto.
