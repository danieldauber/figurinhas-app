import { useState, useEffect } from 'react'
import './App.css'
import { api } from './api'

function App() {
  // Sistema de Grupos
  const getGroupId = () => window.location.hash.slice(1) || null
  const [groupId, setGroupId] = useState(getGroupId())
  const [groupInfo, setGroupInfo] = useState(null)
  const [showGroupSetup, setShowGroupSetup] = useState(!groupId)
  const [newGroupName, setNewGroupName] = useState('')
  const [loading, setLoading] = useState(true)

  // Admin mode check
  const isAdmin = window.location.search.includes('admin=true') ||
                  window.location.pathname.includes('/admin')

  // Users state
  const [users, setUsers] = useState([])
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

  // Load group and users from API
  useEffect(() => {
    const loadGroupData = async () => {
      const id = getGroupId()
      if (!id) {
        setLoading(false)
        return
      }

      try {
        const group = await api.getGroup(id)
        setGroupInfo(group)

        if (group) {
          const usersData = await api.getUsers(id)
          setUsers(usersData)
        }
      } catch (error) {
        console.error('Error loading group:', error)
        setGroupInfo(null)
      } finally {
        setLoading(false)
      }
    }

    loadGroupData()
  }, [groupId])

  // Listen for hash changes (group changes)
  useEffect(() => {
    const handleHashChange = async () => {
      const newGroupId = getGroupId()
      setGroupId(newGroupId)
      setLoading(true)
      setCurrentUser('')

      if (newGroupId) {
        try {
          const group = await api.getGroup(newGroupId)
          setGroupInfo(group)

          if (group) {
            const usersData = await api.getUsers(newGroupId)
            setUsers(usersData)
          } else {
            setUsers([])
          }
          setShowGroupSetup(false)
        } catch (error) {
          console.error('Error loading group:', error)
          setGroupInfo(null)
          setUsers([])
        }
      } else {
        setShowGroupSetup(true)
        setUsers([])
        setGroupInfo(null)
      }
      setLoading(false)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Digite um nome para o grupo!')
      return
    }
    const hash = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)

    try {
      const group = await api.createGroup(hash, newGroupName)
      window.location.hash = hash
      setGroupId(hash)
      setGroupInfo(group)
      setShowGroupSetup(false)
      setNewGroupName('')
    } catch (error) {
      alert('Erro ao criar grupo. Tente novamente.')
      console.error(error)
    }
  }

  const copyGroupLink = () => {
    const link = `${window.location.origin}${window.location.pathname}#${groupId}`
    navigator.clipboard.writeText(link).then(() => {
      alert('🔗 Link do grupo copiado!\n\nCompartilhe com seus colegas para eles entrarem no mesmo grupo.')
    }).catch(() => {
      prompt('Copie o link do grupo:', link)
    })
  }

  const addUser = async () => {
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

    try {
      const newUser = await api.createUser(groupId, newUserName, newUserPassword)
      setUsers([...users, newUser])
      setNewUserName('')
      const savedPassword = newUserPassword
      setNewUserPassword('')
      alert(`Usuário ${newUserName} criado com sucesso!\n\n⚠️ Guarde sua senha: ${savedPassword}`)
    } catch (error) {
      alert(error.message || 'Erro ao criar usuário')
      console.error(error)
    }
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

  const handleLogin = async () => {
    const user = users.find(u => u.name === selectedUserForLogin)
    if (!user) return

    try {
      const valid = await api.verifyPassword(groupId, selectedUserForLogin, loginPassword)
      if (valid) {
        setCurrentUser(selectedUserForLogin)
        setShowPasswordPrompt(false)
        setLoginPassword('')
        setSelectedUserForLogin('')
      } else {
        alert('Senha incorreta!')
        setLoginPassword('')
      }
    } catch (error) {
      alert('Erro ao verificar senha')
      console.error(error)
    }
  }

  const handleCancelLogin = () => {
    setShowPasswordPrompt(false)
    setLoginPassword('')
    setSelectedUserForLogin('')
  }

  const addSticker = async () => {
    if (!currentUser || !newSticker.trim()) return
    const stickerNum = newSticker.trim()

    try {
      const type = stickerType === 'faltante' ? 'faltante' : 'repetida'
      await api.addSticker(groupId, currentUser, stickerNum, type)

      // Refresh users data
      const usersData = await api.getUsers(groupId)
      setUsers(usersData)
      setNewSticker('')
    } catch (error) {
      if (error.message.includes('opposite list')) {
        const otherType = stickerType === 'faltante' ? 'repetidas' : 'faltantes'
        alert(`Esta figurinha já está nas suas ${otherType}!`)
      } else {
        alert('Erro ao adicionar figurinha')
      }
      console.error(error)
    }
  }

  const removeSticker = async (userName, sticker, type) => {
    try {
      await api.removeSticker(groupId, userName, sticker, type)

      // Refresh users data
      const usersData = await api.getUsers(groupId)
      setUsers(usersData)
    } catch (error) {
      alert('Erro ao remover figurinha')
      console.error(error)
    }
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

  const executeMatch = async (match) => {
    if (confirm(`Confirmar troca da figurinha ${match.figurinha}?\n${match.quemTem} → ${match.quemPrecisa}`)) {
      try {
        // Remove repetida from quemTem
        await api.removeSticker(groupId, match.quemTem, match.figurinha, 'repetida')

        // Remove faltante from quemPrecisa
        await api.removeSticker(groupId, match.quemPrecisa, match.figurinha, 'faltante')

        // Refresh users data
        const usersData = await api.getUsers(groupId)
        setUsers(usersData)

        // Remove from matches
        setMatches(matches.filter(m =>
          !(m.quemPrecisa === match.quemPrecisa &&
            m.quemTem === match.quemTem &&
            m.figurinha === match.figurinha)
        ))

        alert('Troca registrada!')
      } catch (error) {
        alert('Erro ao registrar troca')
        console.error(error)
      }
    }
  }

  const deleteUser = async (userName) => {
    if (confirm(`Tem certeza que deseja deletar ${userName}?`)) {
      try {
        await api.deleteUser(groupId, userName)

        // Refresh users data
        const usersData = await api.getUsers(groupId)
        setUsers(usersData)

        if (currentUser === userName) {
          setCurrentUser('')
        }
      } catch (error) {
        alert('Erro ao deletar usuário')
        console.error(error)
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

  const importList = async () => {
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

      // Add all stickers via API
      const promises = []
      for (const sticker of faltantes) {
        promises.push(api.addSticker(groupId, currentUser, sticker, 'faltante').catch(() => {}))
      }
      for (const sticker of repetidas) {
        promises.push(api.addSticker(groupId, currentUser, sticker, 'repetida').catch(() => {}))
      }

      await Promise.all(promises)

      // Refresh users data
      const usersData = await api.getUsers(groupId)
      setUsers(usersData)

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

  const clearUserStickers = async () => {
    if (!currentUser) return

    if (confirm(`Tem certeza que deseja limpar TODAS as figurinhas de ${currentUser}?\n\nEsta ação não pode ser desfeita!`)) {
      try {
        await api.clearStickers(groupId, currentUser)

        // Refresh users data
        const usersData = await api.getUsers(groupId)
        setUsers(usersData)

        alert('Figurinhas limpas!')
      } catch (error) {
        alert('Erro ao limpar figurinhas')
        console.error(error)
      }
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

  // Loading state
  if (loading && groupId) {
    return (
      <div className="group-setup">
        <div className="group-setup-card">
          <h1>🎴 Carregando...</h1>
          <p className="group-subtitle">Aguarde um momento</p>
        </div>
      </div>
    )
  }

  // Landing Page pública (sem grupo)
  if (!groupId) {
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
            {/* Botão Destacado para Criar Grupo */}
            <div className="landing-card create-group-card">
              <h2>✨ Criar Novo Grupo</h2>
              <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-gray-600)' }}>
                Organize trocas com seus amigos, familiares ou colegas de trabalho
              </p>
              <div className="input-group" style={{ marginBottom: '0' }}>
                <input
                  type="text"
                  placeholder="Nome do grupo (ex: Trabalho, Condomínio, Família)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createGroup()}
                  style={{ flex: 1 }}
                />
                <button onClick={createGroup} className="btn btn-primary">
                  🚀 Criar Grupo
                </button>
              </div>
            </div>

            <div className="landing-divider">
              <span>ou</span>
            </div>

            <div className="landing-card">
              <h2>🤔 Como Funciona?</h2>
              <div className="landing-steps">
                <div className="landing-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>Crie ou Entre no Grupo</h3>
                    <p>Crie seu grupo ou use o link compartilhado pelo organizador</p>
                  </div>
                </div>

                <div className="landing-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>Cadastre-se</h3>
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
                <li>🌐 <strong>Compartilhamento em tempo real</strong> - Todos veem os mesmos dados</li>
              </ul>
            </div>

            <div className="landing-cta">
              <div className="cta-card">
                <h3>📝 Já Tem um Grupo?</h3>
                <p>
                  Se alguém já criou o grupo, peça o link de acesso.
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
      {isAdmin && (
        <div className="admin-badge">
          🔐 Modo Admin
        </div>
      )}
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
                  {isAdmin && (
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteUser(user.name)
                      }}
                    >
                      ×
                    </button>
                  )}
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
