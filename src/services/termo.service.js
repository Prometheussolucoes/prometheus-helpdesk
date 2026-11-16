"use strict";

const TERMO_BANNER_DATA_URI = "data:image/png;base64,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1glY55133kfGOLds3LhRJmfz5s3OpyrT7PhncfLQZALW5D+9YxvZnNfceeWj0ej4excsWJBf2LadSCRO9kEGBgZ+NcZZX3LJJb/+9a/zZ8f/whe+QMACCl42LS2r1Jar9k1in8GPGgqKlZPNPR6nW9WGvRlGBQEAAACtfOHd2SvOz1m2vD7gWXLAu6Yzf80l+/qLcoZb7vovVonb7j7qboxM2dv53/72t2eRdZzM1NLSkl9fffXVzz77rLP44Q9/uGnTpt7e3gkHBwKB/OKWW25xqtOOHTsmHOA0qfxi3759JztPVp5T1o4cOfKOd7zD6Sz5jWNO0pIis3///lQq5VQ8Z/3BD35wQsK7/fbb8wvnZR8dHR1/17vf/e6bb775pptueuGFF0ZGRo7dPjg4+O1vfzsfsC677LL58+efonzNFuaJgDFde6TqG/LdK+WlL0jbek3rlTns+sHrJTetnP/5beev7jSoVwAAAIB23nlhLieun7bOe2TLec6PpfPXXPof11iLP5a6/iL7wWszOZHqDu/egQJ6O/8f//Efe/bscRYXX3zxz3/+8+MPWL169bFNXs8999wNN9ww/t6vfvWrjz32WH69atWqUz6V2lW0efNmZ/G5z31OxrYROclMis+xnW6PP/64YRjHbnfS3rEX8+DBg+Mf4vF4amtry8rKnnrqqW9961sTPqDTtvIL5yUtwHol7MBCsRvpl93Lxb9IBSxtxUZlTdjwBbz+CP9HAwAAAHobGnU97i9pHvBcf2EukfUs/C/Zr7wvfe/V1kjG9euFqYwlpfuNZ5pLsgX24+p/+qd/2rp1q5NIHnjggYcffriqqmr8vU4Tefrpp1988UVnffPNNztHrl+//ve///211157zz333HnnnfnD/H7/T37yk9M+1yuvvPLII494vertz5YtW5ykJZNz7733XnnllSe8a/fu3StWrJBZdUaf3uLFi3/84x87i7vuust5EVauXNnV1XXjjTd++ctfdhqWjJ3r6je/+c34hzi3LFq0KH+K/SeeeOK6666rqanJnyPf+aJ84xvfOPZcUpB4u4uilMtK6zo1KrivVq315Pwtvb1XjQquDXtTFputAAAAgLlgmWlceV6ufGGyZcgzz5P+wILcxfNsl0suKrG7jrqf3jVvY5c3kyu4f/83NzcvWbLkb//2b521E6G2bdt2bMtV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";

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
  @page{ size:A4; margin:25mm 30mm; }
  body{ font-family:Arial,Helvetica,sans-serif; font-size:11.5pt; color:#1a1a1a; line-height:1.5; }
  table.termo-cabecalho{ width:567px; border-collapse:collapse; margin:0 0 24px; }
  table.termo-cabecalho td{ padding:0; }
  table.termo-cabecalho img{ display:block; }
  h1{ font-family:Arial,"Arial Black",Helvetica,sans-serif; font-weight:700; font-size:12.5pt; text-align:center; margin:0 0 18px; }
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
    <td><img alt="PROMETHEUS" height="82" src="${TERMO_BANNER_DATA_URI}" width="567"/></td>
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
