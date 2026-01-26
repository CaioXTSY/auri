# 1.4 Metodologia

## Tipo de Pesquisa

### Quanto à Natureza
**Pesquisa Aplicada**: desenvolvimento de solução prática para problema real no ensino de programação.

### Quanto à Abordagem
**Quali-Quantitativa**:
- **Qualitativa**: análise de requisitos, usabilidade, experiência do usuário
- **Quantitativa**: métricas de engajamento, performance, taxa de conclusão

### Quanto aos Objetivos
**Pesquisa Exploratória e Descritiva**:
- Exploratória: investigação de gamificação e IA na educação
- Descritiva: documentação do sistema desenvolvido e resultados

## Fases do Desenvolvimento

### Fase 1: Revisão Bibliográfica e Fundamentação (4 semanas)

#### Atividades
- [ ] Revisão de literatura sobre gamificação na educação
- [ ] Estudo de desafios no ensino de programação
- [ ] Investigação de uso de IA em contextos educacionais
- [ ] Análise de trabalhos relacionados

#### Metodologia
- Busca em bases: IEEE Xplore, ACM Digital Library, Google Scholar
- Palavras-chave: gamification, programming education, AI in education
- Leitura crítica e fichamento
- Síntese de conceitos principais

#### Entrega
- Capítulo de Revisão Bibliográfica
- Referencial teórico consolidado

---

### Fase 2: Análise de Requisitos (3 semanas)

#### Atividades
- [ ] Levantamento de requisitos funcionais
- [ ] Definição de requisitos não-funcionais
- [ ] Criação de casos de uso
- [ ] Definição de regras de negócio
- [ ] Validação com potenciais usuários (professores)

#### Técnicas Utilizadas
- **Entrevistas**: com professores de programação
- **Análise de sistemas existentes**: comparação de funcionalidades
- **Brainstorming**: ideias de gamificação
- **Prototipação em papel**: esboços de telas

#### Ferramentas
- Diagramas UML (casos de uso, atividades)
- Figma/Excalidraw para wireframes
- Notion/Trello para organização

#### Entrega
- Documento de Requisitos
- Casos de Uso detalhados
- Wireframes iniciais

---

### Fase 3: Design da Arquitetura (2 semanas)

#### Atividades
- [ ] Definição da arquitetura geral do sistema
- [ ] Escolha de tecnologias (stack)
- [ ] Modelagem do banco de dados
- [ ] Design de APIs
- [ ] Definição de padrões de projeto

#### Decisões Arquiteturais

**Backend**
- Arquitetura em camadas (Controller → Service → Repository)
- API RESTful
- Documentação automática (Swagger/OpenAPI)
- Testes automatizados

**Frontend**
- SPA com React
- Gerenciamento de estado (Context API ou Redux)
- Design System consistente
- Responsividade mobile-first

**Banco de Dados**
- Modelagem relacional
- ORM para abstração
- Migrations para versionamento

**Infraestrutura**
- Docker para containerização
- CI/CD pipeline
- Ambiente de staging e produção

#### Ferramentas
- Draw.io para diagramas
- DBDiagram.io para modelagem
- Postman para design de APIs

#### Entrega
- Diagramas de arquitetura
- Modelo Entidade-Relacionamento
- Especificação de APIs

---

### Fase 4: Desenvolvimento Iterativo (12 semanas)

#### Metodologia: Desenvolvimento Ágil Adaptado

**Sprints de 2 semanas** com foco incremental:

**Sprint 1-2: Fundação**
- Setup do ambiente
- Autenticação e controle de acesso
- CRUD de usuários

**Sprint 3-4: Gestão Acadêmica**
- CRUD de disciplinas e turmas
- Associação de alunos
- Calendário básico

**Sprint 5-6: Atividades**
- Criação de atividades
- Submissões
- Histórico de tentativas

**Sprint 7-8: Gamificação Core**
- Sistema de pontos
- Níveis e progressão
- Conquistas (badges)

**Sprint 9-10: IA e Missões**
- Integração com IA para geração de conteúdo
- Sistema de missões
- Notificações

**Sprint 11-12: Dashboards e Refinamento**
- Dashboard do aluno
- Dashboard do professor
- Gráficos e relatórios
- Ajustes finais

#### Práticas de Desenvolvimento
- **Versionamento**: Git + GitHub
- **Branches**: feature branches + pull requests
- **Commits**: mensagens descritivas (Conventional Commits)
- **Code Review**: auto-revisão e checklist
- **Testes**: unitários e de integração
- **Documentação**: inline e README

#### Ferramentas
- VS Code como IDE
- GitHub para versionamento
- Docker para ambientes consistentes
- Postman para testes de API
- Jest/Vitest para testes

#### Entrega Contínua
- Sistema funcional a cada sprint
- Documentação atualizada
- Testes passando

---

### Fase 5: Testes e Validação (3 semanas)

#### Tipos de Teste

**Testes Técnicos**
- [ ] Testes unitários (>70% cobertura)
- [ ] Testes de integração
- [ ] Testes de API
- [ ] Testes de segurança (OWASP)
- [ ] Testes de performance

**Testes de Usabilidade**
- [ ] Navegabilidade
- [ ] Clareza de interface
- [ ] Fluxos intuitivos
- [ ] Acessibilidade (WCAG)

**Validação Pedagógica** (se possível)
- [ ] Teste piloto com professor
- [ ] Teste com grupo pequeno de alunos
- [ ] Coleta de feedback qualitativo

#### Métricas de Avaliação
- Tempo de resposta das APIs
- Taxa de erro
- Facilidade de uso (SUS - System Usability Scale)
- Feedback dos usuários

#### Ferramentas
- Jest/Vitest para testes
- Lighthouse para performance
- axe DevTools para acessibilidade

#### Entrega
- Relatório de testes
- Correção de bugs críticos
- Melhorias baseadas em feedback

---

### Fase 6: Documentação Final (2 semanas)

#### Documentação Técnica
- [ ] Documentação da API (Swagger)
- [ ] README do projeto
- [ ] Guia de instalação
- [ ] Guia de contribuição
- [ ] Documentação de código

#### Documentação Acadêmica
- [ ] Redação final do TCC
- [ ] Revisão de todos os capítulos
- [ ] Normalização ABNT
- [ ] Revisão ortográfica

#### Preparação da Apresentação
- [ ] Slides da defesa
- [ ] Demonstração do sistema
- [ ] Vídeo demo (opcional)

#### Entrega
- TCC completo
- Código-fonte versionado
- Apresentação pronta

---

## Cronograma Geral

| Fase | Duração | Período |
|------|---------|---------|
| 1. Revisão Bibliográfica | 4 semanas | Semanas 1-4 |
| 2. Análise de Requisitos | 3 semanas | Semanas 5-7 |
| 3. Design da Arquitetura | 2 semanas | Semanas 8-9 |
| 4. Desenvolvimento | 12 semanas | Semanas 10-21 |
| 5. Testes e Validação | 3 semanas | Semanas 22-24 |
| 6. Documentação Final | 2 semanas | Semanas 25-26 |

**Total: 26 semanas (~6 meses)**

---

## Ferramentas e Tecnologias

### Desenvolvimento
- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, TailwindCSS
- **Banco**: PostgreSQL
- **ORM**: Prisma
- **IA**: OpenAI API ou similar

### Infraestrutura
- **Container**: Docker, Docker Compose
- **Versionamento**: Git, GitHub
- **CI/CD**: GitHub Actions

### Documentação
- **Diagramas**: Draw.io, Excalidraw
- **Prototipação**: Figma
- **API Docs**: Swagger/OpenAPI
- **TCC**: LaTeX ou Word (ABNT)

### Gestão
- **Tarefas**: GitHub Projects ou Notion
- **Comunicação**: Slack/Discord (se em equipe)

---

## Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Escopo muito amplo | Alto | Média | Definir MVP claro, priorizar módulos core |
| Problemas técnicos | Médio | Média | Estudar tecnologias antes, ter alternativas |
| Falta de usuários para teste | Médio | Baixa | Contato prévio com professores |
| Atraso no cronograma | Alto | Média | Buffer de 2 semanas, entregas incrementais |
| Integração com IA complexa | Médio | Baixa | Usar APIs prontas, documentação clara |

---

## Critérios de Sucesso

### Técnicos
- ✅ Sistema funcional e estável
- ✅ Todos os módulos implementados
- ✅ Cobertura de testes >70%
- ✅ Documentação completa

### Acadêmicos
- ✅ TCC bem fundamentado teoricamente
- ✅ Justificativa clara do uso de IA
- ✅ Contribuição para área de pesquisa
- ✅ Apresentação clara e objetiva

### Impacto
- ✅ Sistema utilizável por professores reais
- ✅ Potencial de continuidade pós-TCC
- ✅ Código aberto para comunidade
