# 1.2 Objetivos

## Objetivo Geral

Desenvolver uma plataforma web gamificada para apoio ao ensino de programação, integrando gestão de disciplinas, mecânicas de gamificação e uso controlado de Inteligência Artificial como ferramenta auxiliar ao professor, visando aumentar o engajamento e facilitar o acompanhamento do progresso dos alunos.

## Objetivos Específicos

### 1. Fundamentação Teórica
- Revisar literatura sobre gamificação no contexto educacional
- Estudar desafios no ensino de programação
- Investigar uso ético e controlado de IA na educação
- Analisar trabalhos relacionados e plataformas existentes

### 2. Análise e Design
- Levantar requisitos funcionais e não-funcionais do sistema
- Definir casos de uso para os perfis Professor, Aluno e Admin
- Projetar arquitetura escalável e modular
- Modelar banco de dados relacional

### 3. Implementação de Módulos Core

#### 3.1 Gestão Acadêmica
- Implementar sistema de autenticação e controle de acesso
- Desenvolver módulo de gestão de disciplinas e turmas
- Criar módulo de atividades e desafios com múltiplos tipos

#### 3.2 Gamificação
- Implementar sistema de pontos progressivos
- Desenvolver sistema de níveis e evolução
- Criar sistema de conquistas (badges)
- Implementar ranking com opção de anonimização

#### 3.3 Missões e Engajamento
- Desenvolver sistema de missões diárias e semanais
- Implementar rotina automática de missões
- Criar mecanismos de recompensa configuráveis

#### 3.4 IA Assistente
- Integrar IA para geração de questões de programação
- Implementar geração de quizzes teóricos
- Desenvolver sistema de sugestões de desafios
- **Garantir**: IA apenas sugere, professor valida e publica

### 4. Visualização e Análise
- Desenvolver dashboard do aluno com métricas de progresso
- Criar dashboard do professor com análise de turma
- Implementar gráficos interativos de evolução
- Desenvolver sistema de exportação de relatórios

### 5. Aspectos Técnicos
- Implementar API REST com documentação automática
- Desenvolver frontend responsivo com React
- Garantir segurança (JWT, criptografia, validações)
- Implementar sistema de notificações em tempo real
- Configurar ambiente Docker para deploy

### 6. Validação
- Realizar testes unitários e de integração
- Validar usabilidade da interface
- Avaliar desempenho e escalabilidade
- Documentar resultados e limitações

### 7. Considerações Éticas
- Garantir conformidade com LGPD
- Implementar recursos de acessibilidade (WCAG)
- Documentar uso ético da IA
- Considerar impacto social da plataforma

## Entregas Esperadas

### Entrega Técnica
- ✅ Sistema web funcional
- ✅ API REST documentada
- ✅ Banco de dados modelado
- ✅ Código versionado (Git)
- ✅ Documentação técnica

### Entrega Acadêmica
- ✅ Monografia completa (TCC)
- ✅ Fundamentação teórica
- ✅ Análise de requisitos
- ✅ Descrição da arquitetura
- ✅ Resultados e discussão
- ✅ Apresentação final

## Métricas de Sucesso

### Funcionais
- [ ] Todos os módulos implementados e funcionais
- [ ] Sistema permite criar disciplinas, turmas e atividades
- [ ] Gamificação completamente integrada
- [ ] IA gera sugestões validadas pelo professor

### Não-Funcionais
- [ ] Tempo de resposta < 2 segundos
- [ ] Interface responsiva em diferentes dispositivos
- [ ] Sistema suporta múltiplas turmas simultâneas
- [ ] Conformidade com LGPD e boas práticas de segurança

### Acadêmicos
- [ ] Fundamentação teórica consistente
- [ ] Justificativa clara do uso de IA
- [ ] Contribuição para área de Informática na Educação
- [ ] Trabalho futuro bem definido
