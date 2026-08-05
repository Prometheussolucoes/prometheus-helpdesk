let arquivoSqlite = null;
let ultimaGravacao = null;

function suportaArquivoLocal(){
  return typeof window.showSaveFilePicker === "function" && typeof window.showOpenFilePicker === "function";
}
function bytesDoBanco(){
  return SQLiteMini.escrever(state.chamados.map(paraLinhaSql));
}
function renderStatusSqlite(){
  const el = $("#sqliteStatus");
  $("#btnDesconectarSqlite").hidden = !arquivoSqlite;
  if(!suportaArquivoLocal()){
    $("#btnConectarSqlite").disabled = true;
    $("#btnAbrirSqlite").disabled = true;
    el.innerHTML = "Este navegador não deixa a página gravar direto em um arquivo do computador. Use <strong>Baixar o banco agora</strong> sempre que quiser a versão atual do .sqlite. Para gravação automática, abra este arquivo no Chrome ou no Edge para computador.";
    return;
  }
  el.innerHTML = arquivoSqlite
    ? `Gravando em <strong>${escapeHtml(arquivoSqlite.name)}</strong>. Abertura, edição, exclusão e importação atualizam o arquivo na hora.` +
      (ultimaGravacao ? ` Última gravação às ${escapeHtml(ultimaGravacao)}.` : "")
    : "Nenhum arquivo conectado. Ao conectar, o banco inteiro é regravado a cada alteração — os dados continuam disponíveis mesmo que o navegador seja limpo.";
}
async function sincronizarSqlite(silencioso){
  if(!arquivoSqlite) return;
  try{
    const gravador = await arquivoSqlite.createWritable();
    await gravador.write(bytesDoBanco());
    await gravador.close();
    const d = new Date();
    ultimaGravacao = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    renderStatusSqlite();
  }catch(e){
    arquivoSqlite = null;
    renderStatusSqlite();
    if(!silencioso) toast("Gravação interrompida", "O sistema perdeu o acesso ao arquivo SQLite. Conecte de novo para retomar.", "err");
  }
}
$("#btnConectarSqlite").addEventListener("click", async () => {
  try{
    arquivoSqlite = await window.showSaveFilePicker({
      suggestedName: "prometheus-chamados.sqlite",
      types: [{ description: "Banco SQLite", accept: { "application/octet-stream": [".sqlite", ".db"] } }]
    });
    await sincronizarSqlite();
    toast("Arquivo conectado", "As alterações passam a ser gravadas nele automaticamente.", "ok");
  }catch(e){
    if(e && e.name !== "AbortError") toast("Não foi possível conectar", "O navegador recusou o acesso ao arquivo.", "err");
  }
});
$("#btnAbrirSqlite").addEventListener("click", async () => {
  try{
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: "Banco SQLite", accept: { "application/octet-stream": [".sqlite", ".db", ".sqlite3"] } }]
    });
    const arq = await handle.getFile();
    const linhas = SQLiteMini.ler(new Uint8Array(await arq.arrayBuffer()));
    const aplicou = await aplicarRegistros(linhas.map(deLinhaSql), `banco ${arq.name}`);
    if(!aplicou) return;
    if(handle.requestPermission){
      const permissao = await handle.requestPermission({ mode: "readwrite" });
      if(permissao !== "granted"){ toast("Somente leitura", "Os chamados foram carregados, mas o arquivo não pôde ser conectado para gravação.", "alert"); return; }
    }
    arquivoSqlite = handle;
    await sincronizarSqlite();
  }catch(e){
    if(e && e.name !== "AbortError") toast("Não foi possível abrir o banco", "Confira se o arquivo é um SQLite válido.", "err");
  }
});
$("#btnDesconectarSqlite").addEventListener("click", () => {
  arquivoSqlite = null; ultimaGravacao = null; renderStatusSqlite();
  toast("Arquivo desconectado", "As alterações deixam de ser gravadas no .sqlite.", "alert");
});
$("#btnBaixarSqlite").addEventListener("click", () => {
  baixarArquivo(`prometheus-chamados-${carimbo()}.sqlite`, bytesDoBanco(), "application/octet-stream");
  toast("Banco gerado", `${state.chamados.length} chamados no arquivo SQLite.`, "ok");
});
$("#btnDumpSql").addEventListener("click", () => {
  baixarArquivo(`prometheus-chamados-${carimbo()}.sql`, SQLiteMini.dump(state.chamados.map(paraLinhaSql)), "application/sql;charset=utf-8");
  toast("Dump gerado", "Arquivo .sql com o CREATE TABLE e os INSERTs.", "ok");
});
