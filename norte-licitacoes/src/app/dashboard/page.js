'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const [licitacoes, setLicitacoes] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtroCidade, setFiltroCidade] = useState('todas')
  const [filtroModalidade, setFiltroModalidade] = useState('todas')
  const [busca, setBusca] = useState('')
  const [showAlertaModal, setShowAlertaModal] = useState(false)
  const [alertas, setAlertas] = useState([])
  const [tab, setTab] = useState('licitacoes')

  const router = useRouter()

  useEffect(() => {
    fetchLicitacoes()
    fetchAlertas()
  }, [filtroCidade, filtroModalidade, busca])

  async function fetchLicitacoes() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroCidade !== 'todas') params.set('cidade', filtroCidade)
      if (filtroModalidade !== 'todas') params.set('modalidade', filtroModalidade)
      if (busca) params.set('busca', busca)

      const res = await fetch(`/api/licitacoes?${params}`)
      const data = await res.json()
      setLicitacoes(data.licitacoes || [])
      setStats(data.stats || null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAlertas() {
    try {
      const res = await fetch('/api/alertas')
      if (res.ok) {
        const data = await res.json()
        setAlertas(data.alertas || [])
      }
    } catch {
      // User might not be logged in
    }
  }

  async function criarAlerta(formData) {
    try {
      const res = await fetch('/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowAlertaModal(false)
        fetchAlertas()
      }
      return res
    } catch {
      return null
    }
  }

  async function deletarAlerta(id) {
    try {
      await fetch(`/api/alertas?id=${id}`, { method: 'DELETE' })
      fetchAlertas()
    } catch {}
  }

  const cidades = [...new Set(licitacoes.map(l => l.cidade))]
  const modalidades = [...new Set(licitacoes.map(l => l.modalidade))]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className="font-bold text-gray-900">Norte Licitações</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <button onClick={() => setTab('licitacoes')} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${tab === 'licitacoes' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  📋 Licitações
                </button>
                <button onClick={() => setTab('alertas')} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${tab === 'alertas' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  🔔 Alertas {alertas.length > 0 && <span className="ml-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">{alertas.length}</span>}
                </button>
                <button onClick={() => setTab('analytics')} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${tab === 'analytics' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  📊 Analytics
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/planos" className="text-sm text-primary-600 font-medium hover:text-primary-700">
                ⬆️ Upgrade
              </Link>
              <button onClick={() => { document.cookie = 'norte_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; router.push('/') }} className="text-sm text-gray-500 hover:text-gray-700">
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <p className="text-sm text-gray-500 font-medium">Total de Licitações</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 font-medium">Valor Total</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.valorTotal ? `R$ ${(stats.valorTotal / 1000000).toFixed(1)}M` : 'R$ 0'}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 font-medium">Cidades</p>
              <p className="text-3xl font-bold text-primary-700 mt-1">{Object.keys(stats.porCidade || {}).length}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 font-medium">Abertas</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {(stats.porSituacao || {})['Recebendo Propostas'] || 0}
              </p>
            </div>
          </div>
        )}

        {/* Mobile Tabs */}
        <div className="md:hidden flex gap-1 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setTab('licitacoes')} className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === 'licitacoes' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 bg-white'}`}>
            📋 Licitações
          </button>
          <button onClick={() => setTab('alertas')} className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === 'alertas' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 bg-white'}`}>
            🔔 Alertas
          </button>
          <button onClick={() => setTab('analytics')} className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === 'analytics' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 bg-white'}`}>
            📊 Analytics
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'licitacoes' && (
          <>
            {/* Filters */}
            <div className="card mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
                  <input
                    type="text"
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Ex: medicamento, asfalto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cidade</label>
                  <select value={filtroCidade} onChange={e => setFiltroCidade(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="todas">Todas as cidades</option>
                    {cidades.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Modalidade</label>
                  <select value={filtroModalidade} onChange={e => setFiltroModalidade(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="todas">Todas as modalidades</option>
                    {modalidades.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={() => setShowAlertaModal(true)} className="btn-primary w-full text-sm py-2">
                    + Novo Alerta
                  </button>
                </div>
              </div>
            </div>

            {/* Licitações List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500">Buscando licitações...</p>
              </div>
            ) : licitacoes.length === 0 ? (
              <div className="text-center py-12 card">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-gray-600 font-medium">Nenhuma licitação encontrada</p>
                <p className="text-gray-500 text-sm mt-1">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              <div className="space-y-3">
                {licitacoes.map((l, i) => (
                  <div key={i} className="card hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`badge ${l.situacao?.includes('Divulgada') ? 'badge-green' : l.situacao?.includes('Recebendo') ? 'badge-yellow' : l.situacao?.includes('Encerrada') ? 'badge-gray' : 'badge-blue'}`}>
                            {l.situacao}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">{l.cidade}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{l.modalidade}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{l.objeto}</h3>
                        <p className="text-sm text-gray-500">{l.orgao} • Nº {l.numero_compra}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>📅 Publicado: {l.data_publicacao_br}</span>
                          <span>📋 Abertura: {l.inicio_propostas_br}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-700">{l.valor_estimado_br}</p>
                        <a
                          href={l.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
                        >
                          Ver no PNCP →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'alertas' && (
          <AlertasTab alertas={alertas} onDelete={deletarAlerta} onNew={() => setShowAlertaModal(true)} />
        )}

        {tab === 'analytics' && (
          <AnalyticsTab stats={stats} licitacoes={licitacoes} />
        )}
      </div>

      {/* New Alert Modal */}
      {showAlertaModal && (
        <AlertaModal onClose={() => setShowAlertaModal(false)} onSave={criarAlerta} cidades={cidades} />
      )}
    </div>
  )
}

function AlertasTab({ alertas, onDelete, onNew }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meus Alertas</h2>
          <p className="text-gray-500">Configure alertas para receber notificações de novas licitações</p>
        </div>
        <button onClick={onNew} className="btn-primary text-sm">+ Novo Alerta</button>
      </div>

      {alertas.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-4xl mb-4">🔔</p>
          <p className="text-gray-600 font-medium">Nenhum alerta configurado</p>
          <p className="text-gray-500 text-sm mt-1 mb-4">Crie seu primeiro alerta para receber notificações</p>
          <button onClick={onNew} className="btn-primary text-sm">Criar Primeiro Alerta</button>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map(a => (
            <div key={a.id} className="card flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">{a.nome}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  📍 {a.cidade}
                  {a.palavras_chave && ` • 🔑 ${a.palavras_chave}`}
                  {a.modalidade && ` • 📋 ${a.modalidade}`}
                  {a.valor_minimo > 0 && ` • 💰 A partir de R$ ${Number(a.valor_minimo).toLocaleString('pt-BR')}`}
                </p>
              </div>
              <button onClick={() => onDelete(a.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AnalyticsTab({ stats, licitacoes }) {
  if (!stats) return null

  const cidadeEntries = Object.entries(stats.porCidade || {}).sort((a, b) => b[1] - a[1])
  const modalidadeEntries = Object.entries(stats.porModalidade || {}).sort((a, b) => b[1] - a[1])
  const situacaoEntries = Object.entries(stats.porSituacao || {}).sort((a, b) => b[1] - a[1])

  const maxCidade = Math.max(...cidadeEntries.map(e => e[1]), 1)
  const maxMod = Math.max(...modalidadeEntries.map(e => e[1]), 1)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Por Cidade */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">📍 Licitações por Cidade</h3>
          <div className="space-y-3">
            {cidadeEntries.map(([cidade, count]) => (
              <div key={cidade}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{cidade}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${(count / maxCidade) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por Modalidade */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">📋 Por Modalidade</h3>
          <div className="space-y-3">
            {modalidadeEntries.map(([mod, count]) => (
              <div key={mod}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{mod}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(count / maxMod) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por Situação */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">📊 Por Situação</h3>
          <div className="space-y-3">
            {situacaoEntries.map(([sit, count]) => (
              <div key={sit} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`badge ${sit.includes('Divulgada') ? 'badge-green' : sit.includes('Recebendo') ? 'badge-yellow' : 'badge-gray'}`}>
                    {sit}
                  </span>
                </div>
                <span className="font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Valores */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">💰 Maiores Valores</h3>
          <div className="space-y-3">
            {licitacoes
              .sort((a, b) => (b.valor_estimado || 0) - (a.valor_estimado || 0))
              .slice(0, 5)
              .map((l, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <p className="text-sm text-gray-700 font-medium line-clamp-1">{l.objeto}</p>
                    <p className="text-xs text-gray-500">{l.cidade}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600 whitespace-nowrap">{l.valor_estimado_br}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AlertaModal({ onClose, onSave, cidades }) {
  const [form, setForm] = useState({
    nome: '',
    cidade: cidades[0] || '',
    palavras_chave: '',
    modalidade: '',
    valor_minimo: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await onSave({
      ...form,
      valor_minimo: parseFloat(form.valor_minimo) || 0,
    })

    if (res && res.ok) {
      // success
    } else if (res) {
      const data = await res.json()
      setError(data.error || 'Erro ao criar alerta')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Novo Alerta</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do alerta</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm({...form, nome: e.target.value})}
              required
              placeholder="Ex: Obras em Santos"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <select
              value={form.cidade}
              onChange={e => setForm({...form, cidade: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {cidades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave (separadas por vírgula)</label>
            <input
              type="text"
              value={form.palavras_chave}
              onChange={e => setForm({...form, palavras_chave: e.target.value})}
              placeholder="Ex: medicamento, saúde, hospital"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor mínimo (R$)</label>
            <input
              type="number"
              value={form.valor_minimo}
              onChange={e => setForm({...form, valor_minimo: e.target.value})}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm py-2">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm py-2 disabled:opacity-50">
              {saving ? 'Criando...' : 'Criar Alerta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
