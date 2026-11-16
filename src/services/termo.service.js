"use strict";

const TERMO_TITULOS = {
  "Computadores": "TERMO DE REALIZAÇÃO DE MANUTENÇÃO / MANUTENÇÃO PREVENTIVA EM EQUIPAMENTOS LOCADOS DE COMPUTADORES",
  "Impressoras": "TERMO DE REALIZAÇÃO DE MANUTENÇÃO / MANUTENÇÃO PREVENTIVA EM EQUIPAMENTOS LOCADOS DE IMPRESSORA",
  "Rede Lógica": "TERMO DE REALIZAÇÃO DE MANUTENÇÃO REDE LÓGICA"
};

function termoNomeServico(tipo){
  const mapa = {
    "Manutenção": "MANUTENÇÃO",
    "Manutenção preventiva": "MANUTENÇÃO PREVENTIVA",
    "Troca de equipamento": "TROCA DE EQUIPAMENTO",
    "Troca de insumos": "TROCA DE INSUMOS",
    "Solicitação de equipamento": "SOLICITAÇÃO DE EQUIPAMENTO"
  };
  return mapa[tipo] || String(tipo || "MANUTENÇÃO").toUpperCase();
}

function termoServicoNome(c){
  if(c.contrato === "Rede Lógica") return "REDE LÓGICA";
  return termoNomeServico(c.tipo);
}

function termoTipoEquipamento(c){
  if(c.contrato === "Impressoras") return "IMPRESSORA";
  const livre = String(c.equipamentoTipo || "").trim();
  return livre ? livre.toUpperCase() : "COMPUTADOR";
}

function termoHora(iso){
  if(!iso) return "__:__";
  const d = new Date(iso);
  if(isNaN(d)) return "__:__";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function termoData(iso){
  const d = iso ? new Date(iso) : new Date();
  const base = isNaN(d) ? new Date() : d;
  return { dia: base.getDate(), mes: NOMES_MES[base.getMonth()].toLowerCase(), ano: base.getFullYear() };
}

function termoXmlEscape(valor){
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function gerarTermoDocumentXml(c){
  const titulo = TERMO_TITULOS[c.contrato] || TERMO_TITULOS["Computadores"];
  const comTabela = c.contrato !== "Rede Lógica";
  const { dia, mes, ano } = termoData(c.conclusao || c.abertura);

  let xml = TERMO_DOCX_DOCUMENT_TEMPLATE;

  if(comTabela){
    xml = xml.replace("<!--TBL_START-->", "").replace("<!--TBL_END-->", "");
  }else{
    const inicio = xml.indexOf("<!--TBL_START-->");
    const fim = xml.indexOf("<!--TBL_END-->") + "<!--TBL_END-->".length;
    xml = xml.slice(0, inicio) + xml.slice(fim);
  }

  const valores = {
    "@@TITULO@@": titulo,
    "@@POLO@@": String(c.local || "").toUpperCase(),
    "@@ENDERECO@@": enderecoDe(c.local) || "",
    "@@SERVICO_NOME@@": termoServicoNome(c),
    "@@EQUIP_TIPO@@": comTabela ? termoTipoEquipamento(c) : "",
    "@@EQUIP_CODIGO@@": comTabela ? (c.patrimonio || "") : "",
    "@@EQUIP_LOCAL@@": comTabela ? String(c.local || "").toUpperCase() : "",
    "@@HORA_ABERTURA@@": termoHora(c.abertura),
    "@@HORA_FECHAMENTO@@": termoHora(c.conclusao),
    "@@DIA@@": String(dia),
    "@@MES@@": mes,
    "@@ANO@@": String(ano)
  };
  Object.keys(valores).forEach(token => {
    xml = xml.split(token).join(termoXmlEscape(valores[token]));
  });
  return xml;
}

function gerarTermoDocxBytes(c){
  const entries = [];
  Object.keys(TERMO_DOCX_TEXT_PARTS).forEach(nome => {
    entries.push({ name: nome, bytes: zipUtf8Bytes(TERMO_DOCX_TEXT_PARTS[nome]) });
  });
  Object.keys(TERMO_DOCX_BINARY_PARTS).forEach(nome => {
    entries.push({ name: nome, bytes: zipBase64ToBytes(TERMO_DOCX_BINARY_PARTS[nome]) });
  });
  entries.push({ name: "word/document.xml", bytes: zipUtf8Bytes(gerarTermoDocumentXml(c)) });
  return zipBuildStore(entries);
}

function termoNomeArquivoSeguro(texto){
  return String(texto)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, "-");
}

function baixarTermo(c){
  const bytes = gerarTermoDocxBytes(c);
  baixarArquivo(
    `termo-${termoNomeArquivoSeguro(c.contrato)}-${c.id}.docx`,
    bytes,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}
