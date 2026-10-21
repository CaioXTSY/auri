<p align="center"><img src="frontend/public/auri_logo.webp" alt="AURI" width="140" /></p>

# AURI

Plataforma web gamificada de apoio ao ensino e à aprendizagem de programação, desenvolvida como projeto de TCC. Reúne turmas, atividades, avaliação de código, missões e acompanhamento do progresso em um mesmo ambiente.

## Funcionalidades

| Perfil | Recursos |
| --- | --- |
| Aluno | Ingresso em turmas por aprovação, materiais, entregas, atividades de programação, missões, quiz diário, conquistas e rankings |
| Professor | Gestão de turmas e participantes, criação de atividades textuais, arquivos, questionários e programação, correção de entregas e mural |
| Administrador | Gestão de usuários, turmas, missões e conquistas, notificações e consulta das gerações de IA |

A gamificação utiliza pontos de experiência (XP), níveis, conquistas, missões, rankings e sequência de acertos no quiz diário. As notificações são entregues por Socket.IO. A geração do quiz diário integra a API da OpenAI quando configurada.

## Arquitetura

| Diretório | Tecnologias | Responsabilidade |
| --- | --- | --- |
| [frontend/](frontend/README.md) | React 19, TypeScript, Vite, Tailwind CSS | Interface e navegação por perfil |
| [backend/](backend/README.md) | NestJS 11, Prisma 5, MySQL 8 | API REST, autenticação JWT, permissões e regras de negócio |
| [backend/src/worker/](backend/src/worker/) | Node.js e Docker | Execução e avaliação de submissões JavaScript e Python |
| [docs/](docs/) | Documentação | Instalação, testes, implantação e publicação |

O frontend acessa a API em `/api/v1`. O token de acesso fica em memória e a renovação utiliza um cookie HttpOnly. O executor de código é um processo separado; em produção, deve operar em um host dedicado.

## Começar

Pré-requisitos: **Node.js 22.12+** (linha 22 definida em [.nvmrc](.nvmrc)), npm e MySQL 8. Docker é necessário para executar submissões de programação. A API também exige configuração SMTP na inicialização; a chave da OpenAI é opcional.

```bash
git clone https://github.com/CaioXTSY/auri.git
cd auri
```

Siga o [guia de instalação](docs/instalacao.md) para configurar os arquivos de ambiente, preparar o banco e iniciar os serviços. Há instruções para desenvolvimento local e Docker Compose.

| Serviço | Endereço padrão |
| --- | --- |
| Frontend em desenvolvimento | <http://localhost:5173> |
| Frontend via Compose | <http://localhost:3010> |
| API | <http://localhost:3001/api/v1> |
| Swagger | <http://localhost:3001/api/v1/docs> |
| Disponibilidade da API e do banco | <http://localhost:3001/api/v1/health> |

## Documentação

- [Instalação, configuração e primeiro administrador](docs/instalacao.md)
- [Testes e limites da validação](docs/testes.md)
- [Implantação, migrations e executor de código](docs/implantacao.md)
- [Preparação para publicação do repositório](docs/publicacao.md)
- [Resultado da revisão para publicação](docs/revisao-publicacao.md)
- [Como contribuir](CONTRIBUTING.md)

## Escopo e limites

- A avaliação automática de código compara a execução com os casos de teste cadastrados. A qualidade desses testes influencia o resultado; isso não substitui toda a avaliação do professor.
- Os questionários gerados por IA passam por verificações automáticas, mas ainda podem conter erros. A versão atual não exige aprovação humana antes de publicar o quiz diário.
- Os testes disponíveis e suas dependências estão descritos no [guia de testes](docs/testes.md). Eles não comprovam eficácia pedagógica nem cobertura integral dos requisitos.
- Dados de usuários, uploads, arquivos `.env`, relatórios locais e evidências do TCC não fazem parte do código publicado.

## Licença

Distribuído sob a licença [MIT](LICENSE).
