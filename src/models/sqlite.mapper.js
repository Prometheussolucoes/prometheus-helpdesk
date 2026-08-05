function paraLinhaSql(c){
  return {
    id: c.id, solicitante: c.solicitante, local: c.local,
    patrimonio: c.patrimonio, patrimonio_novo: c.patrimonioNovo || null,
    tipo: c.tipo, abertura: c.abertura, conclusao: c.conclusao || null,
    tempo_minutos: tempoAtendimento(c),
    defeito: c.defeito || null, solucao: c.solucao || null, anotacoes: c.anotacoes || null,
    status: c.status, origem: c.origem || "manual",
    criado_em: c.criadoEm || null, atualizado_em: c.atualizadoEm || null
  };
}
function deLinhaSql(r){
  const abertura = parseDataFlexivel(r.abertura) || new Date();
  const conclusao = parseDataFlexivel(r.conclusao);
  const status = String(r.status || "").toUpperCase().indexOf("CONCLU") >= 0 ? "CONCLUIDO" : "ABERTO";
  return sanear({
    id: r.id || gerarId(abertura),
    solicitante: r.solicitante || "Não informado",
    local: casarPolo(r.local) || r.local || "Não informado",
    patrimonio: r.patrimonio || "N/A",
    patrimonioNovo: r.patrimonio_novo || "",
    tipo: casarTipo(r.tipo) || "Manutenção",
    abertura: abertura.toISOString(),
    conclusao: status === "CONCLUIDO" && conclusao ? conclusao.toISOString() : null,
    defeito: r.defeito || "", solucao: r.solucao || "", anotacoes: r.anotacoes || "",
    status: status, origem: r.origem || "importado",
    criadoEm: r.criado_em || null, atualizadoEm: r.atualizado_em || null
  });
}
