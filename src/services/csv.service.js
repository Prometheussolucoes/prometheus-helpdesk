function detectarSeparador(texto){
  const linha = texto.split(/\r?\n/).find(l => l.trim().length) || "";
  const cont = (ch) => {
    let n = 0, dentro = false;
    for(let i = 0; i < linha.length; i++){
      const c = linha[i];
      if(c === '"') dentro = !dentro;
      else if(c === ch && !dentro) n++;
    }
    return n;
  };
  const opcoes = [[";", cont(";")], [",", cont(",")], ["\t", cont("\t")], ["|", cont("|")]];
  opcoes.sort((a, b) => b[1] - a[1]);
  return opcoes[0][1] > 0 ? opcoes[0][0] : ";";
}
function lerCSV(texto){
  if(texto.charCodeAt(0) === 0xFEFF) texto = texto.slice(1);
  const sep = detectarSeparador(texto);
  const linhas = [];
  let campo = "", linha = [], dentroAspas = false;

  for(let i = 0; i < texto.length; i++){
    const ch = texto[i];
    if(dentroAspas){
      if(ch === '"'){
        if(texto[i+1] === '"'){ campo += '"'; i++; }
        else dentroAspas = false;
      }else campo += ch;
      continue;
    }
    if(ch === '"'){
      if(campo === ""){ dentroAspas = true; }  
      else { campo += ch; }                    
      continue;
    }
    if(ch === sep){ linha.push(campo); campo = ""; continue; }
    if(ch === "\n"){ linha.push(campo); linhas.push(linha); linha = []; campo = ""; continue; }
    if(ch === "\r"){ continue; }
    campo += ch;
  }
  linha.push(campo);
  linhas.push(linha);

  const uteis = linhas.filter(l => l.some(v => String(v).trim() !== ""));
  if(!uteis.length) return { cabecalho: [], linhas: [], sep };

  const cabecalho = uteis[0].map((h, i) => {
    const t = String(h).trim();
    return t || `Coluna ${i + 1}`;
  });
  const corpo = uteis.slice(1).map(l => {
    const obj = {};
    cabecalho.forEach((h, i) => { obj[h] = (l[i] == null ? "" : String(l[i]).trim()); });
    return obj;
  });
  return { cabecalho, linhas: corpo, sep };
}
function campoCSV(valor, sep){
  const s = valor == null ? "" : String(valor);
  return /["\n\r]|^\s|\s$/.test(s) || s.indexOf(sep) >= 0
    ? '"' + s.replace(/"/g, '""') + '"'
    : s;
}
function gerarCSV(lista, sep){
  const colunas = ["ID_Chamado","Solicitante","Local","Patrimonio","Data_Abertura","Data_Conclusao",
                   "Tempo_Atendimento_Minutos","Tempo_Atendimento_Formatado","Defeito","Solucao","Anotacoes","Status",
                   "Tipo","Patrimonio_Novo"];
  const linhas = [colunas.join(sep)];
  lista.forEach(c => {
    const min = tempoAtendimento(c);
    const valores = [
      c.id, c.solicitante, c.local, c.patrimonio,
      fmtDataHora(c.abertura),
      c.conclusao ? fmtDataHora(c.conclusao) : "",
      min == null ? "" : String(min),
      min == null ? "" : fmtDuracao(min),
      c.defeito, c.solucao, c.anotacoes,
      c.status === "CONCLUIDO" ? "CONCLUÍDO" : "ABERTO",
      c.tipo, c.patrimonioNovo
    ];
    linhas.push(valores.map(v => campoCSV(v, sep)).join(sep));
  });
  return "\uFEFF" + linhas.join("\r\n");
}
function baixarArquivo(nome, conteudo, tipo){
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function carimbo(){
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
