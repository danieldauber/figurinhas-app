# 🎴 App de Troca de Figurinhas

App web para compartilhar figurinhas repetidas e faltantes com os colegas de trabalho, com match automático e sistema de trocas.

## ✨ Features

- ✅ Adicionar múltiplos usuários
- ✅ Gerenciar figurinhas faltantes e repetidas por usuário
- ✅ **Importar lista no formato texto** (ex: "USA 🇺🇸: 1, 2, 3")
- ✅ **Exportar lista para compartilhar**
- ✅ Match automático entre quem precisa e quem tem
- ✅ Sistema de confirmação de trocas
- ✅ Persistência local (LocalStorage)
- ✅ Interface moderna e responsiva
- ✅ Ordenação automática de figurinhas

## 🚀 Como usar

### Instalação

```bash
npm install
```

### Rodar o app

```bash
npm run dev
```

Abra http://localhost:3000 no navegador.

## 📖 Guia de Uso

1. **Adicionar Usuários**: Digite o nome e clique em "Adicionar"
2. **Selecionar Usuário**: Clique no card do usuário para gerenciar suas figurinhas
3. **Importar Lista** (recomendado): Clique em "📋 Importar" e cole sua lista no formato:
   ```
   Faltantes
   USA 🇺🇸: 3, 6, 7, 8, 13, 14
   BRA 🇧🇷: 1, 5, 10
   ARG 🇦🇷: 2, 4, 9
   
   Repetidas
   ESP 🇪🇸: 1, 3, 5
   POR 🇵🇹: 2, 8
   ```
4. **Adicionar Manualmente**: Digite o número (formato: `PAÍS-NUM`), escolha se é faltante ou repetida, e adicione
5. **Exportar Lista**: Clique em "📤 Exportar" para copiar sua lista formatada
6. **Encontrar Matches**: Clique no botão "🎯 Encontrar Matches" para ver todas as trocas possíveis
7. **Confirmar Trocas**: Clique em "Confirmar Troca" para registrar a troca

### 📋 Formato de Importação

O app aceita **múltiplos formatos** de lista:

**Formato 1** (país antes do emoji):
```
Faltantes
USA 🇺🇸: 3, 6, 7, 8
BRA 🇧🇷: 1, 5

Repetidas
ARG 🇦🇷: 2, 4
ESP 🇪🇸: 1, 3
```

**Formato 2** (emoji antes do país):
```
Faltantes
🇺🇸 USA: 3, 6, 7, 8
🇧🇷 BRA: 1, 5
⭐️ FWC: 7

Repetidas
🇦🇷 ARG: 2, 4
🇪🇸 ESP: 1, 3
```

**Flexibilidade total:**
- Use `Faltantes` e `Repetidas` para separar as seções
- Emoji antes OU depois do código (tanto faz!)
- Os emojis são opcionais
- Parser inteligente ignora linhas de cabeçalho
- Aceita códigos de 2-3 letras (USA, BRA, FWC, CC, etc)

## 🎯 Como funciona o Match

O algoritmo busca automaticamente todas as combinações onde:
- Uma pessoa tem uma figurinha **repetida**
- Outra pessoa tem essa mesma figurinha como **faltante**

O resultado mostra todas as trocas possíveis no formato:
```
Quem Tem → #123 → Quem Precisa
```

## 💾 Persistência

Todos os dados são salvos automaticamente no navegador (LocalStorage). Os dados persistem mesmo após fechar e reabrir o app.

## 🎨 Design

- Interface moderna com gradientes
- Design responsivo (mobile-friendly)
- Feedback visual para todas as ações
- Cores distintas para faltantes (vermelho) e repetidas (verde)

## 🛠 Tecnologias

- React 18
- Vite
- CSS Modules
- LocalStorage API
