# 📖 Histórico de Decisões e Aprendizados

> Este arquivo documenta toda a jornada do projeto: decisões tomadas, problemas resolvidos e aprendizados obtidos. Serve como "memória externa" para retomar o projeto em qualquer momento.

---

## 🎯 Como Usar Este Documento

**Ao começar uma nova conversa com IA (ChatGPT, Claude, Gemini):**

Cole este prompt:

> "Olá! Estou desenvolvendo um sistema de monitoramento de licitações públicas. Todo o projeto está documentado aqui: https://github.com/xzinho/monitor-licitacoes-baixada-santista
> 
> Por favor, leia os 3 arquivos principais:
> - README.md (visão geral)
> - DOCUMENTACAO.md (detalhes técnicos)
> - HISTORICO.md (decisões e aprendizados)
> 
> Depois me ajude a [descrever o que quer fazer]."

---

## 📅 Linha do Tempo do Projeto

### 🚀 Início do Projeto

**Ideia original:** Criar sistema que puxa licitações da Prefeitura de Praia Grande via API do PNCP para futuramente vender como assinatura mensal.

**Requisitos iniciais:**
- Começar com Praia Grande
- Depois expandir para outras prefeituras
- Custo zero para MVP
- Sem conhecimento de programação
- Ter passo a passo detalhado
- Uma pergunta por vez (não entregar tudo de uma vez)

---

## 🤔 Decisões Importantes

### Decisão 1: Ferramenta de Desenvolvimento
**Opções avaliadas:**
- ❌ React + Node.js (muito complexo para iniciante)
- ❌ Bubble/FlutterFlow (curva de aprendizado)
- ✅ **Google Sheets + Apps Script** (escolhido!)

**Motivo:** Não requer programação prévia, é gratuito, e os dados já ficam organizados para futura migração.

---

### Decisão 2: Fonte de Dados
**Opções avaliadas:**
- ❌ Site da Prefeitura de Praia Grande (protegido por CloudFlare, bloqueia bots)
- ❌ Compras.gov.br (API descontinuada)
- ✅ **PNCP - Portal Nacional de Contratações Públicas** (escolhido!)

**Motivo:** 
- API oficial e liberada
- Padronizado (mesmo formato para todas as prefeituras do Brasil)
- Lei 14.133/2021 obriga todas as prefeituras a publicarem lá
- Escalabilidade: mesmo código serve para qualquer cidade

---

### Decisão 3: Cidades Iniciais
**Escolhidas:**
1. Praia Grande (foco inicial)
2. Santos
3. São Vicente
4. Cubatão
5. Mongaguá

**Motivo:** Toda a região da Baixada Santista, permite testar em múltiplas cidades com perfis diferentes (turística, portuária, industrial).

---

### Decisão 4: Modalidades a Monitorar
**Escolhidas:**
- Pregão Eletrônico (código 6)
- Concorrência (código 4)
- Dispensa de Licitação (código 8)
- Inexigibilidade (código 9)

**Motivo:** São as 4 modalidades mais comuns e relevantes comercialmente.

---

### Decisão 5: Documentação no GitHub
**Motivo:** 
- Portfólio profissional
- Não perder o trabalho
- Facilitar continuidade com IA
- Padrão do mercado

---

## 🐛 Problemas Resolvidos

### Problema 1: Erro 503 (Service Unavailable)
**Data:** Início do projeto
**Sintoma:** API do PNCP retornando erro 503
**Causa:** Instabilidade do servidor do governo
**Solução:** Aguardar alguns minutos e tentar novamente
**Aprendizado:** APIs governamentais podem ter instabilidade; implementar retry automático

---

### Problema 2: Erro "Exceeded maximum execution time"
**Sintoma:** Script travava após 6 minutos
**Causa:** Buscas muito lentas somadas
**Solução:** Reduzir período de busca (7 dias em vez de 30)
**Aprendizado:** Apps Script tem limite de 6 minutos por execução

---

### Problema 3: Endpoint `/api/search/` bloqueado
**Sintoma:** "Address unavailable"
**Causa:** Esse endpoint é usado só pelo site interno do PNCP
**Solução:** Usar `/api/consulta/v1/contratacoes/publicacao` (API oficial pública)
**Aprendizado:** Sempre verificar qual endpoint está documentado oficialmente

---

### Problema 4: Erro 429 (Too Many Requests)
**Sintoma:** API bloqueando após várias tentativas
**Causa:** Rate limit do PNCP (~60 req/hora por IP)
**Solução:** 
- Aguardar 15-30 minutos
- Adicionar `Utilities.sleep(2000)` entre requisições
- Implementar retry com espera exponencial
**Aprendizado:** Sempre respeitar rate limits de APIs públicas

---

### Problema 5: Erro 400 (Bad Request)
**Sintoma:** "must be greater than or equal to 10"
**Causa:** Parâmetro `tamanhoPagina=5` (mínimo aceito é 10)
**Solução:** Sempre usar `tamanhoPagina >= 10`
**Aprendizado:** Ler mensagens de erro atentamente — elas dizem exatamente o que está errado

---

### Problema 6: Datas erradas na planilha
**Sintoma:** Data de abertura mostrando a mesma data de publicação
**Causa:** Gemini gerou código usando nome de campo inexistente (`dataFimRecebimentoPropostas`)
**Solução:** Rodar script de diagnóstico que listou TODOS os campos reais da API
**Descoberta:** O campo correto é `dataEncerramentoProposta`
**Aprendizado:** Sempre validar nomes de campos consultando a resposta real da API

---

### Problema 7: Planilha "parou de funcionar" (agosto/2026)
**Data:** 05/08/2026
**Sintoma:** Abas das cidades ficavam vazias ou com "Nenhuma licitação encontrada no período."; dashboard zerado; "Atualizar Tudo" demorava e dava erro.
**Investigação (o que foi feito):**
- A API oficial do PNCP (`/api/consulta/v1/contratacoes/publicacao`) foi testada ao vivo: o endpoint e os campos continuam os mesmos, MAS a API está instável — em testes do mesmo dia, São Vicente respondeu 502 e uma consulta de Dispensa respondeu 500 (há relatos públicos de indisponibilidade em 2026).
- O código antigo só tratava erros 200 e 429; qualquer 502/503/504/timeout virava retorno vazio.
- Ao receber retorno vazio, o script APAGAVA a aba inteira e escrevia "Nenhuma licitação encontrada" — destruindo os dados bons anteriores no primeiro soluço da API.
- A janela de 30 dias + retry de 30s por chamada estourava o limite de 6 minutos do Apps Script (problema antigo que tinha sido resolvido com 7 dias, mas o código tinha voltado para 30).
- O script não fazia paginação: só buscava a página 1 (50 itens), perdendo registros em modalidades de alto volume (ex.: dispensa).

**Solução (versão 3.0):**
- Retry automático para 429/5xx/timeout, com espera curta e limitada (não trava mais a execução);
- **Dados anteriores preservados** quando a busca falha — aviso claro na linha 3 da aba;
- Paginação automática (até `CONFIG.maxPaginas` = 5 páginas por modalidade);
- Janela padrão de 7 dias (`CONFIG.diasBusca`) + orçamento de tempo de 300s (`CONFIG.orcamentoSegundos`) — nunca mais estoura os 6 min;
- Menu novo: "🔌 Testar conexão PNCP" (diagnóstico por cidade) e "⏰ Ativar atualização diária (8h)" (gatilho automático);
- Lógica validada com 27 testes simulando API ok, 502, 429, API fora do ar, vazio real e paginação — todos passando.

**Aprendizado:** Nunca apagar dados bons por causa de erro transitório da fonte; sempre distinguir "sem resultados" de "falha na busca"; testar o script contra os modos de falha reais da API, não só o caminho feliz.

---

## 💡 Aprendizados Técnicos

### Sobre a API do PNCP
- ✅ Endpoint oficial: `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao`
- ✅ Formato de data: `AAAAMMDD` (ex: 20260101)
- ✅ `tamanhoPagina`: mínimo 10, máximo 500
- ✅ Rate limit: ~60 requisições/hora por IP
- ✅ Delay recomendado: 2 segundos entre chamadas
- ✅ Campo de fim de propostas: `dataEncerramentoProposta` (NÃO `dataFimRecebimentoPropostas`)

### Sobre Google Apps Script
- ✅ Limite de 6 minutos por execução
- ✅ Precisa autorizar acesso na primeira vez
- ✅ Menu `onOpen()` só aparece após reabrir a planilha
- ✅ `UrlFetchApp.fetch()` para chamadas HTTP
- ✅ `Utilities.sleep(ms)` para pausas

### Sobre Google Sheets
- ✅ Nomes das abas são case-sensitive (importam acentos e emojis)
- ✅ `sheet.clear()` limpa tudo antes de repreencher
- ✅ Formatação em batch é mais rápida que célula por célula
- ✅ Congelar cabeçalho com `setFrozenRows()`

---

## 🎓 Aprendizados Gerais

1. **Sempre validar dados reais:** Não confiar em nomes de campos "presumidos"
2. **Rate limits importam:** APIs públicas têm limites, respeitar sempre
3. **Documentar decisões:** Facilita muito voltar ao projeto depois
4. **Testar em pequeno:** Sempre começar com 1 cidade antes de rodar 5
5. **Backup em nuvem:** GitHub salvou nosso trabalho múltiplas vezes
6. **IA precisa de contexto:** Documentação clara = respostas melhores

---

## 🔮 Próximas Ideias

### Curto Prazo (Próximos Passos)
- [x] Testar todas as 5 cidades juntas (validado por simulação; testar na planilha real)
- [x] Configurar gatilho automático (todo dia às 8h) — menu 🏛️ Licitações > ⏰ Ativar atualização diária
- [ ] Adicionar coluna com link direto para o edital no PNCP
- [ ] Formatar linhas alternadas (zebra) para melhor leitura

### Médio Prazo (1-3 meses)
- [ ] Sistema de alertas por e-mail
- [ ] Filtro por palavra-chave
- [ ] Filtro por valor mínimo/máximo
- [ ] Adicionar 10 novas prefeituras
- [ ] Aba "Meus Favoritos"
- [ ] Exportar para PDF

### Longo Prazo (3-12 meses)
- [ ] Migrar para site web (React)
- [ ] Backend Node.js
- [ ] Sistema de assinatura
- [ ] Dashboard visual com gráficos
- [ ] App mobile (React Native)
- [ ] IA para categorizar objetos automaticamente
- [ ] Análise de padrões (qual empresa ganha mais licitações?)

---

## 🤝 Créditos

**Idealizador:** xzinho
**Assistência técnica:** Claude AI (Anthropic)
**Fonte de dados:** PNCP - Governo Federal do Brasil
**Ferramentas:** Google Sheets, Google Apps Script, GitHub

---

## 📞 Contato e Continuidade

**Repositório:** https://github.com/xzinho/monitor-licitacoes-baixada-santista

**Para retomar o projeto em qualquer momento:**
1. Acesse o repositório
2. Leia README.md → DOCUMENTACAO.md → HISTORICO.md
3. Copie os links dos arquivos
4. Cole em uma nova conversa com IA
5. Peça ajuda para o próximo passo

---

## 📊 Métricas do Projeto

- **Data de início:** [colocar data]
- **Linhas de código:** ~670 (v3.0)
- **Cidades monitoradas:** 5
- **Modalidades:** 4
- **Custo:** R$ 0,00
- **Status:** MVP funcional (v3.0 — estabilizado contra instabilidade da API) ✅

---

*Última atualização: [colocar data]*
