# 🧭 Norte Licitações

SaaS de monitoramento de licitações públicas — começando pela Baixada Santista, com dados oficiais do **PNCP** (Portal Nacional de Contratações Públicas).

## Planos

| Plano | Preço | Limites |
|-------|-------|---------|
| Free | R$ 0/mês | 1 cidade, 3 alertas |
| Basic | R$ 29,90/mês | 5 cidades, 15 alertas |
| Premium | R$ 79,90/mês | Ilimitado, WhatsApp + API |

## Stack

- Next.js 14 (App Router) + React 18 + Tailwind CSS
- Autenticação JWT (jose) + bcryptjs
- Fonte de dados: API PNCP (com fallback de dados de demonstração)
- Banco: JSON local (será migrado para Supabase/PostgreSQL antes do deploy)

## Como rodar

```bash
npm install
npm run dev
# http://localhost:3000
```

## Estrutura

```
src/app/            → páginas (landing, login, register, dashboard, planos)
src/app/api/        → rotas (auth, licitacoes, alertas, planos)
src/lib/            → db.js, auth.js, pncp.js
```

## Roadmap

- [x] MVP funcional: auth, busca PNCP, alertas, planos
- [ ] Migração do banco para Supabase (PostgreSQL)
- [ ] Deploy na Vercel + domínio nortelicitacoes.com.br
- [ ] Pagamentos recorrentes (Mercado Pago)
- [ ] Alertas automáticos por e-mail/WhatsApp

---
Autor: Moacyr Arantes (xzinho)
