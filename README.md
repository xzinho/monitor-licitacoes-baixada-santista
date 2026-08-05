# 🏛️ Monitor de Licitações - Baixada Santista

Sistema de monitoramento de licitações públicas das prefeituras da Baixada Santista, utilizando a API oficial do PNCP (Portal Nacional de Contratações Públicas).

## 📋 Sobre o Projeto

Projeto piloto que monitora automaticamente as licitações de 5 cidades:
- 🏖️ Praia Grande
- ⚓ Santos  
- 🌊 São Vicente
- 🏭 Cubatão
- 🐟 Mongaguá

## 🎯 Modalidades Monitoradas

- Pregão Eletrônico
- Concorrência
- Dispensa de Licitação
- Inexigibilidade

## 🛠️ Tecnologias

**Fase 1 - MVP (Atual):**
- Google Sheets
- Google Apps Script
- API PNCP

**Fase 2 - Planejada:**
- Frontend: React
- Backend: Node.js
- Banco de dados: MongoDB
- App Mobile: React Native

## 📊 Funcionalidades

- ✅ Puxa licitações automaticamente do PNCP
- ✅ Dashboard consolidado com totais por cidade
- ✅ Filtro por modalidade
- ✅ Formatação profissional (moeda, datas)
- ✅ Cores por situação
- ✅ Atualização automática diária (menu 🏛️ Licitações > ⏰ Ativar atualização diária)
- ✅ **E-mail com licitações novas** — separadas por cidade e em blocos de até 20 itens, sem repetir o que já foi enviado
- ✅ Menu de diagnóstico (🔌 Testar conexão PNCP) e teste de e-mail (📧 Testar envio de e-mail)

## 🚀 Como Usar

1. Acesse a planilha do Google Sheets
2. Menu **🏛️ Licitações** > **🔄 Atualizar Tudo**
3. Aguarde a busca no PNCP (~2 minutos)
4. Confira o Dashboard e cada aba de cidade
5. **Ative o e-mail de novidades:** menu **🏛️ Licitações** > **📧 Testar envio de e-mail** (confirmação)
6. **Ative a atualização diária:** menu **🏛️ Licitações** > **⏰ Ativar atualização diária (8h)**
   - Na 1ª execução com dados, você recebe um e-mail de ativação e o histórico **não** é enviado;
   - A partir daí, cada atualização envia só as licitações **novas**, separadas por cidade (blocos de até 20).

## 💰 Custo

**R$ 0,00** - 100% gratuito (Google Sheets + API pública do PNCP)

## 📅 Roadmap

- [x] MVP em Google Sheets
- [x] Integração com API PNCP
- [x] Dashboard consolidado
- [x] Atualização automática diária
- [x] Alertas por e-mail (novidades, separados por cidade)
- [ ] Filtro por palavra-chave
- [ ] Migração para site (React)
- [ ] App mobile
- [ ] Sistema de assinatura

## 📜 Licença

MIT License

## 👤 Autor

[Moacyr Arantes]
