# 8.1 Uso Ético da IA

## Princípios Fundamentais

### 1. IA como Ferramenta, Não Substituta

**Princípio**: A Inteligência Artificial é uma ferramenta auxiliar ao professor, nunca uma substituta do julgamento humano em questões pedagógicas.

#### Por Quê?
- **Educação requer contexto humano**: IA não compreende nuances individuais
- **Responsabilidade profissional**: professor é o responsável pela avaliação
- **Confiança institucional**: alunos confiam no professor, não em algoritmos
- **Desenvolvimento crítico**: avaliação humana estimula pensamento crítico

#### Na Prática
✅ **Permitido**: IA gera sugestões de exercícios  
✅ **Permitido**: IA propõe tópicos de quiz  
✅ **Permitido**: IA sugere mensagens motivacionais  

❌ **Proibido**: IA avaliar código do aluno  
❌ **Proibido**: IA atribuir notas  
❌ **Proibido**: IA tomar decisões pedagógicas  
❌ **Proibido**: IA interagir com aluno sem supervisão  

---

### 2. Transparência Total

**Princípio**: Uso de IA deve ser transparente para todos os stakeholders.

#### Para os Alunos
- **Notificação clara**: "Este exercício foi gerado com auxílio de IA e revisado pelo professor"
- **Opção de visualizar**: Ver que conteúdo foi gerado por IA
- **Sem penalização**: Usar IA não afeta negativamente os alunos

#### Para a Instituição
- **Documentação completa**: Todo uso de IA é registrado
- **Auditoria**: Logs acessíveis para revisão
- **Políticas claras**: Diretrizes institucionais sobre uso de IA

#### No TCC
- **Seção dedicada**: Capítulo explicando uso de IA
- **Justificativa**: Por que IA é usada dessa forma
- **Limitações**: O que IA NÃO faz

---

### 3. Controle Humano (Human-in-the-Loop)

**Princípio**: Todo conteúdo gerado por IA passa por revisão humana antes de chegar aos alunos.

#### Fluxo Obrigatório

```
1. IA gera sugestão
   ↓
2. Professor revisa
   ↓
3. Professor edita (se necessário)
   ↓
4. Professor aprova explicitamente
   ↓
5. Conteúdo é publicado
```

**Sem atalhos**: Sistema NÃO permite publicação automática.

#### Interface Forçada
```typescript
// Código exemplo - não implementar
interface AISuggestion {
  content: string;
  status: 'pending_review' | 'approved' | 'rejected';
  reviewed_by: number; // professor ID
  reviewed_at?: Date;
}

// Regra: só publica se status === 'approved'
```

---

### 4. Qualidade sobre Quantidade

**Princípio**: IA não é usada para "produzir em massa", mas para qualificar o trabalho do professor.

#### Uso Correto
- ✅ Economizar tempo em tarefas repetitivas
- ✅ Gerar variações de exercícios
- ✅ Inspirar novas abordagens

#### Uso Incorreto
- ❌ Gerar centenas de exercícios não revisados
- ❌ Substituir planejamento pedagógico
- ❌ Criar conteúdo genérico sem contexto

#### Limites Técnicos
```yaml
rate_limits:
  per_professor_per_day: 50
  per_discipline_per_month: 200
  min_interval_between_requests: 10s
```

**Justificativa**: Forçar revisão cuidadosa, não uso massivo.

---

### 5. Não-Discriminação

**Princípio**: IA não deve perpetuar vieses ou discriminação.

#### Riscos de Viés

**Exemplos de problemas potenciais**:
- IA gera exemplos sempre com nomes masculinos
- IA usa contextos culturalmente específicos
- IA assume conhecimento prévio não universal

#### Mitigações

**No Prompt**:
```
Gere exercícios de programação.
Use nomes diversos (várias culturas e gêneros).
Use contextos neutros e universais.
Evite assumir conhecimento cultural específico.
```

**Na Revisão**:
- Professor verifica representatividade
- Ajusta exemplos se necessário
- Rejeita conteúdo problemático

**Monitoramento**:
- Analisar padrões em conteúdo aprovado
- Feedback loop para melhorar prompts
- Treinamento de professores sobre vieses

---

### 6. Privacidade de Dados

**Princípio**: Dados dos alunos NÃO são compartilhados com APIs externas de IA.

#### O Que NÃO Enviamos
- ❌ Código-fonte dos alunos
- ❌ Notas individuais
- ❌ Dados pessoais (nome, email, etc.)
- ❌ Histórico de submissões

#### O Que Podemos Enviar
- ✅ Contexto pedagógico genérico
  - Ex: "Gere exercício sobre loops em Python"
- ✅ Parâmetros anônimos
  - Ex: "Turma de nível iniciante"

#### Implementação

**Antes de chamar IA**:
```typescript
function sanitizeForAI(input: any) {
  // Remove qualquer dado pessoal
  // Verifica se não há informação de aluno
  // Retorna apenas contexto pedagógico
}
```

**Auditoria**:
- Log de tudo enviado para IA
- Revisão periódica para vazamentos
- Compliance com LGPD

---

### 7. Falibilidade da IA

**Princípio**: IA pode cometer erros. Sistema é projetado assumindo isso.

#### Tipos de Erro

**Erro Técnico**:
- Código gerado não compila
- Casos de teste incorretos
- Sintaxe errada

**Erro Pedagógico**:
- Exercício muito fácil/difícil
- Conceito explicado incorretamente
- Progressão de dificuldade ruim

**Erro de Conteúdo**:
- "Alucinações" (inventa fatos)
- Informação desatualizada
- Best practices obsoletas

#### Como Lidamos

**Prevenção**:
- Prompts bem desenhados
- Validação de formato
- Múltiplas tentativas se necessário

**Detecção**:
- Professor revisa TUDO
- Sistema valida sintaxe (quando possível)
- Feedback de alunos sobre qualidade

**Correção**:
- Professor edita antes de publicar
- Sistema aprende com rejeições (futuro)
- Melhorias contínuas nos prompts

---

## Diretrizes de Implementação

### Para Desenvolvedores

```typescript
/**
 * REGRAS DE OURO - IA
 * 
 * 1. NUNCA publique conteúdo de IA sem aprovação de professor
 * 2. SEMPRE registre uso de IA em logs de auditoria
 * 3. NUNCA envie dados de alunos para APIs externas
 * 4. SEMPRE permita edição antes de aprovação
 * 5. NUNCA use IA para avaliar ou dar nota
 */
```

### Para Professores

**Checklist Antes de Aprovar Conteúdo de IA**:
- [ ] Conteúdo está correto tecnicamente?
- [ ] Nível de dificuldade é apropriado?
- [ ] Linguagem é clara e inclusiva?
- [ ] Exemplos são culturalmente neutros?
- [ ] Não há vieses problemáticos?
- [ ] Alinha com objetivos da disciplina?

---

## Comparação com Outras Abordagens

### ❌ Abordagem Problemática

**Sistema A**: "IA corrige código do aluno automaticamente"
- ✗ Sem supervisão humana
- ✗ Aluno não sabe que é IA
- ✗ IA toma decisão final sobre nota

### ✅ Nossa Abordagem

**Este Sistema**: "IA gera exercícios, professor valida e publica"
- ✓ Professor sempre no controle
- ✓ Transparência total
- ✓ IA não avalia alunos

---

## Justificativa Acadêmica

### Por Que Este Uso de IA é Válido?

#### 1. Fundamentação Teórica
- **Human-in-the-Loop AI**: abordagem reconhecida
- **Augmented Intelligence**: IA aumenta capacidades humanas
- **Responsible AI**: seguimos princípios de IA responsável

#### 2. Precedentes
- **GitHub Copilot**: assiste programadores, não substitui
- **Grammarly**: sugere, usuário decide
- **Duolingo**: usa IA para gerar exercícios (com revisão)

#### 3. Contribuição Original
- Framework ético para uso de IA em educação
- Implementação prática de transparência
- Equilíbrio entre automação e controle humano

---

## Referências Éticas

### Frameworks Seguidos

**UNESCO - Recommendation on AI Ethics (2021)**
- Transparência
- Supervisão humana
- Não-discriminação
- Privacidade

**IEEE - Ethically Aligned Design**
- Human rights
- Well-being
- Accountability

**ACM Code of Ethics**
- Honestidade sobre capacidades de IA
- Transparência de uso
- Proteção de privacidade

---

## Checklist de Conformidade Ética

### Para o TCC

- [ ] Capítulo dedicado a uso ético de IA
- [ ] Justificativa clara de cada uso
- [ ] Documentação de limitações
- [ ] Comparação com abordagens problemáticas
- [ ] Referências a frameworks éticos

### Para a Implementação

- [ ] Fluxo de aprovação implementado
- [ ] Logs de auditoria funcionando
- [ ] Sanitização de dados antes de IA
- [ ] Notificações de uso de IA para alunos
- [ ] Limites de uso configurados

### Para Uso Contínuo

- [ ] Treinamento de professores sobre IA
- [ ] Revisão periódica de vieses
- [ ] Feedback de alunos sobre qualidade
- [ ] Atualização de prompts baseada em uso
- [ ] Monitoramento de taxa de aprovação

---

## Conclusão

O uso de IA neste projeto é:

1. **Ético**: Professor sempre no controle
2. **Transparente**: Todos sabem quando IA é usada
3. **Limitado**: IA não avalia nem substitui professor
4. **Justificado**: Seguimos frameworks reconhecidos
5. **Auditável**: Tudo é registrado e revisável

Esta abordagem não apenas protege o projeto academicamente, mas também contribui para discussão de uso responsável de IA na educação.

---

## Para Discussão no TCC

### Pergunta Provável da Banca

**"Por que usar IA se o professor precisa revisar tudo mesmo?"**

**Resposta**:
- Economiza tempo em tarefas repetitivas (gerar variações de exercícios)
- Permite que professor foque em feedback de qualidade
- Aumenta variedade de conteúdo disponível
- IA é rápida, professor adiciona contexto e validação
- Analogia: Professor usa livros didáticos mas não escreve todos do zero

**"Como garantir que IA não tenha vieses?"**

**Resposta**:
- Professor revisa e pode editar/rejeitar
- Prompts são desenhados para evitar vieses
- Monitoramento contínuo de padrões
- Sistema de feedback e melhoria
- Nenhum sistema é perfeito, mas temos controles

**"IA não desumaniza a educação?"**

**Resposta**:
- IA não interage com alunos diretamente
- IA não avalia nem dá feedback (professor faz isso)
- IA é ferramenta do professor, como PowerPoint ou livro
- Pode até aumentar humanização: professor tem mais tempo para feedback personalizado
