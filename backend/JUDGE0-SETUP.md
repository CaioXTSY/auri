# 🚀 Judge0 - Executar Código Localmente

## Como Iniciar o Judge0

Execute o docker-compose na pasta backend:

```bash
cd backend
docker-compose -f docker-compose.judge0.yml up -d
```

Isso irá subir 3 containers:
- **judge0-server**: API de execução (porta 2358)
- **judge0-db**: PostgreSQL para Judge0
- **judge0-redis**: Redis para fila de execução

## Verificar Status

```bash
# Ver logs
docker-compose -f docker-compose.judge0.yml logs -f

# Verificar se está rodando
docker-compose -f docker-compose.judge0.yml ps

# Testar a API
curl http://localhost:2358/about
```

## Parar o Judge0

```bash
docker-compose -f docker-compose.judge0.yml down
```

## Limpar Dados (Cuidado!)

```bash
docker-compose -f docker-compose.judge0.yml down -v
```

## Linguagens Suportadas

O Judge0 suporta várias linguagens. As configuradas no sistema:

| Linguagem | ID Judge0 | Versão |
|-----------|-----------|--------|
| JavaScript | 63 | Node.js 12.14.0 |
| Python | 71 | Python 3.8.1 |
| Java | 62 | OpenJDK 13.0.1 |
| C | 50 | GCC 9.2.0 |
| C++ | 54 | GCC 9.2.0 |
| TypeScript | 74 | TypeScript 3.7.4 |

## Testar Execução Manual

```bash
# Criar submissão
curl -X POST http://localhost:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "console.log(\"Hello World\")",
    "language_id": 63,
    "stdin": ""
  }'

# Pegar resultado (substitua TOKEN pelo token retornado)
curl http://localhost:2358/submissions/TOKEN
```

## Troubleshooting

### Judge0 não inicia
- Certifique-se que Docker está rodando
- Verifique se as portas 2358, 5432, 6379 estão livres

### Timeout ao executar
- Aumente `JUDGE0_MAX_WAIT_TIME` no .env
- Verifique logs: `docker-compose -f docker-compose.judge0.yml logs judge0-server`

### Erro "privileged mode"
- O Judge0 precisa rodar em modo privilegiado para isolar execuções
- Se estiver usando Docker Desktop no Windows, certifique-se que WSL2 está habilitado
