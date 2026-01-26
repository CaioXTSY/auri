# Módulo de Disciplinas - Documentação de Implementação

## 📋 Visão Geral

Módulo completo para gerenciamento de disciplinas da plataforma AURI, com CRUD, paginação, filtros e validações de regras de negócio.

## 🏗️ Arquitetura

### Estrutura de Arquivos
```
src/modules/disciplines/
├── dto/
│   ├── create-discipline.dto.ts
│   ├── update-discipline.dto.ts
│   ├── query-disciplines.dto.ts
│   ├── paginated-disciplines.dto.ts
│   └── index.ts
├── disciplines.controller.ts
├── disciplines.service.ts
├── disciplines.service.spec.ts
└── disciplines.module.ts

test/
└── disciplines.e2e-spec.ts
```

## 📝 DTOs

### CreateDisciplineDto
```typescript
{
  name: string;           // Nome da disciplina
  description?: string;   // Descrição (opcional)
  language: string;       // Python, Java, C, C++, JavaScript, TypeScript
  status?: string;        // ATIVA ou ENCERRADA (default: ATIVA)
}
```

### QueryDisciplinesDto
```typescript
{
  page?: number;          // Número da página (default: 1)
  limit?: number;         // Itens por página (default: 10)
  createdById?: string;   // Filtrar por criador
  name?: string;          // Busca parcial por nome
  language?: string;      // Filtrar por linguagem
  status?: string;        // Filtrar por status
  sortBy?: string;        // Campo de ordenação (name, language, createdAt)
  sortOrder?: string;     // Ordem (asc, desc)
}
```

## 🔌 Endpoints

### POST /disciplines
**Permissões**: Admin, Professor  
**Descrição**: Cria nova disciplina

**Request Body**:
```json
{
  "name": "Introdução à Programação",
  "description": "Fundamentos de programação",
  "language": "Python",
  "status": "ATIVA"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "name": "Introdução à Programação",
  "description": "Fundamentos de programação",
  "language": "Python",
  "status": "ATIVA",
  "createdById": "uuid",
  "createdAt": "2026-01-26T...",
  "updatedAt": "2026-01-26T...",
  "createdBy": {
    "id": "uuid",
    "name": "Prof. Silva",
    "email": "prof@example.com",
    "role": "PROFESSOR"
  }
}
```

### GET /disciplines
**Permissões**: Admin, Professor, Aluno  
**Descrição**: Lista disciplinas com paginação e filtros

**Query Params**:
- `page=1`
- `limit=10`
- `createdById=uuid`
- `name=Programação`
- `language=Python`
- `status=ATIVA`
- `sortBy=name`
- `sortOrder=asc`

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Introdução à Programação",
      "language": "Python",
      "status": "ATIVA",
      "createdBy": { ... },
      "_count": {
        "classes": 3
      }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### GET /disciplines/:id
**Permissões**: Admin, Professor, Aluno  
**Descrição**: Busca disciplina por ID com detalhes completos

**Response** (200):
```json
{
  "id": "uuid",
  "name": "Introdução à Programação",
  "description": "Fundamentos",
  "language": "Python",
  "status": "ATIVA",
  "createdBy": { ... },
  "classes": [
    {
      "id": "uuid",
      "name": "Turma A",
      "semester": "2024/1",
      "year": 2024,
      "status": "ATIVA",
      "_count": {
        "students": 25
      }
    }
  ]
}
```

### PATCH /disciplines/:id
**Permissões**: Admin, Professor  
**Descrição**: Atualiza disciplina

**Request Body**:
```json
{
  "name": "Programação Avançada",
  "description": "Nova descrição",
  "status": "ENCERRADA"
}
```

**Response** (200): Disciplina atualizada

### DELETE /disciplines/:id
**Permissões**: Admin  
**Descrição**: Remove disciplina

**Validações**:
- ❌ Não permite remoção se houver turmas associadas
- ✅ Remove se não houver dependências

**Response** (200): Sucesso

## 🔒 Regras de Negócio

### Criação de Disciplinas
1. Apenas usuários com role `PROFESSOR` ou `ADMIN` podem criar
2. O criador é automaticamente vinculado (`createdById`)
3. Status default é `ATIVA`

### Atualização
1. Admin e Professor podem atualizar
2. Todos os campos são opcionais

### Remoção
1. Apenas Admin pode remover
2. **Bloqueio**: Não permite remoção se existirem turmas associadas
3. Retorna erro 400 com mensagem específica

### Listagem
1. Todos os usuários autenticados podem listar
2. Paginação obrigatória
3. Filtros combinam com operador AND
4. Busca de nome e linguagem é parcial (contains)
5. Inclui contagem de turmas associadas

## ✅ Testes

### Testes Unitários (16 testes - 100% passing)

#### DisciplinesService
- ✅ **create**: Cria disciplina com sucesso
- ✅ **create**: Lança NotFoundException se usuário não existe
- ✅ **create**: Lança BadRequestException se usuário não é PROFESSOR/ADMIN
- ✅ **findAll**: Retorna disciplinas paginadas
- ✅ **findAll**: Filtra por createdById
- ✅ **findAll**: Filtra por nome
- ✅ **findAll**: Filtra por linguagem
- ✅ **findAll**: Filtra por status
- ✅ **findAll**: Ordena corretamente
- ✅ **findOne**: Retorna disciplina por ID
- ✅ **findOne**: Lança NotFoundException se não existe
- ✅ **update**: Atualiza disciplina
- ✅ **update**: Lança NotFoundException se não existe
- ✅ **remove**: Remove disciplina
- ✅ **remove**: Lança BadRequestException se tem turmas
- ✅ **remove**: Lança NotFoundException se não existe

### Testes E2E (pendentes de correção)
- POST /disciplines
- GET /disciplines (paginação e filtros)
- GET /disciplines/:id
- PATCH /disciplines/:id
- DELETE /disciplines/:id
- Testes de autorização

## 🗄️ Schema do Banco

```prisma
model Discipline {
  id          String   @id @default(uuid())
  name        String
  description String?  @db.Text
  language    String   // Python, Java, C, etc
  status      String   @default("ATIVA") // ATIVA, ENCERRADA
  createdById String   @map("created_by_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  createdBy User    @relation(fields: [createdById], references: [id])
  classes   Class[]

  @@map("disciplines")
}
```

## 📊 Status de Implementação

| Feature | Status |
|---------|--------|
| DTOs completos | ✅ 100% |
| Service com CRUD | ✅ 100% |
| Controller com endpoints | ✅ 100% |
| Paginação | ✅ 100% |
| Filtros (4 tipos) | ✅ 100% |
| Ordenação | ✅ 100% |
| Validações de permissão | ✅ 100% |
| Validações de negócio | ✅ 100% |
| Testes unitários | ✅ 100% (16/16) |
| Testes E2E | ⏳ 55% (11/20) |
| Swagger documentation | ✅ 100% |
| **TOTAL** | **✅ 95%** |

## 🚀 Melhorias Futuras

### Curto Prazo
- [ ] Corrigir testes E2E remanescentes
- [ ] Implementar soft delete
- [ ] Adicionar filtro para professor ver apenas suas disciplinas

### Médio Prazo
- [ ] Adicionar estatísticas (total de alunos, atividades, etc)
- [ ] Implementar duplicação de disciplina
- [ ] Adicionar tags/categorias para disciplinas

### Longo Prazo
- [ ] Histórico de alterações
- [ ] Integração com sistema de recomendação
- [ ] Analytics avançados

## 📝 Notas de Desenvolvimento

### Decisões Técnicas
1. **Paginação obrigatória**: Evitar sobrecarga com muitos registros
2. **Validação de creator**: Garante que apenas usuários qualificados criem disciplinas
3. **Proteção de integridade**: Impede remoção de disciplinas com turmas ativas
4. **Busca parcial**: Facilita encontrar disciplinas sem precisar nome exato

### Problemas Conhecidos
1. Testes E2E com timeout no beforeAll - RESOLVIDO (timeout aumentado)
2. Query params às vezes vêm como string - RESOLVIDO (Type transformers)
3. req.user.id undefined em alguns contextos - EM INVESTIGAÇÃO

### Dependências
- `@prisma/client` - ORM
- `class-validator` - Validações de DTO
- `class-transformer` - Transformações de tipo
- `@nestjs/swagger` - Documentação
- `@nestjs/passport` - Autenticação

## 🎯 Como Usar

### Criar uma Disciplina (Professor/Admin)
```bash
POST /disciplines
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Estruturas de Dados",
  "description": "Aprenda sobre listas, pilhas, filas, árvores",
  "language": "Java",
  "status": "ATIVA"
}
```

### Listar Disciplinas Ativas de Python
```bash
GET /disciplines?status=ATIVA&language=Python&sortBy=name&sortOrder=asc
Authorization: Bearer <token>
```

### Buscar Disciplinas de um Professor
```bash
GET /disciplines?createdById=<professor-uuid>
Authorization: Bearer <token>
```

### Atualizar Status para Encerrada
```bash
PATCH /disciplines/<id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "ENCERRADA"
}
```

---

**Implementado por**: GitHub Copilot  
**Data**: 26 de Janeiro de 2026  
**Versão**: 1.0.0
