function escopoSelecionado(){
  const v = $("#expEscopo").value;
  if(v === "abertos") return abertos();
  if(v === "concluidos") return concluidos();
  return state.chamados.slice();
}
$("#btnExportCsv").addEventListener("click", () => {
  const lista = escopoSelecionado();
  if(!lista.length){ toast("Nada para exportar", "Não há chamados nesse escopo.", "alert"); return; }
  baixarArquivo(`prometheus-chamados-${carimbo()}.csv`, gerarCSV(lista, $("#expDelim").value), "text/csv;charset=utf-8");
  toast("Exportação pronta", `${lista.length} chamados no arquivo CSV.`, "ok");
});
$("#btnExportHist").addEventListener("click", () => {
  const lista = listaHistorico();
  if(!lista.length){ toast("Nada para exportar", "Nenhum chamado concluído nesse filtro.", "alert"); return; }
  baixarArquivo(`prometheus-historico-${carimbo()}.csv`, gerarCSV(lista, $("#expDelim").value), "text/csv;charset=utf-8");
  toast("Exportação pronta", `${lista.length} chamados concluídos exportados.`, "ok");
});
$("#btnBackup").addEventListener("click", () => {
  baixarArquivo(`prometheus-backup-${carimbo()}.json`,
    JSON.stringify({ versao: 1, geradoEm: new Date().toISOString(), config: state.config, chamados: state.chamados }, null, 2),
    "application/json");
  toast("Cópia gerada", "Guarde o arquivo em local seguro.", "ok");
});
