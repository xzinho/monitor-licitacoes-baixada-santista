# 📚 Documentação Técnica - Monitor de Licitações

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Atual](#arquitetura-atual)
3. [Cidades Monitoradas](#cidades-monitoradas)
4. [Modalidades](#modalidades)
5. [API do PNCP](#api-do-pncp)
6. [Estrutura da Planilha](#estrutura-da-planilha)
7. [Notificações por E-mail](#notificações-por-e-mail)
8. [Roadmap](#roadmap)
9. [Erros Comuns](#erros-comuns)

---

## 🎯 Visão Geral

**Objetivo:** Criar um sistema que monitora todas as licitações públicas das prefeituras da Baixada Santista de forma automatizada, permitindo que empresas e cidadãos acompanhem oportunidades de contratos com o poder público.

**Público-alvo:**
- Empresas que fornecem para prefeituras
- Consultorias de licitação
- Cidadãos interessados em transparência pública
- Jornalistas de investigação

**Modelo de Negócio Futuro:**
- **Free:** 1 prefeitura, atualização diária
- **Basic (R$29/mês):** 5 prefeituras, alertas por e-mail
- **Premium (R$79/mês):** Ilimitado, alertas em tempo real, exportação PDF/Excel

---

## 🏗️ Arquitetura Atual

### Fase 1 - MVP (Google Sheets) ✅

┌──────────────────────────────────┐
│ GOOGLE SHEETS │
│ (Interface do usuário) │
└─────────────┬────────────────────┘
│
▼
┌──────────────────────────────────┐
│ GOOGLE APPS SCRIPT │
│ (Lógica de busca e formatação) │
└─────────────┬────────────────────┘
│
▼
┌──────────────────────────────────┐
│ API PNCP │
│ (Fonte de dados oficial) │
└──────────────────────────────────┘

text


### Fase 2 - Site (Planejada)
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Banco de dados:** MongoDB Atlas (grátis 512MB)
- **Deploy Backend:** Render.com (grátis)
- **Deploy Frontend:** Vercel (grátis)

### Fase 3 - App Mobile (Futuro)
- React Native
- Push notifications
- Modo offline

---

## 🏙️ Cidades Monitoradas

| Cidade | Código IBGE | UF | CNPJ Prefeitura |
|--------|-------------|-----|-----------------|
| Praia Grande | 3541000 | SP | 46.177.531/0001-55 |
| Santos | 3548500 | SP | 58.200.015/0001-83 |
| São Vicente | 3551009 | SP | 46.177.523/0001-09 |
| Cubatão | 3513504 | SP | (verificar) |
| Mongaguá | 3531100 | SP | 46.412.649/0001-33 |

**Como adicionar novas cidades:**
1. Buscar código IBGE em: https://www.ibge.gov.br/explica/codigos-dos-municipios.php
2. Adicionar ao array `CONFIG.cidades` no código
3. Criar aba na planilha com nome idêntico

---

## 📋 Modalidades

| Código | Modalidade | Descrição |
|--------|------------|-----------|
| 1 | Leilão Eletrônico | Alienação de bens |
| 2 | Diálogo Competitivo | Contratações complexas |
| 3 | Concurso | Trabalhos técnicos/artísticos |
| 4 | Concorrência | Contratos de grande vulto |
| 5 | Concorrência Eletrônica | Grande vulto online |
| 6 | Pregão Eletrônico | Bens e serviços comuns |
| 7 | Pregão Presencial | Bens/serviços com atos presenciais |
| 8 | Dispensa de Licitação | Casos previstos em lei |
| 9 | Inexigibilidade | Inviabilidade de competição |
| 10 | Manifestação de Interesse | Consulta ao mercado |
| 11 | Pré-qualificação | Habilitação prévia |
| 12 | Credenciamento | Múltiplos fornecedores |

**Atualmente monitorando:** 4, 6, 8, 9

---

## 🔗 API do PNCP

### Endpoint Base
https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao

text


### Parâmetros

| Parâmetro | Tipo | Obrigatório | Exemplo |
|-----------|------|-------------|---------|
| `dataInicial` | AAAAMMDD | ✅ | 20260101 |
| `dataFinal` | AAAAMMDD | ✅ | 20261231 |
| `codigoModalidadeContratacao` | número | ✅ | 6 |
| `uf` | string | ❌ | SP |
| `codigoMunicipioIbge` | número | ❌ | 3541000 |
| `pagina` | número | ✅ | 1 |
| `tamanhoPagina` | número | ✅ | 50 (min: 10, max: 500) |

### Regras Importantes
- ⚠️ **Rate limit:** ~60 requisições/hora por IP
- ⚠️ **Erro 429:** O script tenta 3 vezes com espera de até 15s; se persistir, pula a modalidade e registra aviso (não trava mais a execução)
- ⚠️ **Erros 5xx (502/503/504):** Instabilidade do PNCP (frequente em 2026). O script tenta 3 vezes com espera de 5s; se continuar, **mantém os dados anteriores da aba**
- ⚠️ **Erro 400:** Parâmetros inválidos
- ⚠️ **tamanhoPagina mínimo:** 10 (o script usa 50)
- ✅ **Aguardar 2 segundos** entre requisições
- ✅ **Paginação automática:** o script percorre todas as páginas (até `CONFIG.maxPaginas` = 5 por modalidade) para não perder registros
- ✅ **Dados preservados:** quando a busca falha, a última versão boa da aba NÃO é apagada — um aviso fica na linha 3
- ✅ **Orçamento de tempo:** a execução se limita a `CONFIG.orcamentoSegundos` (300s) para nunca estourar o limite de 6 minutos do Apps Script

### Campos Retornados
```json
{
  "numeroCompra": "200",
  "modalidadeNome": "Pregão - Eletrônico",
  "orgaoEntidade": {
    "cnpj": "46177531000155",
    "razaoSocial": "MUNICIPIO DE PRAIA GRANDE"
  },
  "objetoCompra": "RP P AQUISICAO DE PROTESE I",
  "valorTotalEstimado": 201902.86,
  "dataPublicacaoPncp": "2026-01-05T07:19:27",
  "dataAberturaProposta": "2025-10-29T09:00:00",
  "dataEncerramentoProposta": "2025-11-13T09:30:00",
  "situacaoCompraNome": "Divulgada no PNCP",
  "linkSistemaOrigem": "",
  "numeroControlePNCP": "46177531000155-1-000654/2025"
}
Documentação Oficial
https://www.gov.br/pncp/pt-br/acesso-a-informacao/manuais/manual-de-integracao-pncp

📊 Estrutura da Planilha
Abas (ordem)
📊 Dashboard - Resumo consolidado
Praia Grande - Licitações da cidade
Santos
São Vicente
Cubatão
Mongaguá
Linha 3 de cada aba de cidade: reservada para avisos da última atualização (ex.: "⚠️ Atenção: Pregão: HTTP 502..."). Quando a busca é limpa, fica vazia.
Colunas de cada aba de cidade
Coluna	Dado	Formato
A	Nº Compra	Texto
B	Modalidade	Texto
C	Órgão	Texto
D	Objeto	Texto (450px, quebra linha)
E	Valor Estimado	R$ #,##0.00
F	Data Publicação	DD/MM/AAAA
G	Início Propostas	DD/MM/AAAA HH:MM
H	Fim Propostas	DD/MM/AAAA HH:MM
I	Situação	Texto
J	Link	URL
Colunas do Dashboard
Coluna	Dado
A	Cidade
B	Total de Licitações
C	Valor Total (R$)
D	Pregões
E	Concorrências
F	Dispensas
G	Inexigibilidades
Cores por Situação
🟢 Verde claro #d9ead3 → Divulgada no PNCP
🟡 Amarelo claro #fff2cc → Recebendo Propostas
⚪ Cinza claro #f3f3f3 → Encerrada / Suspensa
⬜ Branco #ffffff → Outros
Cor do Cabeçalho
Azul principal: #1a56db
📧 Notificações por E-mail
Como funciona
 A cada atualização (manual ou automática), o script compara as licitações encontradas com o histórico do que já foi visto (guardado nas propriedades do script — invisível, não mexe nas abas).
 Só o que é NOVO é enviado por e-mail, separado por cidade.
 Se uma cidade tiver muitas novidades, o e-mail é dividido em blocos de até CONFIG.maxItensPorEmail (padrão 20) — nada de mensagem gigante.
 Rodar "Atualizar Tudo" várias vezes não repete e-mails.

Configuração (em CONFIG)
 emailNotificacoes: true — false desliga tudo
 emailDestino: "mgarantes@gmail.com" — para quem enviar
 maxItensPorEmail: 20 — licitações por e-mail
 maxEmailsPorExecucao: 10 — segurança (limite por execução)

Ativação
 1. Menu 🏛️ Licitações > 📧 Testar envio de e-mail (confirma que o Gmail funciona)
 2. Menu 🏛️ Licitações > ⏰ Ativar atualização diária (8h) — na 1ª vez o Google pede autorização
 3. Na 1ª execução com dados, você recebe um e-mail de ativação; o histórico já publicado NÃO é enviado

Limites do Google (por que funciona)
 Apps Script gratuito: até 100 destinatários/dia pelo MailApp — enviamos para 1 destinatário.
 Mensagens curtas (máx. 20 licitações cada) — muito abaixo do limite de tamanho do Gmail.
 Se o envio falhar, o script NÃO quebra: registra aviso e segue (a planilha continua atualizando).

🗺️ Roadmap
✅ Fase 1 - MVP (Concluído)
 Integração com API PNCP
 Puxar dados de 5 cidades
 Filtro por 4 modalidades
 Dashboard consolidado
 Formatação profissional
 Menu personalizado
 Documentação no GitHub
✅ Fase 2 - Melhorias (Parcialmente concluída)
 Gatilho automático diário (8h da manhã) ✅
 Alerta por e-mail de novas licitações (separados por cidade, em blocos) ✅
 Filtro por palavra-chave (ex: "asfalto", "medicamento") — próximo passo
 Filtro por valor mínimo
 Filtro por valor mínimo
 Adicionar mais 5 prefeituras
 Aba "Favoritos" para marcar licitações interessantes
🚀 Fase 3 - Site Web
 Frontend React
 Backend Node.js
 Sistema de login/cadastro
 Dashboard visual (gráficos)
 Exportação PDF/Excel
 Sistema de assinatura (Stripe/MercadoPago)
📱 Fase 4 - App Mobile
 React Native
 Push notifications
 Modo offline
 Publicação na Play Store
 Publicação na App Store
🐛 Erros Comuns
Erro 503 - Service Unavailable
Causa: Servidor do PNCP fora do ar
Solução: O script tenta 3 vezes sozinho; se persistir, aguardar 5-10 minutos e tentar novamente. Os dados anteriores da aba são mantidos.

Erro 502/504 - Bad Gateway / Gateway Timeout
Causa: Instabilidade do servidor do PNCP (frequente em 2026 — houve relatos públicos de indisponibilidade)
Solução: Mesmo tratamento do 503 (retry automático). Use o menu "🔌 Testar conexão PNCP" para ver quais cidades estão com problema.

Erro 204 - No Content
Causa: NENHUMA — a API responde 204 quando não há licitações daquela modalidade no período (normal, ex.: Concorrência em cidades menores)
Solução: O script v3.1+ trata 204 como resposta vazia válida (sem aviso, sem erro). Se aparecer "HTTP 204" na linha 3, o código da planilha está desatualizado — cole a versão nova.

Erro 429 - Too Many Requests
Causa: Muitas requisições em pouco tempo (rate limit ~60 req/h por IP)
Solução: O script tenta 3 vezes com espera de até 15s; se persistir, pula a modalidade e registra aviso na linha 3. Aguardar 15-30 minutos antes de rodar de novo.
Prevenção: Manter delay de 2s entre requisições (CONFIG.delayEntreRequisicoes)

Erro 400 - Bad Request
Causa: Parâmetros inválidos
Solução: Verificar formato das datas (AAAAMMDD) e valores mínimos

Erro "Address unavailable"
Causa: Tentando usar /api/search/ (endpoint bloqueado)
Solução: Usar /api/consulta/ (endpoint oficial liberado)

Erro "Cannot read properties of undefined"
Causa: Nome de campo errado no JSON
Solução: Rodar diagnóstico para descobrir nomes corretos

Erro "Exceeded maximum execution time"
Causa: Script demorou mais de 6 minutos
Solução: Já tratado na v3: janela padrão de 7 dias (CONFIG.diasBusca), retry curto e orçamento de tempo de 300s (CONFIG.orcamentoSegundos). Se ainda ocorrer, reduza diasBusca.

🎨 Padrões de Design
Emojis usados no menu
🏛️ Licitações (menu principal)
🔄 Atualizar Tudo
🏙️ Atualizar cidade específica
🔌 Testar conexão PNCP
⏰ Ativar/Desativar atualização diária
📊 Dashboard
Cores institucionais
Primária: #1a56db (azul)
Sucesso: #059669 (verde)
Alerta: #d97706 (amarelo)
Erro: #dc2626 (vermelho)
📞 Contato
GitHub: https://github.com/xzinho/monitor-licitacoes-baixada-santista
Autor: xzinho
