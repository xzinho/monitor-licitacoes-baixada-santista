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
 * COMO RESOLVER "A PLANILHA PAROU DE FUNCIONAR":
 * Se as abas ficam vazias ou com "Nenhuma licitação":
 *   1. Rode o menu 🏛️ Licitações > 🔌 Testar conexão PNCP
 *      para ver se a API do governo está respondendo;
 *   2. Se a API estiver instável (502/503/504/429), aguarde
 *      alguns minutos e rode "🔄 Atualizar Tudo" de novo;
 *   3. Diferente da versão antiga, este script NÃO apaga os
 *      dados anteriores quando a busca falha — ele mantém a
 *      última versão boa e escreve um aviso na linha 3.
 * 
 * VERSÃO: 3.0 (correção de estabilidade)
 * MUDANÇAS DA V3:
 *   - Retry automático para 429/5xx/timeout (com espera limitada)
 *   - Dados anteriores NÃO são apagados quando a API falha
 *   - Paginação automática (captura TODOS os resultados, não só pág. 1)
 *   - Janela de busca padrão de 7 dias (evita timeout de 6 min)
 *   - Orçamento de tempo para nunca estourar o limite de execução
 *   - Avisos claros na linha 3 de cada aba quando algo falha
 *   - Gatilho automático diário (menu) + teste de conexão
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
  uf: "SP",
  // ⚙️ AJUSTES (mexa com cuidado):
  diasBusca: 7,                 // janela de busca em dias. 7 evita estourar os 6 min do Apps Script
  tamanhoPagina: 50,            // registros por página (a API aceita de 10 a 500)
  maxPaginas: 5,                // máximo de páginas por modalidade (50 * 5 = 250 registros)
  delayEntreRequisicoes: 2000,  // pausa em ms entre chamadas (rate limit ~60 req/h)
  orcamentoSegundos: 300        // orçamento total por execução (limite real: 360s p/ conta gratuita)
};

/** Nome amigável da modalidade (para os avisos) */
function nomeModalidade(codigo) {
  const nomes = { 4: "Concorrência", 6: "Pregão", 8: "Dispensa de Licitação", 9: "Inexigibilidade" };
  return nomes[codigo] || ("Modalidade " + codigo);
}

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
      .addSeparator()
      .addItem('🔌 Testar conexão PNCP', 'testarConexaoPNCP')
      .addSeparator()
      .addItem('⏰ Ativar atualização diária (8h)', 'criarGatilhoDiario')
      .addItem('⏰ Desativar atualização automática', 'removerGatilhoDiario')
      .addToUi();
}

// ========== ACESSO À PLANILHA ==========

/**
 * Retorna a planilha ativa; quando chamado por um gatilho automático
 * (sem planilha "ativa"), abre pelo ID salvo nas propriedades do script.
 */
function obterPlanilha() {
  let ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    ss = null;
  }
  if (ss) {
    try {
      PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", ss.getId());
    } catch (e) { /* sem permissão para properties ainda? ignora */ }
    return ss;
  }
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {
      throw new Error("Não foi possível abrir a planilha pelo ID salvo: " + e.message);
    }
  }
  throw new Error("Nenhuma planilha ativa e nenhum ID salvo. Execute o menu uma vez manualmente antes de usar o gatilho automático.");
}

// ========== CONTROLE DE TEMPO (evita timeout de 6 min) ==========

function obterEstadoBusca() {
  return {
    fim: Date.now() + CONFIG.orcamentoSegundos * 1000, // prazo final
    avisos: [],            // avisos acumulados da execução
    cidadesOk: 0,
    cidadesComFalha: 0
  };
}

function tempoEsgotado(estado) {
  return Date.now() >= estado.fim;
}

/** Dorme no máximo `segundos`, mas nunca além do prazo final. */
function esperar(segundos, estado) {
  const ms = Math.min(segundos * 1000, Math.max(0, estado.fim - Date.now()));
  if (ms > 0) Utilities.sleep(Math.round(ms));
}

// ========== FUNÇÕES DO MENU ==========

/** Função Principal: Atualiza todas as cidades e o dashboard */
function atualizarTodasLicitacoes() {
  const estado = obterEstadoBusca();
  let ss;
  try {
    ss = obterPlanilha();
  } catch (e) {
    console.error("atualizarTodasLicitacoes:", e);
    return;
  }
  ss.toast("Iniciando busca no PNCP (janela de " + CONFIG.diasBusca + " dias). Pode levar alguns minutos...", "Aguarde");

  for (let i = 0; i < CONFIG.cidades.length; i++) {
    const cidade = CONFIG.cidades[i];
    if (tempoEsgotado(estado)) {
      estado.avisos.push("Tempo de execução esgotado: cidades a partir de " + cidade.nome + " não foram atualizadas. Rode novamente ou reduza CONFIG.diasBusca.");
      break;
    }
    try {
      const res = atualizarCidade(cidade.nome, estado);
      if (res.falhas.length === 0) estado.cidadesOk++;
      else estado.cidadesComFalha++;
    } catch (e) {
      estado.cidadesComFalha++;
      estado.avisos.push(cidade.nome + ": erro inesperado - " + e.message);
      console.error("Erro ao atualizar " + cidade.nome, e);
    }
  }

  try {
    atualizarDashboard(estado);
  } catch (e) {
    console.error("Erro ao atualizar dashboard", e);
    estado.avisos.push("Dashboard: erro inesperado - " + e.message);
  }

  let msg = estado.cidadesOk + " cidades atualizadas";
  if (estado.cidadesComFalha > 0) msg += ", " + estado.cidadesComFalha + " com avisos (ver linha 3 das abas e o rodapé do dashboard)";
  ss.toast("Concluído: " + msg, "Resultado");
}

/** Funções individuais para o menu */
function atualizarPraiaGrande() { atualizarCidadeViaMenu("Praia Grande"); }
function atualizarSantos() { atualizarCidadeViaMenu("Santos"); }
function atualizarSaoVicente() { atualizarCidadeViaMenu("São Vicente"); }
function atualizarCubatao() { atualizarCidadeViaMenu("Cubatão"); }
function atualizarMongagua() { atualizarCidadeViaMenu("Mongaguá"); }

function atualizarCidadeViaMenu(nomeCidade) {
  const estado = obterEstadoBusca();
  let ss;
  try {
    ss = obterPlanilha();
  } catch (e) {
    console.error(e);
    return;
  }
  try {
    const res = atualizarCidade(nomeCidade, estado);
    atualizarDashboard(estado);
    if (res.falhas.length === 0) {
      ss.toast(nomeCidade + " atualizada!", "Sucesso");
    } else {
      ss.toast(nomeCidade + ": " + res.falhas.length + " aviso(s) na busca. Ver linha 3 da aba.", "Atenção");
    }
  } catch (e) {
    ss.toast("Erro ao atualizar " + nomeCidade + ": " + e.message, "Erro");
    console.error("Erro ao atualizar " + nomeCidade, e);
  }
}

// ========== BUSCA NA API DO PNCP ==========

/**
 * Busca uma modalidade com retry automático e paginação.
 * Retorna { sucesso: true, dados: [...] } ou { sucesso: false, erro: "..." }.
 * Avisos parciais são acumulados em estado.avisos.
 */
function buscarModalidadePNCP(ibge, modalidade, dataInicial, dataFinal, estado) {
  let todos = [];
  let pagina = 1;
  const maxTentativas = 3;

  while (pagina <= CONFIG.maxPaginas) {
    if (tempoEsgotado(estado)) {
      estado.avisos.push(nomeModalidade(modalidade) + ": tempo esgotado durante a paginação (página " + pagina + "). Resultado parcial (" + todos.length + " registros).");
      break;
    }

    const url = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao" +
      "?dataInicial=" + dataInicial +
      "&dataFinal=" + dataFinal +
      "&codigoModalidadeContratacao=" + modalidade +
      "&uf=" + CONFIG.uf +
      "&codigoMunicipioIbge=" + ibge +
      "&pagina=" + pagina +
      "&tamanhoPagina=" + CONFIG.tamanhoPagina;

    const options = {
      'method': 'get',
      'headers': { 'Accept': 'application/json' },
      'muteHttpExceptions': true
    };

    let resposta = null;
    let ultimoErro = "";

    // Retry para 429 (limite), 5xx (instabilidade) e falhas de rede
    for (let tentativa = 1; tentativa <= maxTentativas && resposta === null; tentativa++) {
      if (tempoEsgotado(estado)) {
        ultimoErro = "tempo esgotado";
        break;
      }
      try {
        const r = UrlFetchApp.fetch(url, options);
        const code = r.getResponseCode();

        if (code === 200) {
          resposta = JSON.parse(r.getContentText());
        } else if (code === 429) {
          ultimoErro = "HTTP 429 (limite de requisições do PNCP)";
          esperar(15, estado);
        } else {
          ultimoErro = "HTTP " + code;
          esperar(5, estado);
        }
      } catch (e) {
        ultimoErro = "Falha de rede/timeout: " + e.message;
        esperar(5, estado);
      }
    }

    if (resposta === null) {
      if (pagina === 1) {
        // Falha total: nenhum dado desta modalidade
        estado.avisos.push(nomeModalidade(modalidade) + ": " + ultimoErro + ". Sem dados desta modalidade.");
        return { sucesso: false, erro: ultimoErro };
      }
      // Falha parcial: usa o que já foi obtido
      estado.avisos.push(nomeModalidade(modalidade) + ": " + ultimoErro + " ao buscar página " + pagina + ". Resultado parcial (" + todos.length + " registros).");
      break;
    }

    const data = resposta.data || [];
    todos = todos.concat(data);

    // Decide se há mais páginas
    let paginasRestantes;
    if (typeof resposta.paginasRestantes === "number") {
      paginasRestantes = resposta.paginasRestantes;
    } else if (typeof resposta.totalPaginas === "number") {
      paginasRestantes = Math.max(0, resposta.totalPaginas - pagina);
    } else {
      paginasRestantes = data.length >= CONFIG.tamanhoPagina ? 1 : 0; // heurística de segurança
    }

    if (paginasRestantes <= 0) break;
    pagina++;
    esperar(CONFIG.delayEntreRequisicoes / 1000, estado);
  }

  return { sucesso: true, dados: todos };
}

/** Converte um item do JSON da API no formato usado pela planilha */
function montarItem(item) {
  return {
    numeroCompra: item.numeroCompra || "-",
    modalidadeNome: item.modalidadeNome || "-",
    orgao: item.orgaoEntidade && item.orgaoEntidade.razaoSocial ? item.orgaoEntidade.razaoSocial : "-",
    objeto: item.objetoCompra || "-",
    valor: item.valorTotalEstimado || 0,
    dataPubRaw: item.dataPublicacaoPncp || "",
    dataPub: item.dataPublicacaoPncp ? formatarDataBr(item.dataPublicacaoPncp) : "-",
    dataAbertura: item.dataAberturaProposta ? formatarDataBrCompleta(item.dataAberturaProposta) : "-",
    dataEncerramento: item.dataEncerramentoProposta ? formatarDataBrCompleta(item.dataEncerramentoProposta) : "-",
    situacao: item.situacaoCompraNome || "-",
    link: item.linkSistemaOrigem || "-"
  };
}

// ========== ATUALIZAÇÃO DAS ABAS DE CIDADE ==========

/**
 * Atualiza a aba de uma cidade específica.
 * IMPORTANTE: se a busca falhar, os dados anteriores NÃO são apagados —
 * fica um aviso na linha 3 explicando o que aconteceu.
 * Retorna { cidade, total, falhas }.
 */
function atualizarCidade(nomeCidade, estado) {
  if (!estado) estado = obterEstadoBusca();

  const cidadeConfig = CONFIG.cidades.find(function (c) { return c.nome === nomeCidade; });
  if (!cidadeConfig) throw new Error("Cidade não configurada: " + nomeCidade);

  const ss = obterPlanilha();
  let sheet = ss.getSheetByName(cidadeConfig.aba);
  if (!sheet) sheet = ss.insertSheet(cidadeConfig.aba);

  const hoje = new Date();
  const inicio = new Date();
  inicio.setDate(hoje.getDate() - CONFIG.diasBusca);

  const dataFinal = formatarDataPNCP(hoje);
  const dataInicial = formatarDataPNCP(inicio);

  const todosDados = [];
  const falhas = [];

  for (let i = 0; i < CONFIG.modalidades.length; i++) {
    const modalidade = CONFIG.modalidades[i];

    if (tempoEsgotado(estado)) {
      falhas.push(nomeModalidade(modalidade) + ": tempo esgotado, modalidade não buscada");
      break;
    }

    const res = buscarModalidadePNCP(cidadeConfig.ibge, modalidade, dataInicial, dataFinal, estado);
    if (res.sucesso) {
      const dados = res.dados;
      for (let d = 0; d < dados.length; d++) {
        todosDados.push(montarItem(dados[d]));
      }
    } else {
      falhas.push(nomeModalidade(modalidade) + ": " + res.erro);
    }

    esperar(CONFIG.delayEntreRequisicoes / 1000, estado);
  }

  // Ordena por data de publicação (mais recente primeiro)
  todosDados.sort(function (a, b) {
    return (Number(new Date(b.dataPubRaw)) || 0) - (Number(new Date(a.dataPubRaw)) || 0);
  });

  const temDados = todosDados.length > 0;
  const agora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

  if (temDados) {
    // Busca OK (total ou parcial): reconstrói a aba com os dados novos
    sheet.clear();

    sheet.getRange("A1").setValue("RESULTADO DA BUSCA - " + nomeCidade.toUpperCase() + "/SP")
      .setFontSize(14).setFontWeight("bold").setFontColor("#1a56db");

    sheet.getRange("A2").setValue("Última atualização: " + agora);

    escreverAvisos(sheet, falhas);

    const cabecalho = ["Nº Compra", "Modalidade", "Órgão", "Objeto", "Valor Estimado", "Data Publicação", "Início Propostas", "Fim Propostas", "Situação", "Link"];
    sheet.getRange("A4:J4").setValues([cabecalho])
      .setBackground("#1a56db").setFontColor("white").setFontWeight("bold");

    sheet.setFrozenRows(4);

    const linhasPlanilha = todosDados.map(function (item) {
      return [item.numeroCompra, item.modalidadeNome, item.orgao, item.objeto,
        item.valor, item.dataPub, item.dataAbertura, item.dataEncerramento, item.situacao, item.link];
    });

    sheet.getRange(5, 1, linhasPlanilha.length, 10).setValues(linhasPlanilha);
    sheet.getRange(5, 5, linhasPlanilha.length, 1).setNumberFormat('"R$"#,##0.00');

    // Cores por situação
    const rangeSituacao = sheet.getRange(5, 9, linhasPlanilha.length, 1).getValues();
    const colorMatrix = [];
    for (let s = 0; s < rangeSituacao.length; s++) {
      const sit = String(rangeSituacao[s][0]).toLowerCase();
      let cor = "#ffffff";
      if (sit.indexOf("divulgada") !== -1) cor = "#d9ead3";
      else if (sit.indexOf("proposta") !== -1) cor = "#fff2cc";
      else if (sit.indexOf("encerrada") !== -1 || sit.indexOf("suspensa") !== -1) cor = "#f3f3f3";
      colorMatrix.push([cor, cor, cor, cor, cor, cor, cor, cor, cor, cor]);
    }
    sheet.getRange(5, 1, linhasPlanilha.length, 10).setBackgrounds(colorMatrix);

    sheet.autoResizeColumns(1, 10);
    sheet.setColumnWidth(4, 450);
    sheet.getRange("D5:D").setWrap(true);

  } else if (falhas.length > 0) {
    // Busca falhou por completo: NÃO apagar os dados anteriores.
    // Mantém a última versão boa e escreve um aviso claro.
    if (sheet.getLastRow() === 0) {
      sheet.getRange("A1").setValue("RESULTADO DA BUSCA - " + nomeCidade.toUpperCase() + "/SP")
        .setFontSize(14).setFontWeight("bold").setFontColor("#1a56db");
      sheet.getRange("A2").setValue("Última atualização: nunca (a busca falhou)");
      const cabecalho = ["Nº Compra", "Modalidade", "Órgão", "Objeto", "Valor Estimado", "Data Publicação", "Início Propostas", "Fim Propostas", "Situação", "Link"];
      sheet.getRange("A4:J4").setValues([cabecalho])
        .setBackground("#1a56db").setFontColor("white").setFontWeight("bold");
      sheet.getRange("A5").setValue("Não foi possível buscar os dados no PNCP.");
      sheet.setFrozenRows(4);
    }
    const avisoFalha = falhas.concat(["Exibindo dados da última atualização bem-sucedida."]);
    escreverAvisos(sheet, avisoFalha);

  } else {
    // API respondeu OK, mas não há licitações no período
    sheet.clear();
    sheet.getRange("A1").setValue("RESULTADO DA BUSCA - " + nomeCidade.toUpperCase() + "/SP")
      .setFontSize(14).setFontWeight("bold").setFontColor("#1a56db");
    sheet.getRange("A2").setValue("Última atualização: " + agora);
    const cabecalho = ["Nº Compra", "Modalidade", "Órgão", "Objeto", "Valor Estimado", "Data Publicação", "Início Propostas", "Fim Propostas", "Situação", "Link"];
    sheet.getRange("A4:J4").setValues([cabecalho])
      .setBackground("#1a56db").setFontColor("white").setFontWeight("bold");
    sheet.setFrozenRows(4);
    sheet.getRange("A5").setValue("Nenhuma licitação encontrada no período.");
  }

  return { cidade: nomeCidade, total: todosDados.length, falhas: falhas };
}

/** Escreve avisos na linha 3 da aba (ou limpa, se não houver avisos) */
function escreverAvisos(sheet, falhas) {
  const linha = sheet.getRange("A3");
  if (!falhas || falhas.length === 0) {
    linha.clearContent();
    return;
  }
  const texto = "⚠️ Atenção: " + falhas.join(" | ");
  linha.setValue(texto).setFontColor("#b45309").setFontWeight("bold");
}

// ========== DASHBOARD ==========

/**
 * Gera e atualiza a aba de Dashboard.
 * Aceita o `estado` da execução para listar avisos no rodapé (opcional).
 */
function atualizarDashboard(estado) {
  const ss = obterPlanilha();
  let abaDash = ss.getSheetByName("📊 Dashboard");
  if (!abaDash) {
    abaDash = ss.insertSheet("📊 Dashboard", 0);
  }

  abaDash.clear();

  abaDash.getRange("A1").setValue("MONITOR DE LICITAÇÕES - BAIXADA SANTISTA")
    .setFontSize(16).setFontWeight("bold").setFontColor("#1a56db");

  const agora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
  abaDash.getRange("A2").setValue("Última atualização: " + agora);

  const cabecalho = ["Cidade", "Total de Licitações", "Valor Total (R$)", "Pregões", "Concorrências", "Dispensas", "Inexigibilidades"];
  abaDash.getRange("A4:G4").setValues([cabecalho])
    .setBackground("#1a56db").setFontColor("white").setFontWeight("bold");

  const linhasDash = [];
  const totais = { licitacoes: 0, valor: 0, pregoes: 0, conc: 0, disp: 0, inex: 0 };

  for (let i = 0; i < CONFIG.cidades.length; i++) {
    const cidade = CONFIG.cidades[i].nome;
    const sheet = ss.getSheetByName(CONFIG.cidades[i].aba);

    let c_licitacoes = 0, c_valor = 0, c_pregoes = 0, c_conc = 0, c_disp = 0, c_inex = 0;

    if (sheet && sheet.getLastRow() >= 5) {
      const dados = sheet.getRange(5, 1, sheet.getLastRow() - 4, 10).getValues();
      if (dados[0][0] !== "Nenhuma licitação encontrada no período." &&
          dados[0][0] !== "Não foi possível buscar os dados no PNCP.") {
        c_licitacoes = dados.length;
        for (let d = 0; d < dados.length; d++) {
          c_valor += Number(dados[d][4]) || 0;
          const mod = String(dados[d][1]).toLowerCase();
          if (mod.indexOf("pregão") !== -1) c_pregoes++;
          else if (mod.indexOf("concorrência") !== -1) c_conc++;
          else if (mod.indexOf("dispensa") !== -1) c_disp++;
          else if (mod.indexOf("inexigibilidade") !== -1) c_inex++;
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

  // Avisos da execução no rodapé do dashboard
  if (estado && estado.avisos && estado.avisos.length > 0) {
    const linhaAviso = 4 + linhasDash.length + 2;
    abaDash.getRange(linhaAviso, 1).setValue("⚠️ Avisos da última atualização:").setFontWeight("bold").setFontColor("#b45309");
    for (let a = 0; a < estado.avisos.length; a++) {
      abaDash.getRange(linhaAviso + 1 + a, 1).setValue("• " + estado.avisos[a]).setFontColor("#b45309");
    }
  }
}

// ========== GATILHO AUTOMÁTICO DIÁRIO ==========

/** Cria gatilho diário (~8h) para atualizar tudo sozinho */
function criarGatilhoDiario() {
  let ss;
  try {
    ss = obterPlanilha(); // garante que o ID da planilha fique salvo
  } catch (e) {
    console.error(e);
    return;
  }
  removerGatilhoDiario();
  ScriptApp.newTrigger("atualizarTodasLicitacoes").timeBased().atHour(8).everyDays(1).create();
  ss.toast("Atualização automática diária ativada (~8h). Se o Google pedir autorização, aceite para o gatilho funcionar.", "Sucesso");
}

/** Remove o gatilho diário */
function removerGatilhoDiario() {
  let ss;
  try {
    ss = obterPlanilha();
  } catch (e) {
    ss = null;
  }
  const triggers = ScriptApp.getProjectTriggers().filter(function (t) {
    return t.getHandlerFunction() === "atualizarTodasLicitacoes";
  });
  triggers.forEach(function (t) { ScriptApp.deleteTrigger(t); });
  if (ss) ss.toast("Atualização automática desativada.", "Sucesso");
}

// ========== DIAGNÓSTICO DE CONEXÃO ==========

/**
 * Testa a API do PNCP para as 5 cidades e grava o resultado
 * na aba "📡 Diagnóstico". Útil para descobrir se o problema
 * é a API do governo ou outra coisa.
 */
function testarConexaoPNCP() {
  const ss = obterPlanilha();
  let aba = ss.getSheetByName("📡 Diagnóstico");
  if (!aba) aba = ss.insertSheet("📡 Diagnóstico");

  aba.clear();
  aba.getRange("A1").setValue("DIAGNÓSTICO DE CONEXÃO - PNCP").setFontSize(14).setFontWeight("bold").setFontColor("#1a56db");
  const agora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
  aba.getRange("A2").setValue("Executado em: " + agora + " | Janela testada: últimos 3 dias | Modalidade: " + nomeModalidade(CONFIG.modalidades[0]));
  aba.getRange("A4:E4").setValues([["Cidade", "Modalidade", "HTTP", "Registros", "Erro"]])
    .setBackground("#1a56db").setFontColor("white").setFontWeight("bold");

  const hoje = new Date();
  const inicio = new Date();
  inicio.setDate(hoje.getDate() - 3);
  const dataFinal = formatarDataPNCP(hoje);
  const dataInicial = formatarDataPNCP(inicio);

  const linhas = [];
  for (let i = 0; i < CONFIG.cidades.length; i++) {
    const cidade = CONFIG.cidades[i];
    if (linhas.length > 0) Utilities.sleep(1500);

    let status = "OK", registros = 0, erro = "-";
    try {
      const url = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao" +
        "?dataInicial=" + dataInicial +
        "&dataFinal=" + dataFinal +
        "&codigoModalidadeContratacao=" + CONFIG.modalidades[0] +
        "&uf=" + CONFIG.uf +
        "&codigoMunicipioIbge=" + cidade.ibge +
        "&pagina=1&tamanhoPagina=10";
      const r = UrlFetchApp.fetch(url, {
        'method': 'get',
        'headers': { 'Accept': 'application/json' },
        'muteHttpExceptions': true
      });
      const code = r.getResponseCode();
      if (code === 200) {
        const j = JSON.parse(r.getContentText());
        registros = (j.data || []).length;
      } else {
        status = "ERRO " + code;
        erro = r.getContentText().substring(0, 120);
      }
    } catch (e) {
      status = "ERRO";
      erro = e.message;
    }
    linhas.push([cidade.nome, nomeModalidade(CONFIG.modalidades[0]), status, registros, erro]);
  }

  aba.getRange(5, 1, linhas.length, 5).setValues(linhas);
  aba.autoResizeColumns(1, 5);

  const comErro = linhas.filter(function (l) { return l[2] !== "OK"; }).length;
  if (comErro === 0) {
    ss.toast("PNCP respondendo OK para as 5 cidades!", "Diagnóstico");
  } else {
    ss.toast(comErro + " cidade(s) com falha. Detalhes na aba 📡 Diagnóstico.", "Diagnóstico");
  }
}

// ========== FUNÇÕES AUXILIARES DE DATA ==========

function formatarDataPNCP(data) {
  const d = new Date(data);
  let mes = '' + (d.getMonth() + 1);
  let dia = '' + d.getDate();
  if (mes.length < 2) mes = '0' + mes;
  if (dia.length < 2) dia = '0' + dia;
  return [d.getFullYear(), mes, dia].join('');
}

function formatarDataBr(dataString) {
  if (!dataString) return "";
  const d = new Date(dataString);
  let mes = '' + (d.getMonth() + 1);
  let dia = '' + d.getDate();
  if (mes.length < 2) mes = '0' + mes;
  if (dia.length < 2) dia = '0' + dia;
  return [dia, mes, d.getFullYear()].join('/');
}

function formatarDataBrCompleta(dataString) {
  if (!dataString) return "";
  const d = new Date(dataString);
  let mes = '' + (d.getMonth() + 1);
  let dia = '' + d.getDate();
  let hora = '' + d.getHours();
  let min = '' + d.getMinutes();
  if (mes.length < 2) mes = '0' + mes;
  if (dia.length < 2) dia = '0' + dia;
  if (hora.length < 2) hora = '0' + hora;
  if (min.length < 2) min = '0' + min;
  return dia + '/' + mes + '/' + d.getFullYear() + ' ' + hora + ':' + min;
}
