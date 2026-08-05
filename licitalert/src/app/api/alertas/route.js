import { NextResponse } from 'next/server'
import { db, PLANOS } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const alertas = db.getAlertasByUserId(session.id)
  const user = db.getUserById(session.id)
  
  return NextResponse.json({
    alertas,
    max_alertas: user?.max_alertas || 3,
    plano: PLANOS[user?.plan] || PLANOS.free,
  })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const { nome, cidade, palavras_chave, modalidade, valor_minimo } = await request.json()

    // Check limit
    const user = db.getUserById(session.id)
    const count = db.countActiveAlertas(session.id)

    if (count >= (user?.max_alertas || 3)) {
      return NextResponse.json({
        error: `Limite de ${user?.max_alertas || 3} alertas atingido. Faça upgrade do seu plano.`,
        upgrade: true,
      }, { status: 403 })
    }

    const alerta = db.createAlerta({
      user_id: session.id,
      nome,
      cidade,
      palavras_chave: palavras_chave || '',
      modalidade: modalidade || '',
      valor_minimo: valor_minimo || 0,
    })

    return NextResponse.json({ id: alerta.id, success: true })
  } catch (error) {
    console.error('Create alerta error:', error)
    return NextResponse.json({ error: 'Erro ao criar alerta' }, { status: 500 })
  }
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID do alerta é obrigatório' }, { status: 400 })
  }

  db.deleteAlerta(id, session.id)
  return NextResponse.json({ success: true })
}
