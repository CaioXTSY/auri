# AURI — Backend

API da AURI construída com NestJS 11, TypeScript, Prisma 5 e MySQL 8. A preparação completa está no [guia de instalação](../docs/instalacao.md).

## Execução local

Depois de configurar `.env` e o MySQL:

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed:achievements
npm run start:dev
```

O serviço SMTP precisa estar configurado para a API inicializar. A chave OpenAI é opcional. Consulte [.env.example](.env.example) e o guia de instalação.

Swagger: <http://localhost:3001/api/v1/docs>. Healthcheck: <http://localhost:3001/api/v1/health>.

## Organização

```text
prisma/                 Schema, migrations e dados iniciais
src/common/             Configuração HTTP e tipos compartilhados
src/health/             Verificação da API e conexão com o banco
src/modules/
  activities/           Atividades, questões, entregas e correções
  admin/                Operações administrativas e métricas de IA
  auth/                 Login, renovação de sessão e permissões
  classes/              Turmas, matrículas e participantes
  dashboard/            Visões consolidadas por perfil
  gamification/         Pontos, níveis, conquistas e rankings
  mail/                 Recuperação de senha por e-mail
  missions/             Missões e geração de quizzes
  notifications/        Notificações e Socket.IO
  posts/                Mural, respostas e moderação
  programming/          Problemas, casos de teste e submissões
  users/                Usuários e perfis
src/prisma/             Serviço de acesso ao banco
src/worker/             Executor Docker de JavaScript e Python
test/                   Testes HTTP com banco e integração do executor
scripts/                Utilitários de manutenção
```

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run build` | Compilar a API |
| `npm run build:runner` | Compilar o executor |
| `npm run start:prod` | Iniciar a API compilada |
| `npm run start:runner` | Iniciar o executor compilado |
| `npm run lint` | Verificar o código |
| `npm test -- --runInBand` | Executar testes unitários |
| `npm run test:e2e -- --runInBand` | Executar testes HTTP; use banco exclusivo de testes |
| `npm run test:runner:integration` | Verificar o executor com Docker real |
| `npm run prisma:migrate` | Criar migrations durante desenvolvimento do schema |
| `npm run prisma:migrate:deploy` | Aplicar migrations já versionadas |
| `npm run prisma:studio` | Inspecionar o banco pela interface do Prisma |

Mais detalhes: [testes](../docs/testes.md) e [implantação](../docs/implantacao.md). Para Docker, o contexto de build é a **raiz do repositório**, não este diretório.

`scripts/delete_posts.py` é uma ferramenta destrutiva de manutenção: remove todas as postagens e respostas do banco configurado. Não é uma etapa de instalação nem de testes.
