import { NextResponse } from 'next/server'
import { generateMockData, buscarLicitacoesCidade, CIDADES_BAIXADA } from '@/lib/pncp'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const cidade = searchParams.get('cidade')
  const modalidade = searchParams.get('modalidade')
  const busca = searchParams.get('busca')
  const useLive = searchParams.get('live') === 'true'

  try {
    let licitacoes

    if (useLive) {
      // Try live PNCP data
      const cidadeObj = CIDADES_BAIXADA.find(c => c.nome === cidade) || CIDADES_BAIXADA[0]
      licitacoes = await buscarLicitacoesCidade(cidadeObj, 30)
    } else {
      // Use mock data (faster, reliable for demo)
      licitacoes = generateMockData()
    }

    // Filter by cidade
    if (cidade && cidade !== 'todas') {
      licitacoes = licitacoes.filter(l => l.cidade === cidade)
    }

    // Filter by modalidade
    if (modalidade && modalidade !== 'todas') {
      licitacoes = licitacoes.filter(l => l.modalidade.toLowerCase().includes(modalidade.toLowerCase()))
    }

    // Filter by search term
    if (busca) {
      const termo = busca.toLowerCase()
      licitacoes = licitacoes.filter(l =>
        l.objeto.toLowerCase().includes(termo) ||
        l.orgao.toLowerCase().includes(termo) ||
        l.cidade.toLowerCase().includes(termo)
      )
    }

    // Stats
    const stats = {
      total: licitacoes.length,
      valorTotal: licitacoes.reduce((sum, l) => sum + (l.valor_estimado || 0), 0),
      porCidade: licitacoes.reduce((acc, l) => {
        acc[l.cidade] = (acc[l.cidade] || 0) + 1
        return acc
      }, {}),
      porModalidade: licitacoes.reduce((acc, l) => {
        acc[l.modalidade] = (acc[l.modalidade] || 0) + 1
        return acc
      }, {}),
      porSituacao: licitacoes.reduce((acc, l) => {
        acc[l.situacao] = (acc[l.situacao] || 0) + 1
        return acc
      }, {}),
    }

    return NextResponse.json({ licitacoes, stats })
  } catch (error) {
    console.error('Licitacoes error:', error)
    return NextResponse.json({ error: 'Erro ao buscar licitações' }, { status: 500 })
  }
}
