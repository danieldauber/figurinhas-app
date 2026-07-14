import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // Sistema de Grupos
  const getGroupId = () => window.location.hash.slice(1) || null
  const [groupId, setGroupId] = useState(getGroupId())
  const [groupInfo, setGroupInfo] = useState(() => {
    const id = getGroupId()
    if (!id) return null
    const saved = localStorage.getItem(`figurinhas_group_${id}`)
    return saved ? JSON.parse(saved) : null
  })
  const [showGroupSetup, setShowGroupSetup] = useState(!groupId)
  const [newGroupName, setNewGroupName] = useState('')

  // Load users from localStorage based on group
  const [users, setUsers] = useState(() => {
    const id = getGroupId()
    if (!id) return []
    const saved = localStorage.getItem(`figurinhas_users_${id}`)
    return saved ? JSON.parse(saved) : []
  })
  const [currentUser, setCurrentUser] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [selectedUserForLogin, setSelectedUserForLogin] = useState('')
  const [newSticker, setNewSticker] = useState('')
  const [stickerType, setStickerType] = useState('faltante')
  const [matches, setMatches] = useState([])
  const [showMatches, setShowMatches] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [importMode, setImportMode] = useState('auto') // 'auto', 'faltantes', 'repetidas'
  const [showHelp, setShowHelp] = useState(false)

  // Save users to localStorage with group isolation
  useEffect(() => {
    if (groupId) {
      localStorage.setItem(`figurinhas_users_${groupId}`, JSON.stringify(users))
    }
  }, [users, groupId])

  // Listen for hash changes (group changes)
  useEffect(() => {
    const handleHashChange = () => {
      const newGroupId = getGroupId()
      setGroupId(newGroupId)
      if (newGroupId) {
        const saved = localStorage.getItem(`figurinhas_users_${newGroupId}`)
        setUsers(saved ? JSON.parse(saved) : [])
        const groupData = localStorage.getItem(`figurinhas_group_${newGroupId}`)
        setGroupInfo(groupData ? JSON.parse(groupData) : null)
        setShowGroupSetup(false)
        setCurrentUser('')
      } else {
        setShowGroupSetup(true)
        setUsers([])
        setGroupInfo(null)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const createGroup = () => {
    if (!newGroupName.trim()) {
      alert('Digite um nome para o grupo!')
      return
    }
    const hash = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
    const groupData = {
      name: newGroupName,
      createdAt: new Date().toISOString(),
      hash: hash
    }
    localStorage.setItem(`figurinhas_group_${hash}`, JSON.stringify(groupData))
    window.location.hash = hash
    setGroupId(hash)
    setGroupInfo(groupData)
    setShowGroupSetup(false)
    setNewGroupName('')
  }

  const copyGroupLink = () => {
    const link = `${window.location.origin}${window.location.pathname}#${groupId}`
    navigator.clipboard.writeText(link).then(() => {
      alert('🔗 Link do grupo copiado!\n\nCompartilhe com seus colegas para eles entrarem no mesmo grupo.')
    }).catch(() => {
      prompt('Copie o link do grupo:', link)
    })
  }

  const addUser = () => {
    if (!newUserName.trim()) {
      alert('Digite um nome de usuário!')
      return
    }
    if (!newUserPassword.trim()) {
      alert('Digite uma senha!')
      return
    }
    if (users.find(u => u.name === newUserName)) {
      alert('Usuário já existe!')
      return
    }
    setUsers([...users, {
      name: newUserName,
      password: newUserPassword, // Em produção, isso deveria ser hash
      faltantes: [],
      repetidas: []
    }])
    setNewUserName('')
    setNewUserPassword('')
    alert(`Usuário ${newUserName} criado com sucesso!\n\n⚠️ Guarde sua senha: ${newUserPassword}`)
  }

  const handleUserClick = (userName) => {
    const user = users.find(u => u.name === userName)
    if (!user) return

    // Se já está logado como esse usuário, não pede senha
    if (currentUser === userName) {
      setCurrentUser('')
      return
    }

    setSelectedUserForLogin(userName)
    setShowPasswordPrompt(true)
    setLoginPassword('')
  }

  const handleLogin = () => {
    const user = users.find(u => u.name === selectedUserForLogin)
    if (!user) return

    if (loginPassword === user.password) {
      setCurrentUser(selectedUserForLogin)
      setShowPasswordPrompt(false)
      setLoginPassword('')
      setSelectedUserForLogin('')
    } else {
      alert('Senha incorreta!')
      setLoginPassword('')
    }
  }

  const handleCancelLogin = () => {
    setShowPasswordPrompt(false)
    setLoginPassword('')
    setSelectedUserForLogin('')
  }

  const addSticker = () => {
    if (!currentUser || !newSticker.trim()) return
    const stickerNum = newSticker.trim()

    setUsers(users.map(user => {
      if (user.name === currentUser) {
        const list = stickerType === 'faltante' ? 'faltantes' : 'repetidas'
        const otherList = stickerType === 'faltante' ? 'repetidas' : 'faltantes'

        if (user[list].includes(stickerNum)) {
          alert('Figurinha já está na lista!')
          return user
        }

        if (user[otherList].includes(stickerNum)) {
          alert(`Esta figurinha já está nas suas ${otherList}!`)
          return user
        }

        return {
          ...user,
          [list]: [...user[list], stickerNum].sort((a, b) => {
            const numA = parseInt(a)
            const numB = parseInt(b)
            return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB
          })
        }
      }
      return user
    }))
    setNewSticker('')
  }

  const removeSticker = (userName, sticker, type) => {
    setUsers(users.map(user => {
      if (user.name === userName) {
        return {
          ...user,
          [type]: user[type].filter(s => s !== sticker)
        }
      }
      return user
    }))
  }

  const findMatches = () => {
    const allMatches = []

    users.forEach(user => {
      user.faltantes.forEach(faltante => {
        users.forEach(otherUser => {
          if (user.name !== otherUser.name && otherUser.repetidas.includes(faltante)) {
            const matchExists = allMatches.some(m =>
              m.quemPrecisa === user.name &&
              m.quemTem === otherUser.name &&
              m.figurinha === faltante
            )
            if (!matchExists) {
              allMatches.push({
                quemPrecisa: user.name,
                quemTem: otherUser.name,
                figurinha: faltante
              })
            }
          }
        })
      })
    })

    setMatches(allMatches)
    setShowMatches(true)
  }

  const executeMatch = (match) => {
    if (confirm(`Confirmar troca da figurinha ${match.figurinha}?\n${match.quemTem} → ${match.quemPrecisa}`)) {
      setUsers(users.map(user => {
        if (user.name === match.quemTem) {
          return {
            ...user,
            repetidas: user.repetidas.filter(s => s !== match.figurinha)
          }
        }
        if (user.name === match.quemPrecisa) {
          return {
            ...user,
            faltantes: user.faltantes.filter(s => s !== match.figurinha)
          }
        }
        return user
      }))

      setMatches(matches.filter(m =>
        !(m.quemPrecisa === match.quemPrecisa &&
          m.quemTem === match.quemTem &&
          m.figurinha === match.figurinha)
      ))

      alert('Troca registrada!')
    }
  }

  const deleteUser = (userName) => {
    if (confirm(`Tem certeza que deseja deletar ${userName}?`)) {
      setUsers(users.filter(u => u.name !== userName))
      if (currentUser === userName) {
        setCurrentUser('')
      }
    }
  }

  const parseImportText = (text, userName) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l)
    const faltantes = []
    const repetidas = []

    // Se não tem as palavras "Faltantes" ou "Repetidas", usa o modo selecionado
    const hasSections = text.toLowerCase().includes('faltantes') ||
                       text.toLowerCase().includes('repetidas') ||
                       text.toLowerCase().includes('faltante') ||
                       text.toLowerCase().includes('repetida')

    let currentMode = hasSections ? null : importMode === 'auto' ? 'faltantes' : importMode

    for (const line of lines) {
      // Detecta seção
      if (line.toLowerCase().includes('faltantes') || line.toLowerCase().includes('faltante')) {
        currentMode = 'faltantes'
        continue
      }
      if (line.toLowerCase().includes('repetidas') || line.toLowerCase().includes('repetida')) {
        currentMode = 'repetidas'
        continue
      }

      // Ignora linhas de cabeçalho/título
      if (line.toLowerCase().includes('figurinhas') ||
          line.toLowerCase().includes('app') ||
          line.toLowerCase().includes('lista') ||
          line.toLowerCase().includes('eua') ||
          line.toLowerCase().includes('méx') ||
          line.toLowerCase().includes('can 26')) {
        continue
      }

      if (!currentMode) continue

      // Parse linha de país
      // Suporta três formatos:
      // 1. "USA 🇺🇸: 3, 6, 7" (código antes do emoji)
      // 2. "🇺🇸 USA: 3, 6, 7" (emoji antes do código)
      // 3. "Estados Unidos: USA 3, USA 6, USA 7" (nome do país: códigos com números)
      const colonIndex = line.indexOf(':')
      if (colonIndex > -1) {
        const prefix = line.substring(0, colonIndex).trim()
        const numbersStr = line.substring(colonIndex + 1).trim()

        let country = null

        // Primeiro tenta extrair códigos repetidos no formato "USA 3, USA 6"
        const repeatedCodeMatch = numbersStr.match(/([A-Z]{2,3})\s+\d+/)
        if (repeatedCodeMatch) {
          country = repeatedCodeMatch[1]
          // Parse números no formato "USA 3, USA 6, USA 7"
          const numbersWithCode = numbersStr.match(/[A-Z]{2,3}\s+(\d+)/g)
          if (numbersWithCode) {
            const numbers = numbersWithCode.map(m => m.match(/\d+/)[0])
            for (const num of numbers) {
              const sticker = `${country}-${num}`
              if (currentMode === 'faltantes') {
                faltantes.push(sticker)
              } else {
                repetidas.push(sticker)
              }
            }
            continue
          }
        }

        // Se não encontrou, tenta os formatos anteriores
        // Tenta primeiro: letras no início (formato 1)
        let countryMatch = prefix.match(/^([A-Z]{2,3}|FWC|CC)/)
        country = countryMatch ? countryMatch[1] : null

        // Se não encontrou, tenta: letras depois de emoji/símbolo (formato 2)
        if (!country) {
          countryMatch = prefix.match(/[^\w\s]*\s*([A-Z]{2,3}|FWC|CC)/)
          country = countryMatch ? countryMatch[1] : prefix.split(/[\s:]/)[0]
        }

        // Fallback: pega primeira palavra alfanumérica
        if (!country) {
          const words = prefix.split(/\s+/).filter(w => /[A-Z]{2,3}/.test(w))
          country = words[0] || 'UNK'
        }

        // Parse números simples (formato 1 e 2)
        const numbers = numbersStr.split(',').map(n => n.trim()).filter(n => n && /^\d+$/.test(n))

        for (const num of numbers) {
          const sticker = `${country}-${num}`
          if (currentMode === 'faltantes') {
            faltantes.push(sticker)
          } else {
            repetidas.push(sticker)
          }
        }
      }
    }

    return { faltantes, repetidas }
  }

  const importList = () => {
    if (!importText.trim()) {
      alert('Cole sua lista primeiro!')
      return
    }

    if (!currentUser) {
      alert('Selecione um usuário primeiro!')
      return
    }

    try {
      const { faltantes, repetidas } = parseImportText(importText, currentUser)

      if (faltantes.length === 0 && repetidas.length === 0) {
        alert('Nenhuma figurinha encontrada. Verifique o formato da lista.')
        return
      }

      setUsers(users.map(user => {
        if (user.name === currentUser) {
          return {
            ...user,
            faltantes: [...new Set([...user.faltantes, ...faltantes])].sort((a, b) => {
              const numA = parseInt(a.split('-')[1])
              const numB = parseInt(b.split('-')[1])
              return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB
            }),
            repetidas: [...new Set([...user.repetidas, ...repetidas])].sort((a, b) => {
              const numA = parseInt(a.split('-')[1])
              const numB = parseInt(b.split('-')[1])
              return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB
            })
          }
        }
        return user
      }))

      alert(`Importado com sucesso!\n${faltantes.length} faltantes\n${repetidas.length} repetidas`)
      setImportText('')
      setShowImport(false)
    } catch (error) {
      alert('Erro ao importar lista. Verifique o formato.')
      console.error(error)
    }
  }

  const exportList = () => {
    if (!currentUser) {
      alert('Selecione um usuário primeiro!')
      return
    }

    const user = users.find(u => u.name === currentUser)
    if (!user) return

    // Agrupa por país
    const groupByCountry = (stickers) => {
      const grouped = {}
      stickers.forEach(sticker => {
        const [country, num] = sticker.split('-')
        if (!grouped[country]) grouped[country] = []
        grouped[country].push(num)
      })
      return grouped
    }

    const faltantesGrouped = groupByCountry(user.faltantes)
    const repetidasGrouped = groupByCountry(user.repetidas)

    let text = `Figurinhas - ${currentUser}\n\n`

    if (Object.keys(faltantesGrouped).length > 0) {
      text += 'Faltantes\n'
      Object.entries(faltantesGrouped).sort().forEach(([country, nums]) => {
        text += `${country}: ${nums.join(', ')}\n`
      })
    }

    if (Object.keys(repetidasGrouped).length > 0) {
      text += '\nRepetidas\n'
      Object.entries(repetidasGrouped).sort().forEach(([country, nums]) => {
        text += `${country}: ${nums.join(', ')}\n`
      })
    }

    // Copia para clipboard
    navigator.clipboard.writeText(text).then(() => {
      alert('Lista copiada para a área de transferência!')
    }).catch(() => {
      // Fallback: mostra em um prompt
      prompt('Copie sua lista:', text)
    })
  }

  const clearUserStickers = () => {
    if (!currentUser) return

    if (confirm(`Tem certeza que deseja limpar TODAS as figurinhas de ${currentUser}?\n\nEsta ação não pode ser desfeita!`)) {
      setUsers(users.map(user => {
        if (user.name === currentUser) {
          return {
            ...user,
            faltantes: [],
            repetidas: []
          }
        }
        return user
      }))
      alert('Figurinhas limpas!')
    }
  }

  const currentUserData = users.find(u => u.name === currentUser)

  const getStats = () => {
    const totalStickers = users.reduce((sum, user) => {
      const uniqueStickers = new Set([...user.faltantes, ...user.repetidas])
      return sum + uniqueStickers.size
    }, 0)

    const totalFaltantes = users.reduce((sum, user) => sum + user.faltantes.length, 0)
    const totalRepetidas = users.reduce((sum, user) => sum + user.repetidas.length, 0)

    return { totalStickers, totalFaltantes, totalRepetidas }
  }

  const stats = getStats()

  // Landing Page pública (sem grupo)
  if (!groupId) {
    // Rota secreta para criar grupos
    const isAdminRoute = window.location.pathname.includes('/admin') ||
                        window.location.search.includes('admin=true')

    if (isAdminRoute) {
      return (
        <div className="group-setup">
          <div className="group-setup-card">
            <h1>🎴 Criar Novo Grupo</h1>
            <p className="group-subtitle">Painel administrativo - Criação de grupos</p>

            <div className="group-option">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Nome do grupo (ex: Trabalho, Condomínio, Família)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createGroup()}
                  autoFocus
                />
                <button onClick={createGroup} className="btn btn-primary">
                  Criar Grupo
                </button>
              </div>
            </div>

            <div className="admin-hint">
              ⚠️ Após criar, compartilhe o link gerado com os participantes
            </div>
          </div>
        </div>
      )
    }

    // Landing Page pública
    return (
      <div className="landing-page">
        <div className="landing-container">
          <div className="landing-hero">
            <h1>🎴 App de Troca de Figurinhas</h1>
            <p className="landing-subtitle">
              Sistema inteligente para organizar trocas de figurinhas com seus amigos
            </p>
          </div>

          <div className="landing-content">
            <div className="landing-card">
              <h2>🤔 Como Funciona?</h2>
              <div className="landing-steps">
                <div className="landing-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>Receba o Link do Grupo</h3>
                    <p>O organizador vai compartilhar um link único com você</p>
                  </div>
                </div>

                <div className="landing-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>Cadastre-se no Grupo</h3>
                    <p>Crie sua conta com nome e senha secreta</p>
                  </div>
                </div>

                <div className="landing-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>Adicione suas Figurinhas</h3>
                    <p>Informe quais faltam e quais são repetidas</p>
                  </div>
                </div>

                <div className="landing-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h3>Match Automático!</h3>
                    <p>O sistema mostra todas as trocas possíveis entre vocês</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="landing-card landing-features">
              <h2>✨ Recursos</h2>
              <ul className="features-list">
                <li>🔒 <strong>Proteção por senha</strong> - Suas figurinhas são privadas</li>
                <li>📋 <strong>Importação rápida</strong> - Cole sua lista completa de uma vez</li>
                <li>🎯 <strong>Match inteligente</strong> - Encontra todas as trocas possíveis</li>
                <li>🔍 <strong>Busca rápida</strong> - Encontre figurinhas específicas</li>
                <li>📤 <strong>Exportação</strong> - Compartilhe sua lista atualizada</li>
                <li>📱 <strong>Mobile-friendly</strong> - Funciona no celular</li>
              </ul>
            </div>

            <div className="landing-cta">
              <div className="cta-card">
                <h3>🔗 Precisa do Link do Grupo?</h3>
                <p>
                  Peça ao organizador do seu grupo para compartilhar o link de acesso.
                  O link tem esse formato:
                </p>
                <div className="cta-example">
                  <code>{window.location.origin}#abc123xyz</code>
                </div>
                <p className="cta-note">
                  Cada grupo tem um link único e exclusivo
                </p>
              </div>
            </div>
          </div>

          <footer className="landing-footer">
            <p>Feito com 💜 para facilitar suas trocas de figurinhas</p>
          </footer>
        </div>
      </div>
    )
  }

  // Grupo não existe
  if (!groupInfo) {
    return (
      <div className="group-setup">
        <div className="group-setup-card error-card">
          <h1>❌ Grupo Não Encontrado</h1>
          <p className="group-subtitle">
            O link que você usou não corresponde a nenhum grupo ativo.
          </p>
          <div className="error-actions">
            <p>Possíveis motivos:</p>
            <ul>
              <li>O link está incompleto ou incorreto</li>
              <li>O grupo ainda não foi criado</li>
              <li>Houve um erro ao copiar o link</li>
            </ul>
            <button
              onClick={() => window.location.hash = ''}
              className="btn btn-primary"
            >
              ← Voltar para Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="group-info-header">
            <h1>🎴 {groupInfo.name}</h1>
            <div className="group-actions-header">
              <button onClick={copyGroupLink} className="btn btn-secondary btn-sm">
                🔗 Copiar Link
              </button>
            </div>
          </div>
          <p>Match automático entre faltantes e repetidas</p>
        </div>
        <button onClick={() => setShowHelp(true)} className="btn btn-help">
          ❓ Como Usar
        </button>
      </header>

      <div className="container">
        <div className="section add-user-section">
          <h2>Adicionar Usuário</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="Nome do usuário"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && newUserPassword && addUser()}
            />
            <input
              type="password"
              placeholder="Senha secreta"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && newUserName && addUser()}
            />
            <button onClick={addUser} className="btn btn-primary">
              Adicionar
            </button>
          </div>
          <p className="password-hint">
            🔒 Cada usuário precisa de uma senha para editar suas figurinhas
          </p>
        </div>

        <div className="section">
          <h2>Usuários ({users.length})</h2>
          {users.length > 0 && (
            <div className="stats-summary">
              <div className="stat-box">
                <div className="stat-value">{stats.totalFaltantes}</div>
                <div className="stat-label">Total Faltantes</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{stats.totalRepetidas}</div>
                <div className="stat-label">Total Repetidas</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{stats.totalStickers}</div>
                <div className="stat-label">Figurinhas Únicas</div>
              </div>
            </div>
          )}
          <div className="users-grid">
            {users.map(user => (
              <div
                key={user.name}
                className={`user-card ${currentUser === user.name ? 'active' : ''}`}
                onClick={() => handleUserClick(user.name)}
              >
                <div className="user-header">
                  <h3>
                    {currentUser === user.name && '🔓 '}
                    {user.name}
                  </h3>
                  <button
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteUser(user.name)
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="user-stats">
                  <span className="stat missing">
                    {user.faltantes.length} faltantes
                  </span>
                  <span className="stat extra">
                    {user.repetidas.length} repetidas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showPasswordPrompt && (
          <div className="modal-overlay" onClick={handleCancelLogin}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>🔒 Digite a senha de {selectedUserForLogin}</h2>
              <input
                type="password"
                placeholder="Senha"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                autoFocus
                className="password-input"
              />
              <div className="modal-actions">
                <button onClick={handleLogin} className="btn btn-primary">
                  Entrar
                </button>
                <button onClick={handleCancelLogin} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showHelp && (
          <div className="modal-overlay" onClick={() => setShowHelp(false)}>
            <div className="modal-content modal-help" onClick={(e) => e.stopPropagation()}>
              <h2>📖 Como Usar o App</h2>
              <div className="help-content">
                <div className="help-step">
                  <h3>1️⃣ Criar Usuário</h3>
                  <p>Digite seu nome e uma senha secreta. A senha protege suas figurinhas para que só você possa editá-las.</p>
                </div>

                <div className="help-step">
                  <h3>2️⃣ Fazer Login</h3>
                  <p>Clique no seu card de usuário e digite sua senha. O card ficará destacado quando você estiver logado.</p>
                </div>

                <div className="help-step">
                  <h3>3️⃣ Adicionar Figurinhas</h3>
                  <p><strong>Opção A:</strong> Clique em "📋 Importar" e cole sua lista completa. O app aceita vários formatos!</p>
                  <p><strong>Opção B:</strong> Adicione uma por uma digitando o código (ex: BRA-5)</p>
                </div>

                <div className="help-step">
                  <h3>4️⃣ Encontrar Trocas</h3>
                  <p>Quando todos adicionarem suas figurinhas, clique no botão "🎯 Encontrar Matches". O app mostra todas as trocas possíveis!</p>
                </div>

                <div className="help-step">
                  <h3>5️⃣ Confirmar Trocas</h3>
                  <p>Clique em "Confirmar Troca" para registrar. As figurinhas são atualizadas automaticamente para ambos os usuários.</p>
                </div>

                <div className="help-tip">
                  <strong>💡 Dica:</strong> Use o botão "📤 Exportar" para copiar sua lista atualizada e compartilhar com os colegas!
                </div>

                <div className="help-tip">
                  <strong>🔍 Busca:</strong> Use o campo de busca para encontrar figurinhas específicas rapidamente.
                </div>
              </div>
              <button onClick={() => setShowHelp(false)} className="btn btn-primary btn-close-help">
                Entendi!
              </button>
            </div>
          </div>
        )}

        {currentUser && (
          <div className="section">
            <div className="section-header">
              <h2>Gerenciar Figurinhas - {currentUser}</h2>
              <div className="header-buttons">
                <button
                  onClick={exportList}
                  className="btn btn-export"
                  title="Exportar lista"
                >
                  📤 Exportar
                </button>
                <button
                  onClick={() => setShowImport(!showImport)}
                  className="btn btn-import"
                  title="Importar lista"
                >
                  📋 {showImport ? 'Fechar' : 'Importar'}
                </button>
                <button
                  onClick={clearUserStickers}
                  className="btn btn-danger"
                  title="Limpar todas as figurinhas"
                >
                  🗑️ Limpar
                </button>
              </div>
            </div>

            {showImport && (
              <div className="import-container">
                <h3>Importar Lista</h3>

                <div className="import-mode-selector">
                  <label>
                    <input
                      type="radio"
                      name="importMode"
                      value="auto"
                      checked={importMode === 'auto'}
                      onChange={(e) => setImportMode(e.target.value)}
                    />
                    <span>Automático (detecta "Faltantes" e "Repetidas")</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="importMode"
                      value="faltantes"
                      checked={importMode === 'faltantes'}
                      onChange={(e) => setImportMode(e.target.value)}
                    />
                    <span>Tudo como Faltantes</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="importMode"
                      value="repetidas"
                      checked={importMode === 'repetidas'}
                      onChange={(e) => setImportMode(e.target.value)}
                    />
                    <span>Tudo como Repetidas</span>
                  </label>
                </div>

                <p className="import-help">
                  Cole sua lista em qualquer formato:<br />
                  <strong>Formato 1:</strong><br />
                  <code>
                    🇺🇸 USA: 3, 6, 7
                  </code>
                  <strong>Formato 2:</strong><br />
                  <code>
                    Brasil: BRA 3, BRA 5, BRA 7
                  </code>
                  <strong>Formato 3 (com seções):</strong><br />
                  <code>
                    Faltantes<br />
                    🇧🇷 BRA: 1, 5<br />
                    Repetidas<br />
                    🇦🇷 ARG: 2, 4
                  </code>
                </p>
                <textarea
                  className="import-textarea"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Cole sua lista aqui..."
                  rows={10}
                />
                <div className="import-actions">
                  <button onClick={importList} className="btn btn-primary">
                    Importar
                  </button>
                  <button
                    onClick={() => {
                      setImportText('')
                      setShowImport(false)
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="input-group">
              <input
                type="text"
                placeholder="Número da figurinha"
                value={newSticker}
                onChange={(e) => setNewSticker(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSticker()}
              />
              <select
                value={stickerType}
                onChange={(e) => setStickerType(e.target.value)}
                className="select"
              >
                <option value="faltante">Faltante</option>
                <option value="repetidas">Repetida</option>
              </select>
              <button onClick={addSticker} className="btn btn-primary">
                Adicionar
              </button>
            </div>

            <div className="stickers-container">
              <div className="stickers-list">
                <div className="stickers-list-header">
                  <h3>Faltantes ({currentUserData.faltantes.length})</h3>
                  <input
                    type="text"
                    placeholder="🔍 Buscar..."
                    className="search-input"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                </div>
                <div className="stickers-grid">
                  {currentUserData.faltantes
                    .filter(sticker => !searchFilter || sticker.toLowerCase().includes(searchFilter.toLowerCase()))
                    .map(sticker => (
                    <div key={sticker} className="sticker-badge missing">
                      {sticker}
                      <button
                        onClick={() => removeSticker(currentUser, sticker, 'faltantes')}
                        className="sticker-remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {searchFilter && currentUserData.faltantes.filter(s => s.toLowerCase().includes(searchFilter.toLowerCase())).length === 0 && (
                    <p className="no-results">Nenhuma figurinha encontrada</p>
                  )}
                </div>
              </div>

              <div className="stickers-list">
                <h3>Repetidas ({currentUserData.repetidas.length})</h3>
                <div className="stickers-grid">
                  {currentUserData.repetidas
                    .filter(sticker => !searchFilter || sticker.toLowerCase().includes(searchFilter.toLowerCase()))
                    .map(sticker => (
                    <div key={sticker} className="sticker-badge extra">
                      {sticker}
                      <button
                        onClick={() => removeSticker(currentUser, sticker, 'repetidas')}
                        className="sticker-remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {searchFilter && currentUserData.repetidas.filter(s => s.toLowerCase().includes(searchFilter.toLowerCase())).length === 0 && (
                    <p className="no-results">Nenhuma figurinha encontrada</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="section match-section">
          <button
            onClick={findMatches}
            className="btn btn-match"
            disabled={users.length < 2}
          >
            🎯 Encontrar Matches ({users.length >= 2 ? 'Pronto!' : 'Adicione mais usuários'})
          </button>

          {showMatches && (
            <div className="matches-container">
              <h2>Matches Encontrados ({matches.length})</h2>
              {matches.length === 0 ? (
                <p className="no-matches">Nenhum match encontrado 😢</p>
              ) : (
                <div className="matches-list">
                  {matches.map((match, idx) => (
                    <div key={idx} className="match-card">
                      <div className="match-info">
                        <span className="match-from">{match.quemTem}</span>
                        <span className="match-arrow">→</span>
                        <span className="match-sticker">#{match.figurinha}</span>
                        <span className="match-arrow">→</span>
                        <span className="match-to">{match.quemPrecisa}</span>
                      </div>
                      <button
                        onClick={() => executeMatch(match)}
                        className="btn btn-success"
                      >
                        Confirmar Troca
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
