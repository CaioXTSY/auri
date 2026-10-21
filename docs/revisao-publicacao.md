# Revisão para publicação — 18/10/2026

Esta revisão organiza a documentação e prepara os arquivos locais para avaliação antes de um push. A visibilidade no GitHub e o deploy não foram alterados.

## O que está preparado

- README principal e READMEs do frontend/backend atualizados para as funcionalidades implementadas.
- Guias de instalação, testes, implantação, publicação e contribuição.
- Exclusão explícita de credenciais, uploads, relatórios, evidências locais e configurações de implantação no Git e no contexto Docker.
- Instalações Docker com `npm ci`; linha Node.js 22 alinhada entre CI, Docker e `.nvmrc`.
- Correção do alias ESM no Vite para permitir carregadores alternativos.
- Envio de e-mail simulado nos testes HTTP, evitando dependência de SMTP externo no CI.
- Atualizações compatíveis das dependências e atualização do override de DOMPurify.

Código, testes com dados fictícios, migrations, exemplos e documentação podem ser enviados para uma branch de revisão. Arquivos locais ignorados devem permanecer no computador.

## Verificações realizadas

| Verificação | Resultado e limite |
| --- | --- |
| Backend: lint | Sem erros; 21 avisos existentes de uso de `any` |
| Backend: build da API e do executor | Aprovados |
| Backend: testes unitários | 61 testes aprovados em 11 suítes |
| TypeScript do backend e schema Prisma | Verificações aprovadas |
| Frontend: lint e build | Aprovados; build com `--configLoader runner` devido a falha de acesso do esbuild neste Windows |
| Frontend: Playwright | 10 testes aprovados sobre o build servido por `vite preview`, com navegador local disponível e configuração temporária; não é o comando padrão do CI |
| Links locais da documentação | Destinos existentes |
| Credenciais | Sem correspondências das credenciais locais verificadas ou padrões de chaves reconhecidos no histórico Git alcançável; não equivale a uma auditoria completa de segurança |
| Exemplos e arquivos locais | Exemplos publicáveis; `.env`, uploads, logs e evidências ignorados |

As verificações locais usaram Node.js 26.4.0 disponível na máquina. A configuração de destino em Node.js 22 ainda precisa ser confirmada pelo CI. Não foram executados builds Docker, integração real do runner ou testes HTTP com MySQL. A conexão configurada aponta para um banco remoto e não foi usada para esses testes.

## Dependências que ainda precisam de revisão

Consulta `npm audit --omit=dev` após as atualizações:

| Aplicação | Dependências de produção |
| --- | --- |
| Frontend | Nenhum alerta encontrado |
| Backend | 1 alerta alto em `nodemailer` e 2 moderados associados a `@nestjs/swagger` / `js-yaml`; nenhum crítico |

O Swagger fixa `js-yaml` em `5.3.0`; não foi aplicado um override sobre essa dependência. O Nodemailer permanece na linha 9 declarada pelo projeto; a correção indicada exige avaliar a migração para a linha 10. Consulte os avisos de [Nodemailer](https://github.com/advisories/GHSA-6vj9-mwq6-2f5v) e [js-yaml](https://github.com/advisories/GHSA-r3ph-w7gj-g6xm).

A consulta completa, incluindo ferramentas de desenvolvimento, também mantém alertas. Não foi usado `npm audit fix --force` para trocar versões principais de Nest CLI, Jest, Tailwind ou outras ferramentas. Os números de auditoria podem mudar à medida que novos avisos são publicados.

## Antes de disponibilizar a instalação

1. Resolver ou avaliar formalmente os alertas restantes do backend e verificar o envio real de e-mail após uma atualização.
2. Confirmar o CI com banco descartável e Node.js 22; verificar as imagens Docker e a integração do executor em ambiente próprio.
3. Revisar o workflow de produção: um push em `main` pode implantar imediatamente, sem aguardar o CI.
4. Antes de tornar o GitHub público, conferir também conteúdo remoto de issues, PRs, releases, artefatos, branches e tags. Esses itens não foram auditados nesta revisão local.

Veja também o [guia de publicação](publicacao.md). Esta revisão não altera os resultados já registrados no TCC nem substitui uma validação de produção.
