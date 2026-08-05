import { NextResponse } from 'next/server'
import { PLANOS } from '@/lib/db'

export async function GET() {
  return NextResponse.json({ planos: PLANOS })
}
