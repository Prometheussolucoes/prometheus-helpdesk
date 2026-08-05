const CONFIG_PADRAO = { som: true, desktop: false, ultimoAlerta: null };
let state = { chamados: [], config: Object.assign({}, CONFIG_PADRAO) };
let salvandoPromise = Promise.resolve();

async function carregarBase(){
  const bruto = await Store.ler();
  if(!bruto){ return; }
  try{
    const dados = typeof bruto === "string" ? JSON.parse(bruto) : bruto;
    if(Array.isArray(dados)){
      state.chamados = dados;
    }else{
      state.chamados = Array.isArray(dados.chamados) ? dados.chamados : [];
      state.config = Object.assign({}, CONFIG_PADRAO, dados.config || {});
    }
  }catch(e){
    console.error("Base ilegível:", e);
    toast("Não foi possível ler a base", "O arquivo salvo está corrompido. Restaure uma cópia de segurança.", "err");
  }
  state.chamados.forEach(sanear);
}
function sanear(c){
  c.status = c.status === "CONCLUIDO" ? "CONCLUIDO" : "ABERTO";
  c.solicitante = c.solicitante || "Não informado";
  c.local = c.local || "Não informado";
  c.patrimonio = c.patrimonio || "N/A";
  c.patrimonioNovo = c.patrimonioNovo || "";
  c.tipo = casarTipo(c.tipo) || c.tipo || "Manutenção";
  c.defeito = c.defeito || "";
  c.solucao = c.solucao || "";
  c.anotacoes = c.anotacoes || "";
  c.origem = c.origem || "manual";
  if(!c.abertura) c.abertura = new Date().toISOString();
  if(c.status === "ABERTO") c.conclusao = null;
  return c;
}
function persistir(){
  const payload = JSON.stringify({ versao: 1, config: state.config, chamados: state.chamados });
  salvandoPromise = Store.gravar(payload).then(ok => {
    if(!ok) toast("Salvo apenas nesta sessão", "O navegador bloqueou o armazenamento. Baixe uma cópia de segurança antes de fechar.", "err");
    if(typeof sincronizarSqlite === "function") sincronizarSqlite();
    return ok;
  });
  return salvandoPromise;
}

function gerarId(dataAbertura, reservados){
  const d = dataAbertura instanceof Date ? dataAbertura : new Date(dataAbertura || Date.now());
  const base = isNaN(d) ? new Date() : d;
  const prefixo = `INC-${base.getFullYear()}${pad(base.getMonth()+1)}${pad(base.getDate())}-`;
  let maior = 0;
  const olhar = (id) => {
    if(typeof id === "string" && id.indexOf(prefixo) === 0){
      const n = parseInt(id.slice(prefixo.length), 10);
      if(!isNaN(n) && n > maior) maior = n;
    }
  };
  state.chamados.forEach(c => olhar(c.id));
  if(reservados) reservados.forEach(olhar);
  return prefixo + String(maior + 1).padStart(4, "0");
}

function criarChamado(dados, reservados){
  const abertura = dados.abertura instanceof Date ? dados.abertura : new Date(dados.abertura);
  const chamado = sanear({
    id: gerarId(abertura, reservados),
    solicitante: dados.solicitante,
    local: dados.local,
    patrimonio: dados.patrimonio,
    patrimonioNovo: dados.patrimonioNovo || "",
    tipo: dados.tipo || "Manutenção",
    abertura: abertura.toISOString(),
    conclusao: dados.conclusao ? new Date(dados.conclusao).toISOString() : null,
    defeito: dados.defeito || "",
    solucao: dados.solucao || "",
    anotacoes: dados.anotacoes || "",
    status: dados.status === "CONCLUIDO" ? "CONCLUIDO" : "ABERTO",
    origem: dados.origem || "manual",
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  });
  state.chamados.push(chamado);
  return chamado;
}
function buscarChamado(id){ return state.chamados.find(c => c.id === id) || null; }
function atualizarChamado(id, patch){
  const c = buscarChamado(id);
  if(!c) return null;
  Object.keys(patch).forEach(k => { if(k !== "id") c[k] = patch[k]; });
  c.atualizadoEm = new Date().toISOString();
  sanear(c);
  return c;
}
function deletarChamado(id){
  const i = state.chamados.findIndex(c => c.id === id);
  if(i < 0) return false;
  state.chamados.splice(i, 1);
  return true;
}
function chavesDuplicidade(c){
  const dia = c.abertura ? new Date(c.abertura) : null;
  const marca = dia && !isNaN(dia) ? `${dia.getFullYear()}${pad(dia.getMonth()+1)}${pad(dia.getDate())}` : "";
  return `${normalize(c.solicitante)}|${normalize(c.patrimonio)}|${normalize(c.local)}|${marca}`;
}
