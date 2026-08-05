function renderFila(){
  const termo = $("#filaBusca").value;
  const local = $("#filaLocal").value;
  const ordem = $("#filaOrdem").value;
  const agora = Date.now();

  let lista = abertos().filter(c => combina(c, termo) && (!local || c.local === local));
  lista.sort((a, b) => ordem === "recentes"
    ? new Date(b.abertura) - new Date(a.abertura)
    : new Date(a.abertura) - new Date(b.abertura));

  const cx = $("#filaLista");
  if(!lista.length){
    const vazioTotal = abertos().length === 0;
    cx.innerHTML = `<div class="empty">
      <div class="empty-title">${vazioTotal ? "Nenhum chamado em aberto" : "Nenhum chamado corresponde ao filtro"}</div>
      <p>${vazioTotal ? "A fila está limpa. Registre um novo atendimento ou traga os chamados que estão na planilha." : "Ajuste a busca ou volte a exibir todos os locais."}</p>
      ${vazioTotal ? `<div class="btn-row btn-row-center"><button class="btn btn-primary btn-sm" data-goto="novo">Abrir chamado</button><button class="btn btn-ghost btn-sm" data-goto="dados">Importar planilha</button></div>` : ""}
    </div>`;
    return;
  }

  cx.innerHTML = lista.map(c => {
    const min = Math.max(0, Math.round((agora - new Date(c.abertura)) / 60000));
    const tier = tierDe(min);
    return `<article class="ticket" style="--tier:${tier.cor}">
      <div class="ticket-main">
        <div class="ticket-id">${escapeHtml(c.id)}${c.origem === "importado" ? " · importado" : ""}</div>
        <div class="ticket-who">${escapeHtml(c.solicitante)}</div>
        <div class="ticket-meta">
          <span>Tipo <b>${escapeHtml(c.tipo)}</b></span>
          <span>Local <b>${escapeHtml(c.local)}</b></span>
          <span>Patrimônio <b>${escapeHtml(c.patrimonio)}</b>${ehInterno(c) ? " <i class=\"internal-use\">uso interno</i>" : ""}</span>
          <span>Aberto em <b>${fmtDataHora(c.abertura)}</b></span>
        </div>
        ${enderecoDe(c.local) ? `<div class="ticket-addr">${escapeHtml(enderecoDe(c.local))}</div>` : ""}
        ${c.defeito ? `<div class="ticket-defect">${escapeHtml(c.defeito)}</div>` : ""}
      </div>
      <div class="ticket-side">
        <div class="ticket-side-copy">
          <div class="elapsed">${fmtDuracao(min)}</div>
          <div class="elapsed-lbl">na fila</div>
        </div>
        <span class="tier-tag" style="--tier:${tier.cor}">${tier.nome}</span>
        <div class="ticket-actions">
          <button class="btn btn-danger btn-sm" data-excluir="${escapeHtml(c.id)}">Excluir</button>
          <button class="btn btn-ghost btn-sm" data-editar="${escapeHtml(c.id)}">Editar</button>
          <button class="btn btn-primary btn-sm" data-fechar="${escapeHtml(c.id)}">Concluir</button>
        </div>
      </div>
    </article>`;
  }).join("");
}

function listaHistorico(){
  const termo = $("#histBusca").value;
  const local = $("#histLocal").value;
  return concluidos()
    .filter(c => combina(c, termo) && (!local || c.local === local))
    .sort((a, b) => new Date(b.conclusao || b.abertura) - new Date(a.conclusao || a.abertura));
}
function renderHistorico(){
  const lista = listaHistorico();
  const corpo = $("#histCorpo");
  const vazio = $("#histVazio");
  const wrap = $(".table-wrap", $("#panel-historico"));

  if(!lista.length){
    corpo.innerHTML = "";
    wrap.style.display = "none";
    vazio.innerHTML = `<div class="empty">
      <div class="empty-title">${concluidos().length ? "Nenhum resultado para esse filtro" : "Ainda não há chamados concluídos"}</div>
      <p>${concluidos().length ? "Tente outro termo de busca." : "Assim que você concluir o primeiro atendimento, ele aparece aqui com o tempo total calculado."}</p>
    </div>`;
    return;
  }
  vazio.innerHTML = "";
  wrap.style.display = "";
  corpo.innerHTML = lista.map(c => {
    const min = tempoAtendimento(c);
    return `<tr>
      <td class="mono id">${escapeHtml(c.id)}</td>
      <td>${escapeHtml(c.solicitante)}</td>
      <td>${escapeHtml(c.tipo)}</td>
      <td title="${escapeHtml(enderecoDe(c.local))}">${escapeHtml(c.local)}</td>
      <td class="mono">${escapeHtml(c.patrimonio)}${c.patrimonioNovo ? ` → ${escapeHtml(c.patrimonioNovo)}` : ""}</td>
      <td class="mono">${fmtDataHora(c.abertura)}</td>
      <td class="mono">${fmtDataHora(c.conclusao)}</td>
      <td class="mono ${min == null ? "text-muted-2" : "text-ember"}">${min == null ? "Não informado" : fmtDuracao(min)}</td>
      <td><div class="cell-clip">${escapeHtml(c.solucao || "—")}</div></td>
      <td class="nowrap">
        <button class="btn btn-quiet btn-sm" data-editar="${escapeHtml(c.id)}">Editar</button>
        <button class="btn btn-danger btn-sm" data-excluir="${escapeHtml(c.id)}">Excluir</button>
      </td>
    </tr>`;
  }).join("");
}

function ranking(campo, limite, ignorar){
  const contagem = new Map();
  state.chamados.forEach(c => {
    const v = (c[campo] || "").trim();
    if(!v || v.toUpperCase() === "N/A" || v === "Não informado") return;
    if(ignorar && ignorar.indexOf(v) >= 0) return;
    contagem.set(v, (contagem.get(v) || 0) + 1);
  });
  return Array.from(contagem.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .slice(0, limite || 5);
}
function pintarRanking(elId, dados, sufixo){
  const el = $("#" + elId);
  if(!dados.length){
    el.innerHTML = `<div class="empty-message">Sem dados suficientes ainda.</div>`;
    return;
  }
  const max = dados[0][1] || 1;
  el.innerHTML = dados.map(([nome, n]) => `
    <div class="rank-row">
      <div class="rank-name" title="${escapeHtml(nome)}">${escapeHtml(nome)}</div>
      <div class="rank-num">${n} ${sufixo || (n === 1 ? "chamado" : "chamados")}</div>
      <div class="rank-bar"><div class="rank-fill" style="--rank-width:${Math.round(n / max * 100)}%"></div></div>
    </div>`).join("");
}
function renderDashboard(){
  const total = state.chamados.length;
  const nAbertos = abertos().length;
  const fechados = concluidos().filter(c => c.conclusao);
  const duracoes = fechados.map(c => minutosEntre(c.abertura, c.conclusao)).filter(v => v != null);
  const mttr = duracoes.length ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length) : null;

  const topLocal = ranking("local", 1)[0];
  const topPat = ranking("patrimonio", 1, [PAT_INTERNO])[0];

  const cards = [
    { lbl: "Total de chamados", val: total, sub: `${concluidos().length} concluídos`, accent: false },
    { lbl: "Em aberto agora", val: nAbertos, sub: nAbertos ? "aguardando fechamento" : "fila limpa", accent: true },
    { lbl: "Tempo médio (MTTR)", val: mttr == null ? "—" : fmtDuracao(mttr), sub: duracoes.length ? `base de ${duracoes.length} com tempo registrado` : "nenhum tempo registrado ainda", accent: false },
    { lbl: "Local com mais demanda", val: topLocal ? topLocal[0] : "—", sub: topLocal ? `${topLocal[1]} chamados` : "sem dados", accent: false },
    { lbl: "Patrimônio crítico", val: topPat ? topPat[0] : "—", sub: topPat ? `${topPat[1]} manutenções` : "sem dados", accent: false }
  ];
  $("#kpis").innerHTML = cards.map(c => `
    <div class="kpi ${c.accent ? "accent" : ""}">
      <div class="kpi-lbl">${escapeHtml(c.lbl)}</div>
      <div class="kpi-val ${String(c.val).length > 12 ? "compact" : ""}">${escapeHtml(c.val)}</div>
      <div class="kpi-sub">${escapeHtml(c.sub)}</div>
    </div>`).join("");

  pintarRanking("rankSolicitantes", ranking("solicitante", 6));
  pintarRanking("rankPatrimonios", ranking("patrimonio", 6, [PAT_INTERNO]), "manutenções");
  pintarRanking("rankLocais", ranking("local", 6));
  pintarRanking("rankTipos", ranking("tipo", 6));

  const agora = Date.now();
  const faixas = [
    ["Menos de 4 horas", 0, 4],
    ["Entre 4 e 24 horas", 4, 24],
    ["Entre 1 e 3 dias", 24, 72],
    ["Mais de 3 dias", 72, Infinity]
  ];
  const dist = faixas.map(([nome, min, max]) => {
    const n = abertos().filter(c => {
      const h = (agora - new Date(c.abertura)) / 3600000;
      return h >= min && h < max;
    }).length;
    return [nome, n];
  }).filter(d => d[1] > 0);
  pintarRanking("rankIdade", dist.length ? dist : []);
}
