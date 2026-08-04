/**
 * ==========================================================
 * MONITOR DE LICITAÇÕES - PNCP
 * ==========================================================
 * Sistema que busca licitações públicas de 5 cidades da 
 * Baixada Santista via API oficial do PNCP.
 * 
 * COMO INSTALAR:
 * 1. Abra sua planilha do Google Sheets
 * 2. Crie 6 abas: 📊 Dashboard, Praia Grande, Santos, 
 *    São Vicente, Cubatão, Mongaguá
 * 3. Vá em Extensões > Apps Script
 * 4. Apague o código padrão e cole este
 * 5. Salve (Ctrl+S)
 * 6. Feche e reabra a planilha
 * 7. Menu "🏛️ Licitações" aparecerá no topo
 * 
 * VERSÃO: 2.0
 * AUTOR: [Seu Nome]
 * ==========================================================
 */

const CONFIG = {
  cidades: [
    { nome: "Praia Grande", aba: "Praia Grande", ibge: "3541000" },
    { nome: "Santos", aba: "Santos", ibge: "3548500" },
    { nome: "São Vicente", aba: "São Vicente", ibge: "3551009" },
    { nome: "Cubatão", aba: "Cubatão", ibge: "3513504" },
    { nome: "Mongaguá", aba: "Mongaguá", ibge: "3531100" }
  ],
  // 6: Pregão, 4: Concorrência, 8: Dispensa, 9: Inexigibilidade
  modalidades: [6, 4, 8, 9],
  uf: "SP"
};

/**
 * Cria o menu personalizado quando a planilha é aberta
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🏛️ Licitações')
      .addItem('🔄 Atualizar Tudo', 'atualizarTodasLicitacoes')
      .addSeparator()
      .addItem('🏙️ Atualizar Praia Grande', 'atualizarPraiaGrande')
      .addItem('🏙️ Atualizar Santos', 'atualizarSantos')
      .addItem('🏙️ Atualizar São Vicente', 'atualizarSaoVicente')
      .addItem('🏙️ Atualizar Cubatão', 'atualizarCubatao')
      .addItem('🏙️ Atualizar Mongaguá', 'atualizarMongagua')
      .addToUi();
}

// Funções individuais para o menu
function atualizarPraiaGrande() { atualizarCidade("Praia Grande"); atualizarDashboard(); SpreadsheetApp.getActiveSpreadsheet().toast("Praia Grande atualizada!", "Sucesso"); }
function atualizarSantos() { atualizarCidade("Santos"); atualizarDashboard(); SpreadsheetApp.getActiveSpreadsheet().toast("Santos atualizada!", "Sucesso"); }
function atualizarSaoVicente() { atualizarCidade("São Vicente"); atualizarDashboard(); SpreadsheetApp.getActiveSpreadsheet().toast("São Vicente atualizada!", "Sucesso"); }
function atualizarCubatao() { atualizarCidade("Cubatão"); atualizarDashboard(); SpreadsheetApp.getActiveSpreadsheet().toast("Cubatão atualizada!", "Sucesso"); }
function atualizarMongagua() { atualizarCidade("Mongaguá"); atualizarDashboard(); SpreadsheetApp.getActiveSpreadsheet().toast("Mongaguá atualizada!", "Sucesso"); }

/**
 * Função Principal: Atualiza todas as cidades e o dashboard
 */
function atualizarTodasLicitacoes() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast("Iniciando busca no PNCP. Isso pode levar alguns minutos...", "Aguarde");

  for (let i = 0; i < CONFIG.cidades.length; i++) {
    atualizarCidade(CONFIG.cidades[i].nome);
  }

  atualizarDashboard();
  ss.toast("Todas as licitações foram atualizadas com sucesso!", "Concluído");
}

/**
 * Busca os dados na API do PNCP com tratamento de Erro 429
 */
function buscarDadosPNCP(ibge, modalidade, dataInicial, dataFinal) {
  let url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&codigoModalidadeContratacao=${modalidade}&uf=${CONFIG.uf}&codigoMunicipioIbge=${ibge}&pagina=1&tamanhoPagina=50`;

  let options = {
    'method': 'get',
    'headers': { 'Accept': 'application/json' },
    'muteHttpExceptions': true
  };

  let maxTentativas = 3;
  for (let i = 0; i < maxTentativas; i++) {
    let response = UrlFetchApp.fetch(url, options);
    let code = response.getResponseCode();

    if (code === 200) {
      let json = JSON.parse(response.getContentText());
      return json.data || [];
    } else if (code === 429) {
      console.warn(`Erro 429 (Limite). Aguardando 30s... Tentativa ${i + 1}`);
      Utilities.sleep(30000);
    } else {
      console.error(`Erro ${code} na API: ${response.getContentText()}`);
      return [];
    }
  }
  return [];
}

/**
 * Atualiza a aba de uma cidade específica
 */
function atualizarCidade(nomeCidade) {
  let cidadeConfig = CONFIG.cidades.find(c => c.nome === nomeCidade);
  if (!cidadeConfig) return;

  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(cidadeConfig.aba);

  if (!sheet) {
    sheet = ss.insertSheet(cidadeConfig.aba);
  }

  let hoje = new Date();
  let trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(hoje.getDate() - 30);

  let dataFinal = formatarDataPNCP(hoje);
  let dataInicial = formatarDataPNCP(trintaDiasAtras);

  let todosDados = [];

  for (let i = 0; i < CONFIG.modalidades.length; i++) {
    let modalidade = CONFIG.modalidades[i];
    let dados = buscarDadosPNCP(cidadeConfig.ibge, modalidade, dataInicial, dataFinal);

    dados.forEach(item => {
      todosDados.push({
        numeroCompra: item.numeroCompra || "-",
        modalidadeNome: item.modalidadeNome || "-",
        orgao: item.orgaoEntidade ? item.orgaoEntidade.razaoSocial : "-",
        objeto: item.objetoCompra || "-",
        valor: item.valorTotalEstimado || 0,
        dataPubRaw: item.dataPublicacaoPncp || "",
        dataPub: item.dataPublicacaoPncp ? formatarDataBr(item.dataPublicacaoPncp) : "-",
        dataAbertura: item.dataAberturaProposta ? formatarDataBrCompleta(item.dataAberturaProposta) : "-",
        dataEncerramento: item.dataEncerramentoProposta ? formatarDataBrCompleta(item.dataEncerramentoProposta) : "-",
        situacao: item.situacaoCompraNome || "-",
        link: item.linkSistemaOrigem || "-"
      });
    });

    Utilities.sleep(2000);
  }

  todosDados.sort((a, b) => new Date(b.dataPubRaw) - new Date(a.dataPubRaw));

  let linhasPlanilha = todosDados.map(item => [
    item.numeroCompra, item.modalidadeNome, item.orgao, item.objeto,
    item.valor, item.dataPub, item.dataAbertura, item.dataEncerramento, item.situacao, item.link
  ]);

  sheet.clear();
  sheet.getRange("A1").setValue(`RESULTADO DA BUSCA - ${nomeCidade.toUpperCase()}/SP`)
    .setFontSize(14).setFontWeight("bold").setFontColor("#1a56db");

  let agora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
  sheet.getRange("A2").setValue(`Última atualização: ${agora}`);

  let cabecalho = ["Nº Compra", "Modalidade", "Órgão", "Objeto", "Valor Estimado", "Data Publicação", "Início Propostas", "Fim Propostas", "Situação", "Link"];
  sheet.getRange("A4:J4").setValues([cabecalho])
    .setBackground("#1a56db").setFontColor("white").setFontWeight("bold");

  sheet.setFrozenRows(4);

  if (linhasPlanilha.length > 0) {
    sheet.getRange(5, 1, linhasPlanilha.length, 10).setValues(linhasPlanilha);
    sheet.getRange(5, 5, linhasPlanilha.length, 1).setNumberFormat('"R$"#,##0.00');

    let rangeSituacao = sheet.getRange(5, 9, linhasPlanilha.length, 1).getValues();
    let colorMatrix = [];

    for (let s = 0; s < rangeSituacao.length; s++) {
      let sit = rangeSituacao[s][0].toLowerCase();
      let cor = "#ffffff";

      if (sit.includes("divulgada")) cor = "#d9ead3";
      else if (sit.includes("proposta")) cor = "#fff2cc";
      else if (sit.includes("encerrada") || sit.includes("suspensa")) cor = "#f3f3f3";

      colorMatrix.push([cor, cor, cor, cor, cor, cor, cor, cor, cor, cor]);
    }
    sheet.getRange(5, 1, linhasPlanilha.length, 10).setBackgrounds(colorMatrix);

  } else {
    sheet.getRange("A5").setValue("Nenhuma licitação encontrada no período.");
  }

  sheet.autoResizeColumns(1, 10);
  sheet.setColumnWidth(4, 450);
  sheet.getRange("D5:D").setWrap(true);
}

/**
 * Gera e atualiza a aba de Dashboard
 */
function atualizarDashboard() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let abaDash = ss.getSheetByName("📊 Dashboard");
  if (!abaDash) {
    abaDash = ss.insertSheet("📊 Dashboard", 0);
  }

  abaDash.clear();

  abaDash.getRange("A1").setValue("MONITOR DE LICITAÇÕES - BAIXADA SANTISTA")
    .setFontSize(16).setFontWeight("bold").setFontColor("#1a56db");

  let agora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
  abaDash.getRange("A2").setValue(`Última atualização: ${agora}`);

  let cabecalho = ["Cidade", "Total de Licitações", "Valor Total (R$)", "Pregões", "Concorrências", "Dispensas", "Inexigibilidades"];
  abaDash.getRange("A4:G4").setValues([cabecalho])
    .setBackground("#1a56db").setFontColor("white").setFontWeight("bold");

  let linhasDash = [];
  let totais = { licitacoes: 0, valor: 0, pregoes: 0, conc: 0, disp: 0, inex: 0 };

  for (let i = 0; i < CONFIG.cidades.length; i++) {
    let cidade = CONFIG.cidades[i].nome;
    let sheet = ss.getSheetByName(CONFIG.cidades[i].aba);

    let c_licitacoes = 0, c_valor = 0, c_pregoes = 0, c_conc = 0, c_disp = 0, c_inex = 0;

    if (sheet && sheet.getLastRow() >= 5) {
      let dados = sheet.getRange(5, 1, sheet.getLastRow() - 4, 10).getValues();
      if (dados[0][0] !== "Nenhuma licitação encontrada no período.") {
        c_licitacoes = dados.length;
        for (let d = 0; d < dados.length; d++) {
          c_valor += Number(dados[d][4]) || 0;
          let mod = String(dados[d][1]).toLowerCase();
          if (mod.includes("pregão")) c_pregoes++;
          else if (mod.includes("concorrência")) c_conc++;
          else if (mod.includes("dispensa")) c_disp++;
          else if (mod.includes("inexigibilidade")) c_inex++;
        }
      }
    }

    linhasDash.push([cidade, c_licitacoes, c_valor, c_pregoes, c_conc, c_disp, c_inex]);

    totais.licitacoes += c_licitacoes; totais.valor += c_valor; totais.pregoes += c_pregoes;
    totais.conc += c_conc; totais.disp += c_disp; totais.inex += c_inex;
  }

  linhasDash.push(["TOTAL GERAL", totais.licitacoes, totais.valor, totais.pregoes, totais.conc, totais.disp, totais.inex]);

  abaDash.getRange(5, 1, linhasDash.length, 7).setValues(linhasDash);

  abaDash.getRange(5, 3, linhasDash.length, 1).setNumberFormat('"R$"#,##0.00');
  abaDash.getRange(4 + linhasDash.length, 1, 1, 7).setFontWeight("bold").setBackground("#f3f3f3");
  abaDash.autoResizeColumns(1, 7);
}

// ========== FUNÇÕES AUXILIARES DE DATA ==========

function formatarDataPNCP(data) {
  let d = new Date(data);
  let mes = '' + (d.getMonth() + 1);
  let dia = '' + d.getDate();
  if (mes.length < 2) mes = '0' + mes;
  if (dia.length < 2) dia = '0' + dia;
  return [d.getFullYear(), mes, dia].join('');
}

function formatarDataBr(dataString) {
  if (!dataString) return "";
  let d = new Date(dataString);
  let mes = '' + (d.getMonth() + 1);
  let dia = '' + d.getDate();
  if (mes.length < 2) mes = '0' + mes;
  if (dia.length < 2) dia = '0' + dia;
  return [dia, mes, d.getFullYear()].join('/');
}

function formatarDataBrCompleta(dataString) {
  if (!dataString) return "";
  let d = new Date(dataString);
  let mes = '' + (d.getMonth() + 1);
  let dia = '' + d.getDate();
  let hora = '' + d.getHours();
  let min = '' + d.getMinutes();
  if (mes.length < 2) mes = '0' + mes;
  if (dia.length < 2) dia = '0' + dia;
  if (hora.length < 2) hora = '0' + hora;
  if (min.length < 2) min = '0' + min;
  return `${dia}/${mes}/${d.getFullYear()} ${hora}:${min}`;
}
