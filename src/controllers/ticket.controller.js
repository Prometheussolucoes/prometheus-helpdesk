function limparFormNovo(){
  ["f_solicitante","f_local","f_patrimonio","f_defeito","f_anotacoes"].forEach(id => { $("#" + id).value = ""; marcarErro(id, false); });
  $("#f_abertura").value = paraInput(new Date());
  marcarErro("f_abertura", false);
  mostrarEndereco("f_localEndereco", "");
  preencherSelectTipo($("#f_tipo"), "Manutenção");
  aplicarTipoNoForm();
  renderProximoId();
}
function preencherSelectTipo(el, valorAtual, placeholder){
  el.innerHTML = (placeholder != null ? `<option value="">${escapeHtml(placeholder)}</option>` : "") +
    TIPOS.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
  el.value = valorAtual || "";
}
const DICAS_TIPO = {
  "Manutenção": "Atendimento corretivo solicitado pelo cliente.",
  "Manutenção preventiva": `Chamado aberto pela Prometheus. O patrimônio ${PAT_INTERNO}, de uso interno da TI, entra automaticamente.`,
  "Troca de equipamento": "Registre agora o patrimônio do equipamento antigo. O novo é informado no fechamento.",
  "Solicitação de equipamento": "Pedido de equipamento. Use N/A quando ainda não houver patrimônio envolvido."
};
function aplicarTipoNoForm(){
  const t = $("#f_tipo").value;
  const pat = $("#f_patrimonio");
  $("#f_tipoHint").textContent = DICAS_TIPO[t] || "Escolha o tipo para ajustar os campos do chamado.";
  $("#f_patLabel").textContent = t === "Troca de equipamento" ? "Patrimônio do equipamento antigo" : "Número de patrimônio";
  if(t === "Manutenção preventiva"){ if(!pat.value.trim()) pat.value = PAT_INTERNO; }
  else if(pat.value.trim() === PAT_INTERNO){ pat.value = ""; }
}
$("#f_tipo").addEventListener("change", aplicarTipoNoForm);
$("#f_local").addEventListener("change", () => mostrarEndereco("f_localEndereco", $("#f_local").value));
$("#e_local").addEventListener("change", () => mostrarEndereco("e_localEndereco", $("#e_local").value));
$("#btnLimparForm").addEventListener("click", limparFormNovo);
$("#f_abertura").addEventListener("change", renderProximoId);

$("#btnCriar").addEventListener("click", async () => {
  const solicitante = $("#f_solicitante").value.trim();
  const local = $("#f_local").value.trim();
  const patrimonio = $("#f_patrimonio").value.trim();
  const abertura = deInput($("#f_abertura").value);

  marcarErro("f_solicitante", !solicitante);
  marcarErro("f_local", !local);
  marcarErro("f_patrimonio", !patrimonio);
  marcarErro("f_abertura", !abertura);
  if(!solicitante || !local || !patrimonio || !abertura){
    toast("Faltam informações", "Preencha os campos destacados para registrar o chamado.", "err");
    return;
  }
  const c = criarChamado({
    solicitante, local, patrimonio, abertura,
    tipo: $("#f_tipo").value || "Manutenção",
    defeito: $("#f_defeito").value.trim(),
    anotacoes: $("#f_anotacoes").value.trim(),
    status: "ABERTO", origem: "manual"
  });
  await persistir();
  limparFormNovo();
  renderTudo();
  toast("Chamado registrado", `${c.id} entrou na fila de trabalho.`, "ok");
  abrirAba("fila");
});

let idFechando = null;
function abrirFechamento(id){
  const c = buscarChamado(id);
  if(!c) return;
  idFechando = id;
  $("#fecharId").textContent = `${c.id} · ${c.solicitante} · ${c.patrimonio}`;
  $("#c_conclusao").value = paraInput(new Date());
  $("#c_defeito").value = c.defeito || "";
  $("#c_solucao").value = c.solucao || "";
  $("#c_anotacoes").value = c.anotacoes || "";
  const troca = c.tipo === "Troca de equipamento";
  $("#wrap_c_patrimonioNovo").hidden = !troca;
  $("#c_patrimonioNovo").value = c.patrimonioNovo || "";
  ["c_conclusao","c_solucao","c_patrimonioNovo"].forEach(f => marcarErro(f, false));
  atualizarHintTempo();
  abrirModal("modalFechar");
  setTimeout(() => $("#c_solucao").focus(), 60);
}
function atualizarHintTempo(){
  const c = buscarChamado(idFechando);
  if(!c) return;
  const fim = deInput($("#c_conclusao").value);
  if(!fim){ $("#c_tempoHint").textContent = ""; return; }
  const min = minutosEntre(c.abertura, fim.toISOString());
  $("#c_tempoHint").textContent = min == null || min < 0
    ? "A conclusão está antes da abertura."
    : `Tempo de atendimento: ${fmtDuracao(min)} (${min} minutos), a partir de ${fmtDataHora(c.abertura)}.`;
}
$("#c_conclusao").addEventListener("change", atualizarHintTempo);

$("#btnConfirmarFechar").addEventListener("click", async () => {
  const c = buscarChamado(idFechando);
  if(!c) return;
  const fim = deInput($("#c_conclusao").value);
  const solucao = $("#c_solucao").value.trim();
  const invalidoFim = !fim || fim < new Date(c.abertura);
  const troca = c.tipo === "Troca de equipamento";
  const patNovo = $("#c_patrimonioNovo").value.trim();

  marcarErro("c_conclusao", invalidoFim);
  marcarErro("c_solucao", !solucao);
  marcarErro("c_patrimonioNovo", troca && !patNovo);
  if(invalidoFim || !solucao || (troca && !patNovo)){
    toast("Não dá para concluir ainda", troca && !patNovo
      ? "Informe o patrimônio do equipamento novo para fechar a troca."
      : "Confira a data de conclusão e descreva a solução aplicada.", "err");
    return;
  }
  atualizarChamado(c.id, {
    status: "CONCLUIDO",
    patrimonioNovo: troca ? patNovo : (c.patrimonioNovo || ""),
    conclusao: fim.toISOString(),
    defeito: $("#c_defeito").value.trim(),
    solucao: solucao,
    anotacoes: $("#c_anotacoes").value.trim()
  });
  await persistir();
  fecharModal("modalFechar");
  renderTudo();
  toast("Chamado concluído", `${c.id} · ${fmtDuracao(minutosEntre(c.abertura, c.conclusao))} de atendimento.`, "ok");
});

let idEditando = null;
function abrirEdicao(id){
  const c = buscarChamado(id);
  if(!c) return;
  idEditando = id;
  $("#editarId").textContent = c.id;
  $("#e_solicitante").value = c.solicitante;
  preencherSelectLocal($("#e_local"), c.local);
  mostrarEndereco("e_localEndereco", c.local);
  $("#e_patrimonio").value = c.patrimonio;
  preencherSelectTipo($("#e_tipo"), c.tipo);
  $("#e_patrimonioNovo").value = c.patrimonioNovo || "";
  $("#e_status").value = c.status;
  $("#e_abertura").value = paraInput(c.abertura);
  $("#e_conclusao").value = c.conclusao ? paraInput(c.conclusao) : "";
  $("#e_defeito").value = c.defeito;
  $("#e_solucao").value = c.solucao;
  $("#e_anotacoes").value = c.anotacoes;
  ["e_solicitante","e_local","e_patrimonio","e_abertura","e_conclusao","e_solucao"].forEach(f => marcarErro(f, false));
  $("#e_origem").textContent = (c.origem === "importado" ? "Veio da planilha importada · " : "Registrado no sistema · ") +
    `criado em ${fmtDataHora(c.criadoEm || c.abertura)}`;
  abrirModal("modalEditar");
}
$("#btnSalvarEdicao").addEventListener("click", async () => {
  const c = buscarChamado(idEditando);
  if(!c) return;
  const solicitante = $("#e_solicitante").value.trim();
  const local = $("#e_local").value.trim();
  const patrimonio = $("#e_patrimonio").value.trim();
  const abertura = deInput($("#e_abertura").value);
  const status = $("#e_status").value;
  let conclusao = deInput($("#e_conclusao").value);
  const solucao = $("#e_solucao").value.trim();

  const conclusaoInvalida = !!(conclusao && abertura && conclusao < abertura);

  marcarErro("e_solicitante", !solicitante);
  marcarErro("e_local", !local);
  marcarErro("e_patrimonio", !patrimonio);
  marcarErro("e_abertura", !abertura);
  marcarErro("e_conclusao", conclusaoInvalida);
  marcarErro("e_solucao", false);

  if(!solicitante || !local || !patrimonio || !abertura || conclusaoInvalida){
    toast("Revise os campos", "Há informações faltando ou inconsistentes.", "err");
    return;
  }
  atualizarChamado(c.id, {
    solicitante, local, patrimonio, status,
    tipo: $("#e_tipo").value || c.tipo,
    patrimonioNovo: $("#e_patrimonioNovo").value.trim(),
    abertura: abertura.toISOString(),
    conclusao: status === "CONCLUIDO" && conclusao ? conclusao.toISOString() : null,
    defeito: $("#e_defeito").value.trim(),
    solucao: solucao,
    anotacoes: $("#e_anotacoes").value.trim()
  });
  await persistir();
  fecharModal("modalEditar");
  renderTudo();
  toast("Alterações salvas", `${c.id} atualizado.`, "ok");
});
async function excluirChamado(id, fecharEdicao){
  const c = buscarChamado(id);
  if(!c) return;
  const op = await perguntar("Excluir chamado",
    `${c.id} — ${c.solicitante}, ${c.local}. A exclusão é definitiva e também é replicada no arquivo SQLite conectado.`,
    [{ chave:"cancelar", rotulo:"Manter chamado", estilo:"btn-quiet" },
     { chave:"excluir",  rotulo:"Excluir definitivamente", estilo:"btn-danger" }]);
  if(op !== "excluir") return;
  deletarChamado(c.id);
  await persistir();
  if(fecharEdicao) fecharModal("modalEditar");
  renderTudo();
  toast("Chamado excluído", `${c.id} foi removido da base.`, "alert");
}
$("#btnExcluir").addEventListener("click", () => excluirChamado(idEditando, true));

document.addEventListener("click", (ev) => {
  const fechar = ev.target.closest("[data-fechar]");
  if(fechar){ abrirFechamento(fechar.getAttribute("data-fechar")); return; }
  const editar = ev.target.closest("[data-editar]");
  if(editar){ abrirEdicao(editar.getAttribute("data-editar")); return; }
  const excluir = ev.target.closest("[data-excluir]");
  if(excluir){ excluirChamado(excluir.getAttribute("data-excluir"), false); return; }
  const ir = ev.target.closest("[data-goto]");
  if(ir){ abrirAba(ir.getAttribute("data-goto")); }
});
$("#btnQuickNew").addEventListener("click", () => { abrirAba("novo"); setTimeout(() => $("#f_solicitante").focus(), 120); });

["#filaBusca","#filaLocal","#filaOrdem"].forEach(s => $(s).addEventListener("input", renderFila));
["#histBusca","#histLocal"].forEach(s => $(s).addEventListener("input", renderHistorico));
