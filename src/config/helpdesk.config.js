const TIERS = [
  { limite: 4,   cor: "#8d8d98", nome: "recente" },
  { limite: 24,  cor: "#ffa04d", nome: "aquecendo" },
  { limite: 72,  cor: "#ff6a00", nome: "atrasado" },
  { limite: Infinity, cor: "#ff4d3d", nome: "crítico" }
];
function tierDe(minutos){
  const horas = (minutos || 0) / 60;
  return TIERS.find(t => horas < t.limite) || TIERS[TIERS.length - 1];
}

const POLOS = [
  { nome:"Ponta Negra", endereco:"R. Treze Lot Vilage Ponta Negra, 3 — Ponta Negra, Maricá/RJ, 24922-245" },
  { nome:"Inoã",        endereco:"R. Oito Lot Bsq Fundo, 11 — Bosque Fundo, Maricá/RJ, 24943-160" },
  { nome:"Itaipuaçu",   endereco:"Av. Zumbi dos Palmares — Barroco, Maricá/RJ, 24936-530" },
  { nome:"Centro",      endereco:"R. Pref. Joaquim Mendes, 612 — 20 quadra 89 — Araçatiba, Maricá/RJ, 24900-000" },
  { nome:"IDS",         endereco:"Bairro Flamengo" }
];
function enderecoDe(nome){
  const p = POLOS.find(p => normalize(p.nome) === normalize(nome));
  return p ? p.endereco : "";
}
function casarPolo(texto){
  const n = normalize(texto);
  if(!n) return "";
  let achado = POLOS.find(p => normalize(p.nome) === n);
  if(achado) return achado.nome;
  achado = POLOS.find(p => n.indexOf(normalize(p.nome)) >= 0);
  return achado ? achado.nome : "";
}

const TIPOS = ["Manutenção", "Manutenção preventiva", "Troca de equipamento", "Solicitação de equipamento"];
const PAT_INTERNO = "20261000";   
function casarTipo(texto){
  const n = normalize(texto);
  if(!n) return "";
  const exato = TIPOS.find(t => normalize(t) === n);
  if(exato) return exato;
  if(/preventiv/.test(n)) return "Manutenção preventiva";
  if(/(troca|substitui)/.test(n)) return "Troca de equipamento";
  if(/(solicit|pedido|requisi)/.test(n)) return "Solicitação de equipamento";
  if(/(manuten|corretiv|conserto|reparo)/.test(n)) return "Manutenção";
  return "";
}
function ehInterno(c){ return String(c.patrimonio || "").trim() === PAT_INTERNO; }

function tempoAtendimento(c){
  return c.status === "CONCLUIDO" && c.conclusao ? minutosEntre(c.abertura, c.conclusao) : null;
}
function fmtTempoAtendimento(c){
  const m = tempoAtendimento(c);
  return m == null ? "Não informado" : fmtDuracao(m);
}
