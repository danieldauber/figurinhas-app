# Migração localStorage → PostgreSQL

## ✅ O que foi feito

### Backend (server.js)
- ✅ Adicionado suporte a PostgreSQL com o pacote `pg`
- ✅ Criação automática das tabelas ao iniciar o servidor
- ✅ API REST completa para gerenciar grupos, usuários e figurinhas
- ✅ Endpoints implementados:
  - `POST /api/groups` - Criar grupo
  - `GET /api/groups/:id` - Buscar grupo
  - `GET /api/groups/:groupId/users` - Listar usuários do grupo
  - `POST /api/groups/:groupId/users` - Criar usuário
  - `POST /api/groups/:groupId/users/:userName/verify` - Verificar senha
  - `POST /api/groups/:groupId/users/:userName/stickers` - Adicionar figurinha
  - `DELETE /api/groups/:groupId/users/:userName/stickers/:code/:type` - Remover figurinha
  - `DELETE /api/groups/:groupId/users/:userName/stickers` - Limpar todas figurinhas
  - `DELETE /api/groups/:groupId/users/:userName` - Deletar usuário (admin)

### Frontend (App.jsx)
- ✅ Criado módulo `api.js` para comunicação com o backend
- ✅ Removido todo código de localStorage
- ✅ Todas operações agora usam API REST
- ✅ Adicionado estado de loading
- ✅ Tratamento de erros melhorado
- ✅ Interface permanece exatamente igual para o usuário

### Database Schema (db-schema.sql)
- ✅ Tabela `groups` - Armazena informações dos grupos
- ✅ Tabela `users` - Armazena usuários por grupo
- ✅ Tabela `stickers` - Armazena figurinhas (faltantes e repetidas)
- ✅ Índices para performance
- ✅ Constraints para integridade dos dados

## 🎯 Como funciona agora

### Antes (localStorage):
```
Usuário A (navegador) → localStorage A
Usuário B (navegador) → localStorage B
❌ Dados isolados, não compartilhados
```

### Depois (PostgreSQL):
```
Usuário A (navegador) → API → PostgreSQL
Usuário B (navegador) → API → PostgreSQL
✅ Dados compartilhados em tempo real
```

## 🚀 Para testar localmente

### Opção 1: Sem banco (vai dar erro, mas pode ver o código)
```bash
npm run build
npm start
```

### Opção 2: Com PostgreSQL local
```bash
# Mac
brew install postgresql
brew services start postgresql
createdb figurinhas_dev

# Linux
sudo apt-get install postgresql
sudo service postgresql start
sudo -u postgres createdb figurinhas_dev

# Configurar variável
export DATABASE_URL="postgresql://localhost/figurinhas_dev"

# Rodar
npm run build
npm start
```

## 📦 Deploy no Heroku

Ver arquivo `HEROKU-DEPLOY.md` para instruções completas.

Resumo:
```bash
heroku create seu-app
heroku addons:create heroku-postgresql:essential-0
git push heroku main
heroku open
```

## 💰 Custos

**TUDO GRATUITO:**
- Heroku app: GRÁTIS
- PostgreSQL essential-0: GRÁTIS (até 10k linhas)
- Suficiente para centenas de usuários

## 🔄 Migração de dados antigos

Se você tem dados no localStorage:

1. **Exportar** dados antigos (botão Exportar em cada usuário)
2. **Fazer deploy** da nova versão
3. **Criar usuários** novamente no novo sistema
4. **Importar** dados via botão Importar

## ⚠️ Notas importantes

1. **Senhas**: Ainda são armazenadas em texto plano. Para produção seria ideal usar bcrypt.
2. **Sincronização**: Não é em tempo real. É preciso recarregar a página para ver mudanças de outros usuários.
3. **Performance**: Com os índices criados, suporta facilmente milhares de figurinhas.

## 🐛 Troubleshooting

### "Error: Failed to create group"
- Verifique se o PostgreSQL está rodando
- Verifique a variável `DATABASE_URL`

### "Failed to fetch users"
- Banco pode não estar inicializado
- Veja os logs: `heroku logs --tail` (no Heroku) ou console local

### Link de grupo não funciona
- Verifique se o hash está correto na URL
- Grupo pode ter sido deletado

## 📊 Estrutura do Banco

### groups
- id (PK) - Hash do grupo
- name - Nome do grupo
- created_at - Data de criação

### users
- id (PK) - ID auto-incremento
- group_id (FK) - Referência ao grupo
- name - Nome do usuário
- password - Senha (texto plano)
- created_at - Data de criação
- UNIQUE(group_id, name)

### stickers
- id (PK) - ID auto-incremento
- user_id (FK) - Referência ao usuário
- sticker_code - Código da figurinha (ex: BRA-5)
- type - 'faltante' ou 'repetida'
- created_at - Data de criação
- UNIQUE(user_id, sticker_code, type)
