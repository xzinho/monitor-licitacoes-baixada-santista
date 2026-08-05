import './globals.css'

export const metadata = {
  title: 'LicitAlert - Monitor Inteligente de Licitações Públicas',
  description: 'Receba alertas de licitações públicas em tempo real. Monitore prefeituras da Baixada Santista e todo o Brasil.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
