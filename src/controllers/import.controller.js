async function aplicarRegistros(lista, rotulo){
  if(!lista.length){
    toast("Arquivo sem chamados", `Nada foi encontrado no ${rotulo}.`, "alert");
    return false;
  }
  const op = await perguntar(`${lista.length} chamados encontrados`,
    `Origem: ${rotulo}. A base atual tem ${state.chamados.length} chamados. Como você quer aplicar?`,
    [{ chave:"cancelar",   rotulo:"Cancelar", estilo:"btn-quiet" },
     { chave:"somar",      rotulo:"Somar à base atual", estilo:"btn-ghost" },
     { chave:"substituir", rotulo:"Substituir a base", estilo:"btn-primary" }]);
  if(op === "cancelar") return false;

  if(op === "substituir"){
    state.chamados = lista;
    await persistir(); renderTudo();
    toast("Base substituída", `${lista.length} chamados carregados.`, "ok");
    return true;
  }
  const ids = new Set(state.chamados.map(c => c.id));
  let novos = 0;
  lista.forEach(c => { if(!ids.has(c.id)){ state.chamados.push(c); ids.add(c.id); novos++; } });
  await persistir(); renderTudo();
  toast("Chamados somados", novos
    ? `${novos} novos registros · ${lista.length - novos} já existiam e foram ignorados.`
    : "Todos os registros já existiam na base.", novos ? "ok" : "alert");
  return true;
}
async function receberArquivo(arq){
  const nome = String(arq.name || "").toLowerCase();
  try{
    if(nome.endsWith(".csv")) return processarArquivoCsv(arq);
    if(nome.endsWith(".json")){
      const dados = JSON.parse(await arq.text());
      const lista = Array.isArray(dados) ? dados : dados.chamados;
      if(!Array.isArray(lista)) throw new Error("estrutura inesperada");
      return aplicarRegistros(lista.map(c => sanear(Object.assign({}, c))), `cópia ${arq.name}`);
    }
    if(nome.endsWith(".sql")){
      return aplicarRegistros(SQLiteMini.lerDump(await arq.text()).map(deLinhaSql), `dump ${arq.name}`);
    }
    const bytes = new Uint8Array(await arq.arrayBuffer());
    const assinatura = Array.from(bytes.slice(0, 15)).map(b => String.fromCharCode(b)).join("");
    if(assinatura === "SQLite format 3"){
      return aplicarRegistros(SQLiteMini.ler(bytes).map(deLinhaSql), `banco ${arq.name}`);
    }
    return processarArquivoCsv(arq);
  }catch(e){
    toast("Não foi possível ler o arquivo", "Confira se é um CSV, um banco SQLite, um dump .sql ou uma cópia JSON.", "err");
    return false;
  }
}
$("#btnWipe").addEventListener("click", async () => {
  if(!state.chamados.length){ toast("A base já está vazia", "", "alert"); return; }
  const op = await perguntar("Apagar toda a base",
    `Serão removidos ${state.chamados.length} chamados. Baixe uma cópia de segurança antes — não há como desfazer, e o arquivo SQLite conectado também fica vazio.`,
    [{ chave:"cancelar", rotulo:"Cancelar", estilo:"btn-quiet" },
     { chave:"apagar",   rotulo:"Apagar tudo", estilo:"btn-danger" }]);
  if(op !== "apagar") return;
  state.chamados = [];
  await persistir();
  renderTudo();
  toast("Base apagada", "Todos os chamados foram removidos.", "alert");
});

const CAMPOS_IMPORT = [
  { chave:"solicitante", rotulo:"Solicitante", obrig:true,  dicas:["solicitante","nome","usuario","requisitante","colaborador","funcionario","quem abriu","servidor"] },
  { chave:"local",       rotulo:"Local do atendimento",     dicas:["local","setor","departamento","unidade","sala","bloco","filial","predio","secretaria"] },
  { chave:"patrimonio",  rotulo:"Número de patrimônio",     dicas:["patrimonio","pat","tombo","tombamento","equipamento","maquina","ativo","serie"] },
  { chave:"abertura",    rotulo:"Data de abertura",         dicas:["abertura","data","inicio","solicitacao","carimbo","timestamp","registro","hora"] },
  { chave:"defeito",     rotulo:"Defeito relatado",         dicas:["defeito","problema","ocorrencia","descricao","falha","motivo","solicitacao de servico","assunto"] },
  { chave:"anotacoes",   rotulo:"Anotações gerais",         dicas:["anotacao","anotacoes","observacao","observacoes","obs","comentario","detalhes"] },
  { chave:"tipo",        rotulo:"Tipo de chamado",          dicas:["tipo","categoria","natureza","servico","classificacao"] },
  { chave:"solucao",     rotulo:"Solução aplicada",         dicas:["solucao","resolucao","acao realizada","providencia","atendimento realizado","resolvido"] }
];
let importState = null;

function adivinharMapa(cabecalho){
  const usados = new Set();
  const mapa = {};
  CAMPOS_IMPORT.forEach(campo => {
    let melhor = null, melhorNota = 0;
    cabecalho.forEach(h => {
      if(usados.has(h)) return;
      const n = normalize(h);
      campo.dicas.forEach(d => {
        let nota = 0;
        if(n === d) nota = 3;
        else if(n.indexOf(d) >= 0) nota = 2;
        else if(d.indexOf(n) >= 0 && n.length > 3) nota = 1;
        if(nota > melhorNota){ melhorNota = nota; melhor = h; }
      });
    });
    if(melhor){ mapa[campo.chave] = melhor; usados.add(melhor); }
    else mapa[campo.chave] = "";
  });
  return mapa;
}
function montarPreview(){
  const { linhas, mapa } = importState;
  const existentes = new Set(state.chamados.map(chavesDuplicidade));
  const vistas = new Set();

  const situacao = $("#impSituacao").value === "ABERTO" ? "ABERTO" : "CONCLUIDO";
  const poloPadrao = $("#impLocalPadrao").value;

  importState.registros = linhas.map(linha => {
    const pega = (chave) => mapa[chave] ? String(linha[mapa[chave]] || "").trim() : "";
    const dAbertura = parseDataFlexivel(pega("abertura")) || new Date();
    const localBruto = pega("local");
    const tipo = casarTipo(pega("tipo")) || "Manutenção";
    const patBruto = pega("patrimonio");
    const reg = {
      solicitante: pega("solicitante") || "Não informado",
      local: casarPolo(localBruto) || localBruto || poloPadrao || "Não informado",
      patrimonio: patBruto || (tipo === "Manutenção preventiva" ? PAT_INTERNO : "N/A"),
      patrimonioNovo: "",
      tipo: tipo,
      abertura: dAbertura,
      conclusao: null,               
      defeito: pega("defeito"),
      solucao: pega("solucao"),
      anotacoes: pega("anotacoes"),
      status: situacao,
      origem: "importado"
    };
    const chave = chavesDuplicidade({
      solicitante: reg.solicitante, patrimonio: reg.patrimonio,
      local: reg.local, abertura: reg.abertura.toISOString()
    });
    reg.duplicadoNaBase = existentes.has(chave);
    reg.duplicadoNoArquivo = vistas.has(chave);
    vistas.add(chave);
    reg.repetido = reg.duplicadoNaBase || reg.duplicadoNoArquivo;
    reg.selecionado = !reg.repetido;
    return reg;
  });
  desenharPreview();
}
function desenharPreview(){
  const regs = importState.registros;
  const novos = regs.filter(r => !r.repetido).length;
  const repetidos = regs.length - novos;
  const marcados = regs.filter(r => r.selecionado).length;

  $("#importResumo").innerHTML = `
    <div>Linhas no arquivo <b>${regs.length}</b></div>
    <div>Novas <b>${novos}</b></div>
    <div>Repetidas <b>${repetidos}</b></div>
    <div>Selecionadas para importar <b>${marcados}</b></div>`;

  const limite = 300;
  const corpo = $("#previewCorpo");
  corpo.innerHTML = regs.slice(0, limite).map((r, i) => {
    const motivo = r.duplicadoNaBase ? "já está na base" : (r.duplicadoNoArquivo ? "repetida no arquivo" : "nova");
    return `<tr class="${r.repetido ? "dupe-row" : ""}">
      <td><input type="checkbox" data-linha="${i}" ${r.selecionado ? "checked" : ""}></td>
      <td><span class="flag ${r.repetido ? "" : "new"}">${motivo}</span></td>
      <td>${escapeHtml(r.solicitante)}</td>
      <td>${escapeHtml(r.tipo)}</td>
      <td>${escapeHtml(r.local)}</td>
      <td class="mono">${escapeHtml(r.patrimonio)}</td>
      <td class="mono">${fmtDataHora(r.abertura.toISOString())}</td>
      <td><div class="cell-clip">${escapeHtml(r.defeito || "—")}</div></td>
    </tr>`;
  }).join("");
  $("#previewNota").textContent = regs.length > limite
    ? `Exibindo as ${limite} primeiras linhas de ${regs.length}. A importação considera todas as linhas marcadas.`
    : "";
  $("#btnConfirmarImport").disabled = marcados === 0;
  $("#btnConfirmarImport").textContent = marcados ? `Importar ${marcados} chamados` : "Nada selecionado";
}
$("#previewCorpo").addEventListener("change", (ev) => {
  const cb = ev.target.closest("input[type=checkbox][data-linha]");
  if(!cb || !importState) return;
  importState.registros[parseInt(cb.dataset.linha, 10)].selecionado = cb.checked;
  desenharPreview();
});
$("#btnMarcarTodos").addEventListener("click", () => {
  importState.registros.forEach(r => r.selecionado = true); desenharPreview();
});
$("#btnMarcarNovos").addEventListener("click", () => {
  importState.registros.forEach(r => r.selecionado = !r.repetido); desenharPreview();
});

function montarMapeamento(){
  $("#mapGrid").innerHTML = CAMPOS_IMPORT.map(campo => `
    <div class="field">
      <label class="lbl" for="map_${campo.chave}">${escapeHtml(campo.rotulo)}${campo.obrig ? ' <span class="req">*</span>' : ""}</label>
      <select id="map_${campo.chave}" data-campo="${campo.chave}">
        <option value="">— não existe na planilha —</option>
        ${importState.cabecalho.map(h => `<option value="${escapeHtml(h)}" ${importState.mapa[campo.chave] === h ? "selected" : ""}>${escapeHtml(h)}</option>`).join("")}
      </select>
    </div>`).join("");
}
["#impSituacao","#impLocalPadrao"].forEach(sel => $(sel).addEventListener("change", () => { if(importState) montarPreview(); }));
$("#mapGrid").addEventListener("change", (ev) => {
  const sel = ev.target.closest("select[data-campo]");
  if(!sel || !importState) return;
  importState.mapa[sel.dataset.campo] = sel.value;
  montarPreview();
});

function processarArquivoCsv(arquivo){
  const leitor = new FileReader();
  leitor.onload = () => {
    const { cabecalho, linhas } = lerCSV(String(leitor.result));
    if(!linhas.length){
      toast("Arquivo sem dados", "O CSV precisa ter uma linha de cabeçalho e ao menos um chamado.", "err");
      return;
    }
    importState = { cabecalho, linhas, mapa: adivinharMapa(cabecalho), registros: [] };
    $("#importFile").textContent = `${arquivo.name} · ${linhas.length} linhas · ${cabecalho.length} colunas`;
    montarMapeamento();
    montarPreview();
    abrirModal("modalImport");
  };
  leitor.onerror = () => toast("Não foi possível ler o arquivo", "Tente salvar novamente como CSV UTF-8.", "err");
  leitor.readAsText(arquivo, "utf-8");
}
$("#dropzone").addEventListener("click", () => $("#fileInput").click());
$("#dropzone").addEventListener("keydown", (ev) => { if(ev.key === "Enter" || ev.key === " ") $("#fileInput").click(); });
$("#fileInput").addEventListener("change", (ev) => {
  const arq = ev.target.files && ev.target.files[0];
  if(arq) receberArquivo(arq);
  ev.target.value = "";
});
["dragenter","dragover"].forEach(e => $("#dropzone").addEventListener(e, (ev) => {
  ev.preventDefault(); $("#dropzone").classList.add("drag");
}));
["dragleave","drop"].forEach(e => $("#dropzone").addEventListener(e, (ev) => {
  ev.preventDefault(); $("#dropzone").classList.remove("drag");
}));
$("#dropzone").addEventListener("drop", (ev) => {
  const arq = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
  if(arq) receberArquivo(arq);
});

$("#btnConfirmarImport").addEventListener("click", async () => {
  if(!importState) return;
  const selecionados = importState.registros.filter(r => r.selecionado);
  if(!selecionados.length) return;
  selecionados.sort((a, b) => a.abertura - b.abertura);
  selecionados.forEach(r => criarChamado(r));
  await persistir();
  fecharModal("modalImport");
  renderTudo();
  const emAberto = selecionados.filter(r => r.status === "ABERTO").length;
  toast("Importação concluída",
    emAberto
      ? `${selecionados.length} chamados numerados · ${emAberto} entraram na fila de trabalho.`
      : `${selecionados.length} chamados numerados e arquivados como concluídos, sem tempo de atendimento.`,
    "ok", 6000);
  importState = null;
  abrirAba(emAberto ? "fila" : "historico");
});
