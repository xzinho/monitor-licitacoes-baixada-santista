import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    // Check if user exists
    const existing = db.getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 })
    }

    // Create user
    const password_hash = await hashPassword(password)
    const user = db.createUser({ name, email, password_hash, plan: 'free' })
    
    const token = await createToken({ id: user.id, name: user.name, email: user.email, plan: user.plan })
    setAuthCookie(token)

    return NextResponse.json({ 
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan } 
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
