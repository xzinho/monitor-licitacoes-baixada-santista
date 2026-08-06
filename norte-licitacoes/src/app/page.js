'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/licitacoes')
      .then(r => r.json())
      .then(data => setStats(data.stats))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">Norte Licitações</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/80 hover:text-white transition">Recursos</a>
              <a href="#pricing" className="text-white/80 hover:text-white transition">Planos</a>
              <a href="#demo" className="text-white/80 hover:text-white transition">Demo</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-white/90 hover:text-white font-medium px-4 py-2 transition">
                Entrar
              </Link>
              <Link href="/register" className="bg-white text-primary-700 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition shadow-lg">
                Começar Grátis
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="gradient-hero min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-white/90 text-sm font-medium">
                  {stats?.total || 18} licitações encontradas hoje
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Nunca perca uma{' '}
                <span className="text-blue-200">licitação pública</span>{' '}
                novamente
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Monitoramento inteligente de licitações em tempo real. Receba alertas 
                personalizados por e-mail e WhatsApp das melhores oportunidades de 
                contratos públicos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="btn-primary text-center text-lg">
                  🚀 Começar Grátis Agora
                </Link>
                <a href="#demo" className="btn-secondary text-center text-lg">
                  Ver Demonstração
                </a>
              </div>
              <div className="mt-8 flex items-center gap-6 text-blue-100">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">14 dias grátis no Premium</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-float">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-white/60 text-sm ml-2">Dashboard - Norte Licitações</span>
                </div>
                <div className="space-y-3">
                  {[
                    { cidade: 'Santos', valor: 'R$ 4.5M', status: '🟢 Aberta', obj: 'Revitalização da orla' },
                    { cidade: 'Praia Grande', valor: 'R$ 12M', status: '🟡 Propostas', obj: 'Coleta de resíduos' },
                    { cidade: 'Cubatão', valor: 'R$ 890K', status: '🟢 Aberta', obj: 'Medicamentos saúde' },
                    { cidade: 'São Vicente', valor: 'R$ 3.2M', status: '🔵 Nova', obj: 'UBS Vila Margarida' },
                  ].map((l, i) => (
                    <div key={i} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium text-sm">{l.obj}</p>
                          <p className="text-blue-200 text-xs mt-1">{l.cidade}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-sm">{l.valor}</p>
                          <p className="text-xs mt-1">{l.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-500 mb-8 text-sm font-medium uppercase tracking-wider">
            Dados de todas as prefeituras da Baixada Santista e Brasil
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {[
              { num: '5.570+', label: 'Prefeituras monitoradas' },
              { num: 'R$ 2.8B+', label: 'Em licitações rastreadas' },
              { num: '15K+', label: 'Empresas ativas' },
              { num: '99.9%', label: 'Uptime garantido' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-primary-700">{s.num}</p>
                <p className="text-gray-500 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa para vencer licitações
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ferramentas poderosas para encontrar, monitorar e participar das melhores 
              oportunidades de contratos públicos.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🔔',
                title: 'Alertas Inteligentes',
                desc: 'Configure alertas por cidade, modalidade, palavras-chave e valor. Receba notificações instantâneas.',
              },
              {
                icon: '🔍',
                title: 'Busca Avançada',
                desc: 'Pesquise em milhares de licitações com filtros avançados. Encontre oportunidades que combinam com seu negócio.',
              },
              {
                icon: '📊',
                title: 'Dashboard Completo',
                desc: 'Visualize estatísticas, tendências e oportunidades em um painel intuitivo e profissional.',
              },
              {
                icon: '📧',
                title: 'Alertas por E-mail',
                desc: 'Receba novos editais diretamente no seu e-mail assim que são publicados no PNCP.',
              },
              {
                icon: '📱',
                title: 'WhatsApp',
                desc: 'No plano Premium, receba alertas direto no WhatsApp. Nunca perca um prazo importante.',
              },
              {
                icon: '📄',
                title: 'Exportação',
                desc: 'Exporte licitações em PDF ou Excel para compartilhar com sua equipe ou usar nas propostas.',
              },
            ].map((f, i) => (
              <div key={i} className="card hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Veja licitações ao vivo agora
            </h2>
            <p className="text-xl text-gray-600">
              Dados reais da API do PNCP atualizados em tempo real
            </p>
          </div>
          <DemoGrid />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Planos para todos os tamanhos
            </h2>
            <p className="text-xl text-gray-600">
              Comece grátis e escale conforme seu negócio cresce
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900">Grátis</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-gray-900">R$ 0</span>
                <span className="text-gray-500">/mês</span>
              </div>
              <p className="text-gray-600 mb-6">Ideal para quem está começando</p>
              <ul className="space-y-3 mb-8">
                {['1 cidade monitorada', '3 alertas ativos', 'Atualização diária', 'Busca básica'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="btn-secondary block text-center w-full">
                Começar Grátis
              </Link>
            </div>

            {/* Basic */}
            <div className="card border-primary-500 border-2 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                Mais Popular
              </div>
              <h3 className="text-xl font-bold text-gray-900">Basic</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-gray-900">R$ 29</span>
                <span className="text-gray-500">,90/mês</span>
              </div>
              <p className="text-gray-600 mb-6">Para empresas que fornecem para prefeituras</p>
              <ul className="space-y-3 mb-8">
                {['5 cidades monitoradas', '15 alertas ativos', 'Atualização a cada 6h', 'Alertas por e-mail', 'Filtro por palavras-chave', 'Exportação CSV'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=basic" className="btn-primary block text-center w-full">
                Assinar Basic
              </Link>
            </div>

            {/* Premium */}
            <div className="card bg-gray-900 text-white">
              <h3 className="text-xl font-bold">Premium</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold">R$ 79</span>
                <span className="text-gray-400">,90/mês</span>
              </div>
              <p className="text-gray-400 mb-6">Para consultorias e grandes empresas</p>
              <ul className="space-y-3 mb-8">
                {['Cidades ilimitadas', 'Alertas ilimitados', 'Tempo real', 'WhatsApp + E-mail', 'API de integração', 'Exportação PDF/Excel', 'Suporte prioritário', 'Relatórios semanais'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=premium" className="bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition block text-center w-full">
                Assinar Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-hero">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Pronto para nunca mais perder uma licitação?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a milhares de empresas que já usam o Norte Licitações para encontrar as melhores oportunidades.
          </p>
          <Link href="/register" className="inline-block bg-white text-primary-700 font-bold text-lg py-4 px-8 rounded-lg hover:bg-gray-100 transition shadow-xl">
            Criar Conta Grátis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className="text-white font-bold">Norte Licitações</span>
              </div>
              <p className="text-sm">Monitoramento inteligente de licitações públicas em todo o Brasil.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Planos</a></li>
                <li><a href="#demo" className="hover:text-white transition">Demonstração</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition">LGPD</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm">
                <li>contato@nortelicitacoes.com.br</li>
                <li>(13) 99999-9999</li>
                <li>Santos, SP - Brasil</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 Norte Licitações. Todos os direitos reservados. Dados públicos via PNCP.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function DemoGrid() {
  const [licitacoes, setLicitacoes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/licitacoes')
      .then(r => r.json())
      .then(data => {
        setLicitacoes(data.licitacoes?.slice(0, 6) || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500">Buscando licitações no PNCP...</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {licitacoes.map((l, i) => (
        <div key={i} className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className={`badge ${l.situacao.includes('Divulgada') ? 'badge-green' : l.situacao.includes('Recebendo') ? 'badge-yellow' : 'badge-gray'}`}>
              {l.situacao}
            </span>
            <span className="text-xs text-gray-500">{l.data_publicacao_br}</span>
          </div>
          <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{l.objeto}</h4>
          <p className="text-xs text-gray-500 mb-3">{l.cidade} • {l.modalidade}</p>
          <p className="text-lg font-bold text-primary-700">{l.valor_estimado_br}</p>
        </div>
      ))}
    </div>
  )
}
