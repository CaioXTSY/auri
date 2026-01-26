# 📚 Módulo de Turmas (Classes)

## Visão Geral

O módulo de Turmas gerencia o sistema de turmas e matrículas da plataforma. **Turmas são uma feature opcional** - usuários podem usar a plataforma normalmente para resolver questões sem estar matriculados em nenhuma turma.

Turmas servem para:
- Organizar alunos em ambientes educacionais estruturados
- Professores acompanharem progresso de grupos específicos
- Facilitar gamificação e rankings por turma
- Criar ambiente colaborativo de aprendizado

## Arquitetura

### Estrutura de Arquivos

```
src/modules/classes/
├── dto/
│   ├── create-class.dto.ts           # DTO para criar turma
│   ├── update-class.dto.ts           # DTO para atualizar turma
│   ├── enroll-student.dto.ts         # DTO para matrícula
│   ├── query-classes.dto.ts          # DTO para filtros e paginação
│   └── paginated-classes.dto.ts      # DTO para resposta paginada
├── classes.controller.ts             # Controller com endpoints
├── classes.service.ts                # Service com lógica de negócio
├── classes.module.ts                 # Module definition
└── classes.service.spec.ts           # Testes unitários (21 testes)
```

### Modelo de Dados

```prisma
model Class {
  id           String   @id @default(uuid())
  disciplineId String
  name         String   @db.VarChar(200)
  semester     String   @db.VarChar(50)
  year         Int
  status       String   @default("ATIVA") @db.VarChar(20)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  discipline   Discipline     @relation(fields: [disciplineId], references: [id], onDelete: Cascade)
  students     ClassStudent[]
  activities   Activity[]
}

model ClassStudent {
  classId    String
  userId     String
  enrolledAt DateTime @default(now())

  class      Class @relation(fields: [classId], references: [id], onDelete: Cascade)
  user       User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([classId, userId])
}
```

## Endpoints

### 1. Criar Turma
**POST** `/api/v1/classes`

**Permissões:** ADMIN ou PROFESSOR

**Body:**
```json
{
  "disciplineId": "uuid",
  "name": "Turma A - Manhã",
  "semester": "2024.1",
  "year": 2024
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "disciplineId": "uuid",
  "name": "Turma A - Manhã",
  "semester": "2024.1",
  "year": 2024,
  "status": "ATIVA",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. Listar Turmas
**GET** `/api/v1/classes`

**Permissões:** Autenticado

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `disciplineId` (uuid, opcional)
- `name` (string, opcional)
- `semester` (string, opcional)
- `year` (number, opcional)
- `status` (ATIVA | ENCERRADA, opcional)
- `sortBy` (string, default: "createdAt")
- `sortOrder` (asc | desc, default: "desc")

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "disciplineId": "uuid",
      "name": "Turma A - Manhã",
      "semester": "2024.1",
      "year": 2024,
      "status": "ATIVA",
      "discipline": {
        "id": "uuid",
        "name": "Lógica de Programação"
      },
      "_count": {
        "students": 25,
        "activities": 12
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### 3. Minhas Turmas (Aluno)
**GET** `/api/v1/classes/my-classes`

**Permissões:** ALUNO

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Turma A - Manhã",
    "semester": "2024.1",
    "year": 2024,
    "discipline": {
      "id": "uuid",
      "name": "Lógica de Programação"
    },
    "enrolledAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 4. Buscar Turma por ID
**GET** `/api/v1/classes/:id`

**Permissões:** Autenticado

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "disciplineId": "uuid",
  "name": "Turma A - Manhã",
  "semester": "2024.1",
  "year": 2024,
  "status": "ATIVA",
  "discipline": {
    "id": "uuid",
    "name": "Lógica de Programação",
    "language": "javascript"
  },
  "students": [
    {
      "userId": "uuid",
      "enrolledAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@example.com"
      }
    }
  ],
  "_count": {
    "students": 25,
    "activities": 12
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 5. Listar Alunos da Turma
**GET** `/api/v1/classes/:id/students`

**Permissões:** Autenticado

**Response:** `200 OK`
```json
[
  {
    "userId": "uuid",
    "enrolledAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@example.com",
      "role": "ALUNO"
    }
  }
]
```

---

### 6. Matricular Aluno
**POST** `/api/v1/classes/:id/enroll`

**Permissões:** ADMIN ou PROFESSOR

**Body:**
```json
{
  "userId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "classId": "uuid",
  "userId": "uuid",
  "enrolledAt": "2024-01-01T00:00:00.000Z"
}
```

**Regras de Negócio:**
- ✅ Turma deve existir
- ✅ Turma deve estar ATIVA (não pode matricular em turmas encerradas)
- ✅ Usuário deve existir
- ✅ Usuário deve ter role ALUNO
- ✅ Não permite matrícula duplicada

---

### 7. Remover Aluno da Turma
**DELETE** `/api/v1/classes/:id/students/:userId`

**Permissões:** ADMIN ou PROFESSOR

**Response:** `200 OK`
```json
{
  "message": "Student successfully unenrolled"
}
```

---

### 8. Atualizar Turma
**PATCH** `/api/v1/classes/:id`

**Permissões:** ADMIN ou PROFESSOR

**Body:** (todos opcionais)
```json
{
  "name": "Turma A - Tarde",
  "semester": "2024.2",
  "year": 2024,
  "status": "ENCERRADA"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Turma A - Tarde",
  "semester": "2024.2",
  "year": 2024,
  "status": "ENCERRADA",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 9. Remover Turma
**DELETE** `/api/v1/classes/:id`

**Permissões:** ADMIN

**Response:** `200 OK`
```json
{
  "message": "Class successfully deleted"
}
```

**Regras de Negócio:**
- ❌ Não permite remover se houver atividades cadastradas

---

## Regras de Negócio

### Criação de Turma
1. ✅ Disciplina deve existir
2. ✅ Nome obrigatório (máx 200 caracteres)
3. ✅ Semestre obrigatório
4. ✅ Ano entre 2020 e 2100
5. ✅ Status padrão: "ATIVA"

### Matrícula de Alunos
1. ✅ Turma deve existir
2. ✅ Turma deve estar ATIVA
3. ✅ Usuário deve existir
4. ✅ Usuário deve ter role ALUNO
5. ✅ Não permite matrícula duplicada (retorna 409 Conflict)

### Remoção de Turma
1. ✅ Não permite remover turma com atividades cadastradas
2. ✅ Apenas ADMIN pode remover turmas

### Status da Turma
- **ATIVA**: Permite matrículas, alunos podem acessar
- **ENCERRADA**: Não permite novas matrículas, dados preservados para histórico

---

## Sistema de Permissões

| Ação | ADMIN | PROFESSOR | ALUNO |
|------|-------|-----------|-------|
| Criar turma | ✅ | ✅ | ❌ |
| Listar turmas | ✅ | ✅ | ✅ |
| Ver detalhes | ✅ | ✅ | ✅ |
| Listar alunos | ✅ | ✅ | ✅ |
| Minhas turmas | ❌ | ❌ | ✅ |
| Matricular aluno | ✅ | ✅ | ❌ |
| Remover aluno | ✅ | ✅ | ❌ |
| Atualizar turma | ✅ | ✅ | ❌ |
| Remover turma | ✅ | ❌ | ❌ |

---

## Filtros e Ordenação

### Filtros Disponíveis
- **disciplineId**: Filtrar por disciplina específica
- **name**: Busca parcial no nome da turma
- **semester**: Filtro exato por semestre
- **year**: Filtro exato por ano
- **status**: Filtrar por status (ATIVA/ENCERRADA)

### Ordenação
- **sortBy**: Campo para ordenar (default: "createdAt")
  - Opções: createdAt, name, semester, year
- **sortOrder**: Ordem (default: "desc")
  - Opções: asc, desc

### Paginação
- **page**: Página atual (default: 1)
- **limit**: Itens por página (default: 10, máx: 100)

---

## Exemplos de Uso

### Criar turma e matricular alunos

```bash
# 1. Criar turma
curl -X POST http://localhost:3001/api/v1/classes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disciplineId": "uuid-disciplina",
    "name": "Turma A - Manhã",
    "semester": "2024.1",
    "year": 2024
  }'

# 2. Matricular aluno
curl -X POST http://localhost:3001/api/v1/classes/{classId}/enroll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid-aluno"
  }'

# 3. Listar alunos da turma
curl http://localhost:3001/api/v1/classes/{classId}/students \
  -H "Authorization: Bearer $TOKEN"
```

### Aluno consultar suas turmas

```bash
curl http://localhost:3001/api/v1/classes/my-classes \
  -H "Authorization: Bearer $TOKEN_ALUNO"
```

### Listar turmas com filtros

```bash
# Turmas ativas de uma disciplina
curl "http://localhost:3001/api/v1/classes?disciplineId=uuid&status=ATIVA" \
  -H "Authorization: Bearer $TOKEN"

# Turmas do semestre 2024.1
curl "http://localhost:3001/api/v1/classes?semester=2024.1&year=2024" \
  -H "Authorization: Bearer $TOKEN"
```

### Encerrar turma

```bash
curl -X PATCH http://localhost:3001/api/v1/classes/{classId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ENCERRADA"
  }'
```

---

## Testes

### Cobertura de Testes Unitários (21 testes)

#### create (2 testes)
- ✅ Criar turma com sucesso
- ✅ Lançar NotFoundException se disciplina não existe

#### findAll (4 testes)
- ✅ Retornar turmas paginadas
- ✅ Filtrar por disciplineId
- ✅ Filtrar por name
- ✅ Filtrar por status

#### findOne (2 testes)
- ✅ Retornar turma por ID
- ✅ Lançar NotFoundException se não encontrar

#### update (2 testes)
- ✅ Atualizar turma com sucesso
- ✅ Validar disciplina se disciplineId for alterado

#### remove (2 testes)
- ✅ Remover turma com sucesso
- ✅ Bloquear remoção se houver atividades

#### enrollStudent (6 testes)
- ✅ Matricular aluno com sucesso
- ✅ Lançar NotFoundException se turma não existe
- ✅ Lançar BadRequestException se turma não está ativa
- ✅ Lançar NotFoundException se usuário não existe
- ✅ Lançar BadRequestException se usuário não é ALUNO
- ✅ Lançar ConflictException se aluno já está matriculado

#### unenrollStudent (2 testes)
- ✅ Remover matrícula com sucesso
- ✅ Lançar NotFoundException se matrícula não existe

#### getMyClasses (1 teste)
- ✅ Retornar turmas do aluno

### Executar Testes

```bash
# Testes unitários
npm test -- classes.service.spec

# Com cobertura
npm test -- --coverage classes.service.spec

# Watch mode
npm test -- --watch classes.service.spec
```

---

## Tratamento de Erros

| Status | Situação | Mensagem |
|--------|----------|----------|
| 400 | Turma não está ativa | "Class must be active to enroll students" |
| 400 | Usuário não é aluno | "User must be a student" |
| 400 | Turma tem atividades | "Cannot delete class with activities" |
| 404 | Turma não encontrada | "Class not found" |
| 404 | Disciplina não encontrada | "Discipline not found" |
| 404 | Usuário não encontrado | "User not found" |
| 404 | Matrícula não encontrada | "Enrollment not found" |
| 409 | Matrícula duplicada | "Student already enrolled in this class" |

---

## Integração com Outros Módulos

### Disciplines Module
- Turma pertence a uma Disciplina
- Valida existência da disciplina ao criar/atualizar
- Cascade delete: remover disciplina remove suas turmas

### Users Module
- Valida role do usuário (apenas ALUNO pode ser matriculado)
- Retorna dados do usuário nas listagens

### Activities Module (futuro)
- Turma pode ter atividades específicas
- Proteção: não remove turma com atividades cadastradas

### Submissions Module (futuro)
- Alunos da turma podem submeter soluções para atividades

---

## Considerações Importantes

### Uso Opcional de Turmas
- **Turmas são opcionais**: Usuários podem usar a plataforma sem estar em turmas
- Turmas são para ambientes educacionais estruturados
- Atividades podem ser resolvidas independentemente de turmas

### Performance
- Índices nos campos: disciplineId, status, name
- Paginação para listagens grandes
- Select otimizado (apenas campos necessários)

### Segurança
- Validação de permissões em todos os endpoints
- Proteção contra matrícula duplicada
- Validação de role (apenas ALUNO pode ser matriculado)

### Auditoria
- Campos createdAt e updatedAt automáticos
- Campo enrolledAt registra data da matrícula
- Status preserva histórico (ENCERRADA vs remover)

---

## Melhorias Futuras

- [ ] Autoenrolment (aluno se matricular)
- [ ] Limite de alunos por turma
- [ ] Professor responsável pela turma
- [ ] Convites por código/link
- [ ] Relatórios de progresso da turma
- [ ] Exportação de dados da turma
- [ ] Clonar turma para novo semestre
- [ ] Arquivamento de turmas antigas
- [ ] Notificações de novos alunos

---

## Documentação Swagger

Acesse a documentação interativa em: `http://localhost:3001/api/v1/docs`

Tags disponíveis:
- **Classes**: Todos os endpoints do módulo
