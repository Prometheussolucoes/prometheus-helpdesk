(async function iniciar(){
  await carregarBase();
  limparFormNovo();
  aplicarConfigNaTela();
  renderTudo();

  const textos = {
    artefato: "Os chamados ficam guardados no armazenamento deste aplicativo, ligado à sua conta, e continuam disponíveis quando você reabrir. Ainda assim, baixe a cópia de segurança de tempos em tempos.",
    navegador: "Os chamados ficam guardados neste navegador, neste computador. Limpar os dados de navegação apaga a base — mantenha a cópia de segurança em dia.",
    memoria: "O armazenamento está bloqueado: os chamados existem apenas enquanto esta aba estiver aberta. Baixe a cópia de segurança antes de fechar."
  };
  $("#storageNote").textContent = textos[Store.modo()] || textos.memoria;

  mostrarEndereco("f_localEndereco", "");
  renderStatusSqlite();
  if(abertos().length) abrirAba("fila"); else abrirAba("novo");

  tique();
  setInterval(tique, 60000);
})();
