"use strict";

function toast(titulo, mensagem, tipo, duracao){
  const cx = $("#toasts");
  const el = document.createElement("div");
  el.className = "toast " + (tipo || "");
  el.innerHTML = `<div class="toast-title">${escapeHtml(titulo)}</div>` +
                 (mensagem ? `<div class="toast-msg">${escapeHtml(mensagem)}</div>` : "");
  cx.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .3s ease, transform .3s ease";
    el.style.opacity = "0";
    el.style.transform = "translateX(16px)";
    setTimeout(() => el.remove(), 320);
  }, duracao || 4200);
}

function abrirModal(id){ $("#" + id).classList.add("open"); document.body.style.overflow = "hidden"; }
function fecharModal(id){
  $("#" + id).classList.remove("open");
  document.body.style.overflow = "";
  if(id === "modalConfirma" && resolverConfirma){ const r = resolverConfirma; resolverConfirma = null; r("cancelar"); }
}
function fecharTodosModais(){
  $$(".modal-backdrop").forEach(m => m.classList.remove("open"));
  document.body.style.overflow = "";
  if(resolverConfirma){ const r = resolverConfirma; resolverConfirma = null; r("cancelar"); }
}
document.addEventListener("click", (ev) => {
  const alvo = ev.target.closest("[data-close]");
  if(alvo){ fecharModal(alvo.getAttribute("data-close")); return; }
  if(ev.target.classList.contains("modal-backdrop")) fecharTodosModais();
});
document.addEventListener("keydown", (ev) => { if(ev.key === "Escape") fecharTodosModais(); });

let resolverConfirma = null;
function perguntar(titulo, mensagem, opcoes){
  $("#confirmaTitulo").textContent = titulo;
  $("#confirmaMsg").textContent = mensagem;
  $("#confirmaBotoes").innerHTML = opcoes.map(o =>
    `<button class="btn ${o.estilo || "btn-ghost"}" data-op="${escapeHtml(o.chave)}">${escapeHtml(o.rotulo)}</button>`).join("");
  abrirModal("modalConfirma");
  return new Promise(res => { resolverConfirma = res; });
}
$("#confirmaBotoes").addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-op]");
  if(!b) return;
  fecharModal("modalConfirma");
  const r = resolverConfirma; resolverConfirma = null;
  if(r) r(b.getAttribute("data-op"));
});

function marcarErro(campoId, erro){
  const el = $("#" + campoId);
  if(!el) return;
  const wrap = el.closest(".field");
  if(wrap) wrap.classList.toggle("invalid", !!erro);
}

function abrirAba(nome){
  $$(".tab").forEach(t => t.setAttribute("aria-selected", String(t.dataset.panel === nome)));
  $$(".panel").forEach(p => p.classList.toggle("active", p.id === "panel-" + nome));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$$(".tab").forEach(t => t.addEventListener("click", () => abrirAba(t.dataset.panel)));

function abertos(){ return state.chamados.filter(c => c.status === "ABERTO"); }
function concluidos(){ return state.chamados.filter(c => c.status === "CONCLUIDO"); }

function renderTudo(){
  renderCabecalho();
  renderDatalists();
  renderFiltrosLocal();
  renderFila();
  renderHistorico();
  renderDashboard();
  renderRodape();
  renderProximoId();
}

function renderCabecalho(){
  const n = abertos().length;
  $("#openText").textContent = n === 1 ? "1 em aberto" : `${n} em aberto`;
  $("#pillOpen").classList.toggle("zero", n === 0);
  $("#cntFila").textContent = n;
  $("#cntHist").textContent = concluidos().length;
}
function renderRodape(){
  const modo = { artefato: "armazenamento do aplicativo", navegador: "armazenamento deste navegador", memoria: "somente nesta sessão" }[Store.modo()] || "—";
  $("#footStats").textContent = `${state.chamados.length} chamados · ${modo}`;
}
function renderProximoId(){
  const dt = deInput($("#f_abertura").value) || new Date();
  $("#nextIdHint").textContent = "Próximo número: " + gerarId(dt);
}
function valoresUnicos(campo){
  const set = new Set();
  state.chamados.forEach(c => { if(c[campo] && c[campo] !== "N/A") set.add(c[campo]); });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
}
function renderDatalists(){
  const mapa = { dl_solicitantes: "solicitante", dl_patrimonios: "patrimonio", dl_defeitos: "defeito" };
  Object.keys(mapa).forEach(id => {
    const dl = $("#" + id);
    if(!dl) return;
    dl.innerHTML = valoresUnicos(mapa[id]).map(v => `<option value="${escapeHtml(v)}"></option>`).join("");
  });
}
function opcoesLocais(valorAtual){
  const nomes = POLOS.map(p => p.nome);
  const extras = valoresUnicos("local").filter(v => nomes.indexOf(v) < 0);
  if(valorAtual && nomes.indexOf(valorAtual) < 0 && extras.indexOf(valorAtual) < 0) extras.push(valorAtual);
  return { nomes, extras };
}
function preencherSelectLocal(el, valorAtual, placeholder){
  const { nomes, extras } = opcoesLocais(valorAtual);
  const item = (n, fora) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}${fora ? " — fora dos polos" : ""}</option>`;
  el.innerHTML = (placeholder != null ? `<option value="">${escapeHtml(placeholder)}</option>` : "") +
    nomes.map(n => item(n, false)).join("") +
    extras.map(n => item(n, true)).join("");
  el.value = valorAtual || "";
}
function mostrarEndereco(spanId, nome){
  const el = $("#" + spanId);
  if(!el) return;
  const end = enderecoDe(nome);
  el.innerHTML = nome
    ? (end ? `<strong>${escapeHtml(nome)}</strong> · ${escapeHtml(end)}` : `${escapeHtml(nome)} · endereço não cadastrado`)
    : "Escolha o polo para ver o endereço do atendimento.";
}
function renderFiltrosLocal(){
  const { nomes, extras } = opcoesLocais();
  const todos = nomes.concat(extras);
  ["#filaLocal", "#histLocal"].forEach(sel => {
    const el = $(sel);
    const atual = el.value;
    el.innerHTML = `<option value="">Todos os polos</option>` +
      todos.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join("");
    if(todos.indexOf(atual) >= 0) el.value = atual;
  });
  const padrao = $("#impLocalPadrao");
  if(padrao){
    const atual = padrao.value;
    padrao.innerHTML = `<option value="">— deixar como não informado —</option>` +
      nomes.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join("");
    padrao.value = atual;
  }
  const fl = $("#f_local");
  const atualForm = fl.value;
  preencherSelectLocal(fl, atualForm, "— selecione o polo —");
  mostrarEndereco("f_localEndereco", fl.value);
}
function combina(c, termo){
  if(!termo) return true;
  const t = normalize(termo);
  return [c.id, c.solicitante, c.local, c.patrimonio, c.defeito, c.solucao, c.anotacoes]
    .some(v => normalize(v).indexOf(t) >= 0);
}
