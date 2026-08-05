/**
 * Integração com a API do PNCP (Portal Nacional de Contratações Públicas)
 */

const PNCP_BASE = 'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao'

export const CIDADES_BAIXADA = [
  { nome: 'Praia Grande', ibge: '3541000' },
  { nome: 'Santos', ibge: '3548500' },
  { nome: 'São Vicente', ibge: '3551009' },
  { nome: 'Cubatão', ibge: '3513504' },
  { nome: 'Mongaguá', ibge: '3531100' },
  { nome: 'Guarujá', ibge: '3518701' },
  { nome: 'Bertioga', ibge: '3506804' },
  { nome: 'Itanhaém', ibge: '3522109' },
  { nome: 'Peruíbe', ibge: '3534609' },
]

export const MODALIDADES = {
  1: 'Leilão Eletrônico',
  2: 'Diálogo Competitivo',
  3: 'Concurso',
  4: 'Concorrência',
  5: 'Concorrência Eletrônica',
  6: 'Pregão Eletrônico',
  7: 'Pregão Presencial',
  8: 'Dispensa de Licitação',
  9: 'Inexigibilidade',
  10: 'Manifestação de Interesse',
  11: 'Pré-qualificação',
  12: 'Credenciamento',
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function formatBR(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

function formatDateTimeBR(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

function formatCurrency(value) {
  if (!value && value !== 0) return '-'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseLicitacao(item, cidade) {
  return {
    numero_controle: item.numeroControlePNCP || '',
    numero_compra: item.numeroCompra || '',
    cidade: cidade,
    orgao: item.orgaoEntidade?.razaoSocial || '',
    cnpj: item.orgaoEntidade?.cnpj || '',
    modalidade: item.modalidadeNome || '',
    modalidade_id: item.modalidadeId || null,
    objeto: item.objetoCompra || '',
    valor_estimado: item.valorTotalEstimado || 0,
    data_publicacao: item.dataPublicacaoPncp || '',
    data_publicacao_br: formatBR(item.dataPublicacaoPncp),
    inicio_propostas: item.dataAberturaProposta || '',
    inicio_propostas_br: formatDateTimeBR(item.dataAberturaProposta),
    fim_propostas: item.dataEncerramentoProposta || '',
    fim_propostas_br: formatDateTimeBR(item.dataEncerramentoProposta),
    situacao: item.situacaoCompraNome || '',
    link: item.linkSistemaOrigem || '',
    numero_controle_pncp: item.numeroControlePNCP || '',
  }
}

export async function buscarLicitacoes(codigoIbge, modalidadeId, dataInicial, dataFinal, pagina = 1) {
  const url = `${PNCP_BASE}?dataInicial=${dataInicial}&dataFinal=${dataFinal}&codigoModalidadeContratacao=${modalidadeId}&uf=SP&codigoMunicipioIbge=${codigoIbge}&pagina=${pagina}&tamanhoPagina=50`

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }, // cache 1h
    })

    if (!response.ok) {
      console.error(`PNCP error: ${response.status}`)
      return { data: [], total: 0, error: `HTTP ${response.status}` }
    }

    const json = await response.json()
    return {
      data: (json.data || []).map(item => parseLicitacao(item, '')),
      total: json.totalRegistros || (json.data || []).length,
      error: null,
    }
  } catch (error) {
    console.error('PNCP fetch error:', error)
    return { data: [], total: 0, error: error.message }
  }
}

export async function buscarLicitacoesCidade(cidade, diasAtras = 30) {
  const dataFinal = new Date()
  const dataInicial = new Date()
  dataInicial.setDate(dataFinal.getDate() - diasAtras)

  const dataIni = formatDate(dataInicial)
  const dataFim = formatDate(dataFinal)

  // Search main modalities
  const modalidadesBusca = [4, 6, 8, 9] // Concorrência, Pregão, Dispensa, Inexigibilidade
  let todasLicitacoes = []

  for (const mod of modalidadesBusca) {
    try {
      const result = await buscarLicitacoes(cidade.ibge, mod, dataIni, dataFim)
      const licitacoesComCidade = result.data.map(l => ({ ...l, cidade: cidade.nome }))
      todasLicitacoes = [...todasLicitacoes, ...licitacoesComCidade]
    } catch (e) {
      console.error(`Error fetching mod ${mod} for ${cidade.nome}:`, e)
    }
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Sort by date descending
  todasLicitacoes.sort((a, b) => new Date(b.data_publicacao) - new Date(a.data_publicacao))

  return todasLicitacoes
}

export async function buscarTodasCidades(diasAtras = 30) {
  let todas = []
  for (const cidade of CIDADES_BAIXADA.slice(0, 5)) { // Start with 5 main cities
    const result = await buscarLicitacoesCidade(cidade, diasAtras)
    todas = [...todas, ...result]
  }
  return todas
}

// Generate mock data for demo purposes when PNCP is unavailable
export function generateMockData() {
  const mockLicitacoes = [
    { cidade: 'Praia Grande', modalidade: 'Pregão Eletrônico', objeto: 'Aquisição de materiais de escritório para Secretaria de Educação', valor: 125000, situacao: 'Divulgada no PNCP', dias: 1 },
    { cidade: 'Santos', modalidade: 'Concorrência', objeto: 'Contratação de empresa para obras de revitalização da orla', valor: 4500000, situacao: 'Recebendo Propostas', dias: 2 },
    { cidade: 'São Vicente', modalidade: 'Dispensa de Licitação', objeto: 'Contratação emergencial de serviços de manutenção de escolas', valor: 85000, situacao: 'Divulgada no PNCP', dias: 0 },
    { cidade: 'Cubatão', modalidade: 'Pregão Eletrônico', objeto: 'Aquisição de medicamentos para a rede pública de saúde', valor: 890000, situacao: 'Recebendo Propostas', dias: 3 },
    { cidade: 'Mongaguá', modalidade: 'Inexigibilidade', objeto: 'Contratação de show artístico para aniversário da cidade', valor: 250000, situacao: 'Divulgada no PNCP', dias: 1 },
    { cidade: 'Praia Grande', modalidade: 'Pregão Eletrônico', objeto: 'Serviço de coleta e transporte de resíduos sólidos', valor: 12000000, situacao: 'Divulgada no PNCP', dias: 4 },
    { cidade: 'Santos', modalidade: 'Dispensa de Licitação', objeto: 'Locação de equipamentos de informática para censo municipal', valor: 45000, situacao: 'Encerrada', dias: 5 },
    { cidade: 'São Vicente', modalidade: 'Concorrência', objeto: 'Construção de unidade básica de saúde no bairro Vila Margarida', valor: 3200000, situacao: 'Recebendo Propostas', dias: 1 },
    { cidade: 'Cubatão', modalidade: 'Pregão Eletrônico', objeto: 'Fornecimento de merenda escolar para rede municipal', valor: 2100000, situacao: 'Divulgada no PNCP', dias: 2 },
    { cidade: 'Guarujá', modalidade: 'Pregão Eletrônico', objeto: 'Contratação de serviços de limpeza urbana e coleta seletiva', valor: 8500000, situacao: 'Recebendo Propostas', dias: 0 },
    { cidade: 'Santos', modalidade: 'Pregão Eletrônico', objeto: 'Aquisição de próteses dentárias para programa de saúde bucal', valor: 201902.86, situacao: 'Divulgada no PNCP', dias: 1 },
    { cidade: 'Praia Grande', modalidade: 'Concorrência', objeto: 'Pavimentação asfáltica de vias públicas - Lote 3', valor: 6800000, situacao: 'Divulgada no PNCP', dias: 3 },
    { cidade: 'Bertioga', modalidade: 'Dispensa de Licitação', objeto: 'Aquisição de kits escolares para alunos da rede municipal', valor: 180000, situacao: 'Recebendo Propostas', dias: 2 },
    { cidade: 'Itanhaém', modalidade: 'Pregão Eletrônico', objeto: 'Contratação de empresa para manutenção de iluminação pública', valor: 1500000, situacao: 'Divulgada no PNCP', dias: 4 },
    { cidade: 'Peruíbe', modalidade: 'Concorrência', objeto: 'Obras de drenagem e macrodrenagem urbana', valor: 5200000, situacao: 'Divulgada no PNCP', dias: 5 },
    { cidade: 'Mongaguá', modalidade: 'Pregão Eletrônico', objeto: 'Fornecimento de uniformes escolares', valor: 320000, situacao: 'Recebendo Propostas', dias: 1 },
    { cidade: 'Santos', modalidade: 'Concorrência', objeto: 'Modernização do sistema de monitoramento por câmeras', valor: 7800000, situacao: 'Divulgada no PNCP', dias: 0 },
    { cidade: 'Cubatão', modalidade: 'Dispensa de Licitação', objeto: 'Contratação de serviços veterinários para zoonoses', valor: 95000, situacao: 'Divulgada no PNCP', dias: 6 },
  ]

  return mockLicitacoes.map((l, i) => {
    const dataPub = new Date()
    dataPub.setDate(dataPub.getDate() - l.dias)
    const dataAbertura = new Date()
    dataAbertura.setDate(dataAbertura.getDate() + 15 + Math.floor(Math.random() * 15))
    const dataFim = new Date(dataAbertura)
    dataFim.setDate(dataFim.getDate() + 7)

    return {
      id: i + 1,
      numero_controle: `${Math.random().toString(36).substr(2, 15).toUpperCase()}`,
      numero_compra: `${200 + i}/2026`,
      cidade: l.cidade,
      orgao: `MUNICÍPIO DE ${l.cidade.toUpperCase()}`,
      modalidade: l.modalidade,
      objeto: l.objeto,
      valor_estimado: l.valor,
      valor_estimado_br: l.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      data_publicacao: dataPub.toISOString(),
      data_publicacao_br: dataPub.toLocaleDateString('pt-BR'),
      inicio_propostas: dataAbertura.toISOString(),
      inicio_propostas_br: dataAbertura.toLocaleDateString('pt-BR') + ' 09:00',
      fim_propostas: dataFim.toISOString(),
      fim_propostas_br: dataFim.toLocaleDateString('pt-BR') + ' 09:30',
      situacao: l.situacao,
      link: `https://pncp.gov.br/app/editais/${dataPub.getFullYear()}/${l.modalidade.toLowerCase().replace(/\s/g, '-')}/${i + 1}`,
    }
  })
}

export { formatDate, formatBR, formatDateTimeBR, formatCurrency }
