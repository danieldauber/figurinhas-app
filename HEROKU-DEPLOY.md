# Deploy no Heroku - Guia Rápido

## Pré-requisitos
- Conta no Heroku (gratuita)
- Heroku CLI instalado: https://devcenter.heroku.com/articles/heroku-cli

## Passos para Deploy

### 1. Login no Heroku
```bash
heroku login
```

### 2. Criar App no Heroku
```bash
heroku create nome-do-seu-app
```

### 3. Adicionar PostgreSQL (GRATUITO)
```bash
heroku addons:create heroku-postgresql:essential-0
```

O plano `essential-0` é gratuito e inclui:
- Até 10,000 linhas no banco
- 1 GB de armazenamento
- Suficiente para grupos pequenos/médios

### 4. Deploy
```bash
git push heroku main
```

### 5. Verificar
```bash
heroku open
```

## Variáveis de Ambiente

O Heroku configura automaticamente:
- `DATABASE_URL` - String de conexão do PostgreSQL
- `PORT` - Porta do servidor
- `NODE_ENV=production` - Ambiente de produção

## Comandos Úteis

Ver logs:
```bash
heroku logs --tail
```

Ver status do banco:
```bash
heroku pg:info
```

Abrir console do banco:
```bash
heroku pg:psql
```

Resetar banco (CUIDADO!):
```bash
heroku pg:reset DATABASE_URL --confirm nome-do-seu-app
```

## Custos

✅ **TUDO GRATUITO:**
- App básico: GRÁTIS
- PostgreSQL essential-0: GRÁTIS
- 1000 horas de dyno/mês: GRÁTIS

⚠️ **Limitações do plano gratuito:**
- App "dorme" após 30min de inatividade (volta automaticamente quando alguém acessa)
- Máximo 10,000 linhas no banco (muito espaço para figurinhas!)

## Atualizações

Para atualizar o app depois de fazer mudanças:

```bash
git add .
git commit -m "Descrição da mudança"
git push heroku main
```

## Troubleshooting

### Erro de build:
```bash
heroku logs --tail
```

### Testar localmente antes de fazer deploy:
```bash
# Instalar PostgreSQL localmente
# Mac: brew install postgresql
# Linux: apt-get install postgresql

# Criar banco local
createdb figurinhas_dev

# Configurar variável de ambiente
export DATABASE_URL="postgresql://localhost/figurinhas_dev"

# Rodar
npm run build
npm start
```

## Migração de Dados

Se você tem dados no localStorage e quer migrar:

1. Exporte os dados de cada usuário (botão Exportar)
2. Crie os usuários no novo sistema
3. Importe os dados via botão Importar

## Backup

Para fazer backup do banco:
```bash
heroku pg:backups:capture
heroku pg:backups:download
```
