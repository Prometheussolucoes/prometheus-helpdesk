"use strict";

const TERMO_LOGO_DATA_URI = "data:image/png;base64,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";

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

function termoFraseServico(c){
  if(c.contrato === "Rede Lógica"){
    return "foram realizados os serviços de REDE LÓGICA nos equipamentos locados relacionados abaixo, conforme previsto no contrato de locação principal.";
  }
  const equipamento = c.contrato === "Impressoras" ? "IMPRESSORA" : "COMPUTADORES";
  return `foram realizados os serviços de ${termoNomeServico(c.tipo)} nos equipamentos locados de ${equipamento} relacionados abaixo, conforme previsto no contrato de locação principal.`;
}

function termoTipoEquipamento(c){
  if(c.contrato === "Impressoras") return "IMPRESSORA";
  const livre = String(c.equipamentoTipo || "").trim();
  return livre ? livre.toUpperCase() : "COMPUTADOR";
}

function termoHora(iso){
  if(!iso) return "____";
  const d = new Date(iso);
  if(isNaN(d)) return "____";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function termoData(iso){
  const d = iso ? new Date(iso) : new Date();
  const base = isNaN(d) ? new Date() : d;
  return { dia: base.getDate(), mes: NOMES_MES[base.getMonth()].toUpperCase(), ano: base.getFullYear() };
}

function gerarTermoHtml(c){
  const titulo = TERMO_TITULOS[c.contrato] || TERMO_TITULOS["Computadores"];
  const comTabela = c.contrato !== "Rede Lógica";
  const { dia, mes, ano } = termoData(c.conclusao || c.abertura);
  const tabela = comTabela ? `
    <table class="termo-tabela">
      <tr><th>Tipo</th><th>Código</th><th>Local</th></tr>
      <tr><td>${escapeHtml(termoTipoEquipamento(c))}</td><td>${escapeHtml(c.patrimonio)}</td><td>Casa da Juventude/${escapeHtml(String(c.local || "").toUpperCase())}</td></tr>
    </table>` : "";

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8"/>
<title>Termo de manutenção ${escapeHtml(c.id)}</title>
<style>
  @page{ size:A4; margin:2cm; }
  body{ font-family:Calibri,Arial,sans-serif; font-size:11.5pt; color:#1a1a1a; line-height:1.5; }
  table.termo-cabecalho{ width:100%; border-collapse:collapse; border-bottom:4px solid #ff6a00; margin-bottom:20px; }
  table.termo-cabecalho td{ background:#101012; color:#fff; padding:10px 20px; }
  table.termo-cabecalho b{ letter-spacing:.14em; font-size:13pt; padding-left:10px; }
  h1{ font-size:12.5pt; text-align:center; margin:0 0 18px; }
  p{ text-align:justify; margin:0 0 12px; }
  table.termo-tabela{ width:100%; border-collapse:collapse; margin:10px 0 18px; }
  table.termo-tabela th{ background:#ff6a00; color:#fff; text-align:left; padding:6px 8px; font-size:10.5pt; }
  table.termo-tabela td{ border:1px solid #ccc; padding:6px 8px; font-size:10.5pt; }
  .termo-obs{ border:2px solid #ff6a00; border-radius:8px; min-height:90px; margin:10px 0 20px; padding:8px 10px; }
  .termo-assinatura{ margin-top:48px; text-align:center; }
  .termo-linha{ border-top:1px solid #000; width:340px; margin:0 auto 4px; }
  .termo-rodape{ margin-top:40px; border-top:1px solid #999; padding-top:8px; text-align:center; font-size:9pt; color:#555; }
</style>
</head>
<body>
  <table class="termo-cabecalho"><tr>
    <td width="40" style="width:40px"><img alt="" height="30" src="${TERMO_LOGO_DATA_URI}" width="30"/></td>
    <td><b>PROMETHEUS</b></td>
  </tr></table>
  <h1>${titulo}</h1>
  <p>Eu, ___________________________________________________________, portador(a) do CPF _____________________, na qualidade de responsável pelo polo <b>${escapeHtml(String(c.local || "").toUpperCase())}</b> da Casa da Juventude, situada no endereço: ${escapeHtml(enderecoDe(c.local) || "")}, declaro que nesta data ${termoFraseServico(c)}</p>
  <p>Os procedimentos executados incluíram verificação de componentes, testes de funcionamento e demais atividades de manutenção preventiva pertinentes a cada equipamento, os quais se encontram em <b>perfeitas condições de operação</b> ao término da manutenção.</p>
  ${tabela}
  <p><b>OBSERVAÇÕES, SE HOUVER:</b></p>
  <p>Hora de abertura do chamado ${termoHora(c.abertura)}h</p>
  <p>Hora do fechamento do chamado: ${termoHora(c.conclusao)}h</p>
  <div class="termo-obs"></div>
  <p style="text-align:center">Este termo é firmado em 2 (duas) vias de igual teor e forma.</p>
  <p style="text-align:center">Maricá, ${dia} de ${mes} de ${ano}.</p>
  <div class="termo-assinatura">
    <div class="termo-linha"></div>
    <div>PROMETHEUS (Responsável Técnico pela Manutenção)</div>
  </div>
  <div class="termo-assinatura" style="margin-top:36px">
    <div class="termo-linha"></div>
    <div>(Responsável pelo Recebimento)</div>
  </div>
  <div class="termo-rodape">
    PROMETHEUS SOLUÇÕES E INOVAÇÕES &ndash; 09.027.612/0001-42<br/>
    suporte@prometheussolucoes.com &middot; Whatsapp: (21) 97349-2587
  </div>
</body>
</html>`;
}

function baixarTermo(c){
  const html = gerarTermoHtml(c);
  baixarArquivo(`termo-${c.contrato.toLowerCase().replace(/\s+/g, "-")}-${c.id}.doc`, html, "application/msword");
}
