# AURI — Frontend

Interface da AURI para alunos, professores e administradores. Utiliza React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form, Zod e Monaco Editor.

## Executar

A partir deste diretório:

```bash
cp .env.example .env
npm ci
npm run dev
```

No PowerShell, use `Copy-Item .env.example .env` para copiar o arquivo. Configure `VITE_API_URL` com a origem da API, **sem** `/api/v1`. O frontend acrescenta esse prefixo.

Abra <http://localhost:5173>. A API padrão é <http://localhost:3001>. Variáveis `VITE_*` são incorporadas ao build e ficam visíveis no navegador; nunca use esse prefixo para segredos.

## Recursos implementados

- Autenticação, recuperação de senha e navegação por perfil.
- Painéis de aluno, professor e administração.
- Turmas, solicitações de ingresso e participantes.
- Atividades textuais, arquivos, questionários, entregas e correção.
- Atividades de programação, editor Monaco e acompanhamento das submissões.
- Missões, quizzes, pontos, níveis, conquistas e rankings.
- Mural, moderação, notificações e configurações do perfil.

## Organização

```text
src/components/         Componentes de interface e dos módulos
src/hooks/              Comportamentos compartilhados e consulta de dados
src/pages/              Telas públicas e áreas de aluno, professor e administração
src/services/           Integração com a API
src/stores/             Estado da autenticação
src/schemas/            Validação de formulários
src/types/              Contratos TypeScript
src/lib/                Cliente HTTP, navegação e utilitários
tests/e2e/              Navegação, painel do professor e acessibilidade
```

## Verificação

```bash
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run test:a11y` executa somente o arquivo de testes de acessibilidade das páginas públicas. O conjunto completo também verifica acessibilidade no painel do professor com respostas simuladas da API. Esses testes não comprovam, sozinhos, todos os fluxos com o backend real.

Consulte os guias de [instalação](../docs/instalacao.md), [testes](../docs/testes.md) e [implantação](../docs/implantacao.md). O build Docker usa a raiz do repositório como contexto.
