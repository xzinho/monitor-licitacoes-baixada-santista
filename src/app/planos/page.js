'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function PlanosPage() {
  const [planos, setPlanos] = useState(null)

  useEffect(() => {
    fetch('/api/planos').then(r => r.json()).then(data => setPlanos(data.planos))
  }, [])

  if (!planos) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-8">
            ← Voltar para o início
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Escolha seu Plano</h1>
          <p className="text-xl text-gray-600">Cancele a qualquer momento. Sem taxas ocultas.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Free */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900">{planos.free.nome}</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-gray-900">R$ 0</span>
              <span className="text-gray-500">/mês</span>
            </div>
            <ul className="space-y-3 mb-8">
              {planos.free.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn-secondary block text-center w-full">Plano Atual</Link>
          </div>

          {/* Basic */}
          <div className="card border-primary-500 border-2 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold">Mais Popular</div>
            <h3 className="text-xl font-bold text-gray-900">{planos.basic.nome}</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-gray-900">R$ 29</span>
              <span className="text-gray-500">,90/mês</span>
            </div>
            <ul className="space-y-3 mb-8">
              {planos.basic.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/register?plan=basic" className="btn-primary block text-center w-full">Assinar Basic</Link>
          </div>

          {/* Premium */}
          <div className="card bg-gray-900 text-white">
            <h3 className="text-xl font-bold">{planos.premium.nome}</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold">R$ 79</span>
              <span className="text-gray-400">,90/mês</span>
            </div>
            <ul className="space-y-3 mb-8">
              {planos.premium.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/register?plan=premium" className="bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition block text-center w-full">Assinar Premium</Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Perguntas Frequentes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: 'Posso cancelar a qualquer momento?', a: 'Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas ou multas.' },
              { q: 'Os dados são em tempo real?', a: 'Sim! Nossos dados vêm diretamente da API oficial do PNCP (Portal Nacional de Contratações Públicas).' },
              { q: 'Como funciona o alerta por WhatsApp?', a: 'No plano Premium, você configura seu número e recebe alertas instantâneos de novas licitações.' },
              { q: 'Tem suporte técnico?', a: 'Sim! Todos os planos incluem suporte por e-mail. Premium tem suporte prioritário via chat.' },
            ].map((faq, i) => (
              <div key={i} className="card">
                <h4 className="font-bold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
