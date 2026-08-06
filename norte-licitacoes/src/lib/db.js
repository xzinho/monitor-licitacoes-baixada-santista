import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Na Vercel, usar /tmp (que é writeable) em vez de process.cwd() (que é read-only)
const isVercel = process.env.VERCEL === '1'
const DATA_DIR = isVercel
  ? '/tmp/norte-data'
  : path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

// Garante que a pasta de dados existe antes de escrever
// (necessário na Vercel, onde /tmp começa vazio a cada deploy)
function ensureDir() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  } catch (e) {
    console.error('DB mkdir error:', e)
  }
}

// Default database structure
const DEFAULT_DB = {
  users: [],
  alertas: [],
  licitacoes_salvas: [],
}

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8')
      return JSON.parse(raw)
    }
  } catch (e) {
    console.error('DB read error:', e)
  }
  return { ...DEFAULT_DB }
}

function writeDb(db) {
  try {
    ensureDir()
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
  } catch (e) {
    console.error('DB write error:', e)
  }
}

// Simple database operations
export const db = {
  // Users
  getUserByEmail(email) {
    const data = readDb()
    return data.users.find(u => u.email === email) || null
  },
  
  getUserById(id) {
    const data = readDb()
    return data.users.find(u => u.id === id) || null
  },

  createUser({ name, email, password_hash, plan = 'free' }) {
    const data = readDb()
    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      password_hash,
      plan,
      max_cidades: plan === 'free' ? 1 : plan === 'basic' ? 5 : 999,
      max_alertas: plan === 'free' ? 3 : plan === 'basic' ? 15 : 999,
      created_at: new Date().toISOString(),
    }
    data.users.push(user)
    writeDb(data)
    return user
  },

  // Alertas
  getAlertasByUserId(userId) {
    const data = readDb()
    return data.alertas.filter(a => a.user_id === userId).sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )
  },

  countActiveAlertas(userId) {
    const data = readDb()
    return data.alertas.filter(a => a.user_id === userId && a.ativo).length
  },

  createAlerta({ user_id, nome, cidade, palavras_chave = '', modalidade = '', valor_minimo = 0 }) {
    const data = readDb()
    const alerta = {
      id: crypto.randomUUID(),
      user_id,
      nome,
      cidade,
      palavras_chave,
      modalidade,
      valor_minimo,
      ativo: true,
      created_at: new Date().toISOString(),
    }
    data.alertas.push(alerta)
    writeDb(data)
    return alerta
  },

  deleteAlerta(id, userId) {
    const data = readDb()
    data.alertas = data.alertas.filter(a => !(a.id === id && a.user_id === userId))
    writeDb(data)
  },
}

// Plan configurations
export const PLANOS = {
  free: {
    nome: 'Grátis',
    preco: 0,
    max_cidades: 1,
    max_alertas: 3,
    features: ['1 cidade monitorada', '3 alertas ativos', 'Atualização diária', 'Busca básica'],
  },
  basic: {
    nome: 'Basic',
    preco: 29.90,
    max_cidades: 5,
    max_alertas: 15,
    features: ['5 cidades monitoradas', '15 alertas ativos', 'Atualização a cada 6h', 'Alertas por e-mail', 'Filtro por palavras-chave', 'Exportação CSV'],
  },
  premium: {
    nome: 'Premium',
    preco: 79.90,
    max_cidades: 999,
    max_alertas: 999,
    features: ['Cidades ilimitadas', 'Alertas ilimitados', 'Tempo real', 'Alertas por e-mail + WhatsApp', 'API de integração', 'Exportação PDF/Excel', 'Suporte prioritário', 'Relatórios semanais'],
  },
}
