"use strict";

const SQLiteMini = (() => {
  const TABELA = "chamados";
  const COLUNAS = ["id","solicitante","local","patrimonio","patrimonio_novo","tipo",
                   "abertura","conclusao","tempo_minutos","defeito","solucao",
                   "anotacoes","status","origem","criado_em","atualizado_em"];
  const SQL_CRIA =
    "CREATE TABLE chamados (\n" +
    "  id TEXT,\n  solicitante TEXT,\n  local TEXT,\n  patrimonio TEXT,\n" +
    "  patrimonio_novo TEXT,\n  tipo TEXT,\n  abertura TEXT,\n  conclusao TEXT,\n" +
    "  tempo_minutos INTEGER,\n  defeito TEXT,\n  solucao TEXT,\n  anotacoes TEXT,\n" +
    "  status TEXT,\n  origem TEXT,\n  criado_em TEXT,\n  atualizado_em TEXT\n)";

  const enc = new TextEncoder();
  const dec = new TextDecoder("utf-8");

  
  function escreverVarint(n){
    if(n < 0) throw new Error("varint negativo");
    if(n <= 0x7f) return [n];
    const partes = [];
    let v = n;
    while(v > 0){ partes.unshift(v % 128); v = Math.floor(v / 128); }
    for(let i = 0; i < partes.length - 1; i++) partes[i] |= 0x80;
    return partes;
  }
  function lerVarint(buf, pos){
    let valor = 0;
    for(let i = 0; i < 8; i++){
      const b = buf[pos + i];
      valor = valor * 128 + (b & 0x7f);
      if(!(b & 0x80)) return [valor, i + 1];
    }
    valor = valor * 256 + buf[pos + 8];
    return [valor, 9];
  }

  
  function serializar(v){
    if(v === null || v === undefined) return { tipo: 0, bytes: [] };
    if(typeof v === "number" && Number.isFinite(v) && Number.isInteger(v)){
      const b = new Array(8);
      let x = BigInt(v);
      if(x < 0n) x += 1n << 64n;
      for(let i = 7; i >= 0; i--){ b[i] = Number(x & 0xffn); x >>= 8n; }
      return { tipo: 6, bytes: b };
    }
    const bytes = Array.from(enc.encode(String(v)));
    return { tipo: 13 + 2 * bytes.length, bytes };
  }
  function montarRegistro(valores){
    const partes = valores.map(serializar);
    const tipos = partes.map(p => escreverVarint(p.tipo));
    const tamTipos = tipos.reduce((a, t) => a + t.length, 0);
    let n = 1;
    for(let i = 0; i < 5; i++){
      const novo = escreverVarint(n + tamTipos).length;
      if(novo === n) break;
      n = novo;
    }
    let saida = escreverVarint(n + tamTipos);
    tipos.forEach(t => { saida = saida.concat(t); });
    partes.forEach(p => { saida = saida.concat(p.bytes); });
    return saida;
  }

  
  function escrever(registros, tamanhoPagina){
    const linhas = registros.map((c, i) => ({
      rowid: i + 1,
      payload: montarRegistro(COLUNAS.map(col => c[col] === undefined ? null : c[col]))
    }));

    let pagina = tamanhoPagina || 4096;
    const maiorPayload = linhas.reduce((m, l) => Math.max(m, l.payload.length), 0);
    if(!tamanhoPagina && maiorPayload > pagina - 35) pagina = 65536;

    const util = pagina;                       
    const maxLocal = util - 35;
    const minLocal = Math.floor((util - 12) * 32 / 255) - 23;

    const paginas = [];                        
    const extras = [];                         

    function reservarOverflow(resto){

      const blocos = [];
      const cap = util - 4;
      for(let i = 0; i < resto.length; i += cap) blocos.push(resto.slice(i, i + cap));
      const inicio = extras.length;
      blocos.forEach(b => extras.push(b));
      return { inicio, qtd: blocos.length };
    }

    const celulas = linhas.map(l => {
      const total = l.payload.length;
      let local = total, over = null;
      if(total > maxLocal){
        local = minLocal + ((total - minLocal) % (util - 4));
        if(local > maxLocal) local = minLocal;
        over = reservarOverflow(l.payload.slice(local));
      }
      const corpo = escreverVarint(total)
        .concat(escreverVarint(l.rowid))
        .concat(l.payload.slice(0, local));
      return { rowid: l.rowid, corpo, over, tamanhoSemOver: corpo.length };
    });

    const folhas = [];
    let atual = { celulas: [], bytes: 0 };
    celulas.forEach(cel => {
      const custo = cel.corpo.length + (cel.over ? 4 : 0) + 2;
      if(atual.celulas.length && 8 + atual.bytes + custo > pagina){
        folhas.push(atual);
        atual = { celulas: [], bytes: 0 };
      }
      atual.celulas.push(cel);
      atual.bytes += custo;
    });
    folhas.push(atual);

    const raizEhInterior = folhas.length > 1;
    const primeiraFolha = raizEhInterior ? 3 : 2;
    const numFolhas = folhas.length;
    const primeiroOverflow = primeiraFolha + numFolhas;
    const totalPaginas = 1 + (raizEhInterior ? 1 : 0) + numFolhas + extras.length;

    if(raizEhInterior && (12 + (numFolhas - 1) * (4 + 9) + (numFolhas - 1) * 2) > pagina){
      if(pagina < 65536) return escrever(registros, 65536);
      throw new Error("volume acima do suportado pelo gerador");
    }

    const buffer = new Uint8Array(totalPaginas * pagina);
    const vis = new DataView(buffer.buffer);

    function escreverPaginaFolha(numeroPagina, grupo, base){
      const off = (numeroPagina - 1) * pagina;
      let conteudo = pagina;
      const ponteiros = [];
      grupo.celulas.forEach(cel => {
        let corpo = cel.corpo;
        if(cel.over){
          const pag = primeiroOverflow + cel.over.inicio;
          corpo = corpo.concat([(pag >> 24) & 255, (pag >> 16) & 255, (pag >> 8) & 255, pag & 255]);
        }
        conteudo -= corpo.length;
        ponteiros.push(conteudo);
        buffer.set(Uint8Array.from(corpo), off + conteudo);
      });
      buffer[off + base] = 0x0d;
      vis.setUint16(off + base + 1, 0);
      vis.setUint16(off + base + 3, grupo.celulas.length);
      vis.setUint16(off + base + 5, conteudo === 65536 ? 0 : conteudo);
      buffer[off + base + 7] = 0;
      ponteiros.forEach((p, i) => vis.setUint16(off + base + 8 + i * 2, p));
    }

    folhas.forEach((grupo, i) => escreverPaginaFolha(primeiraFolha + i, grupo, 0));

    if(raizEhInterior){
      const off = pagina; 
      const cels = [];
      for(let i = 0; i < numFolhas - 1; i++){
        const filho = primeiraFolha + i;
        const maiorChave = folhas[i].celulas[folhas[i].celulas.length - 1].rowid;
        cels.push([(filho >> 24) & 255, (filho >> 16) & 255, (filho >> 8) & 255, filho & 255]
          .concat(escreverVarint(maiorChave)));
      }
      let conteudo = pagina;
      const ponteiros = [];
      cels.forEach(c => {
        conteudo -= c.length;
        ponteiros.push(conteudo);
        buffer.set(Uint8Array.from(c), off + conteudo);
      });
      buffer[off] = 0x05;
      vis.setUint16(off + 1, 0);
      vis.setUint16(off + 3, cels.length);
      vis.setUint16(off + 5, conteudo === 65536 ? 0 : conteudo);
      buffer[off + 7] = 0;
      vis.setUint32(off + 8, primeiraFolha + numFolhas - 1); 
      ponteiros.forEach((p, i) => vis.setUint16(off + 12 + i * 2, p));
    }

    extras.forEach((bloco, i) => {
      const num = primeiroOverflow + i;
      const off = (num - 1) * pagina;
      const proximo = (i + 1 < extras.length) ? num + 1 : 0;
      vis.setUint32(off, proximo);
      buffer.set(Uint8Array.from(bloco), off + 4);
    });

    const registroMaster = montarRegistro(["table", TABELA, TABELA, 2, SQL_CRIA]);
    const celulaMaster = escreverVarint(registroMaster.length)
      .concat(escreverVarint(1))
      .concat(registroMaster);
    const inicioConteudo = pagina - celulaMaster.length;
    buffer.set(Uint8Array.from(celulaMaster), inicioConteudo);
    buffer[100] = 0x0d;
    vis.setUint16(101, 0);
    vis.setUint16(103, 1);
    vis.setUint16(105, inicioConteudo);
    buffer[107] = 0;
    vis.setUint16(108, inicioConteudo);

    buffer.set(enc.encode("SQLite format 3"), 0);
    buffer[15] = 0;
    vis.setUint16(16, pagina === 65536 ? 1 : pagina);
    buffer[18] = 1; buffer[19] = 1; buffer[20] = 0;
    buffer[21] = 64; buffer[22] = 32; buffer[23] = 32;
    vis.setUint32(24, 1);            
    vis.setUint32(28, totalPaginas); 
    vis.setUint32(32, 0); vis.setUint32(36, 0);
    vis.setUint32(40, 1);            
    vis.setUint32(44, 4);            
    vis.setUint32(48, 0); vis.setUint32(52, 0);
    vis.setUint32(56, 1);            
    vis.setUint32(60, 0); vis.setUint32(64, 0); vis.setUint32(68, 0);
    vis.setUint32(92, 1);
    vis.setUint32(96, 3045000);
    return buffer;
  }

  
  function ler(bytes){
    const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if(dec.decode(buf.slice(0, 15)) !== "SQLite format 3") throw new Error("não é um arquivo SQLite");
    const vis = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let pagina = vis.getUint16(16);
    if(pagina === 1) pagina = 65536;
    const reservado = buf[20];
    const util = pagina - reservado;

    function lerPayload(pos, total){
      const maxLocal = util - 35;
      if(total <= maxLocal) return { dados: buf.slice(pos, pos + total), fim: pos + total };
      const minLocal = Math.floor((util - 12) * 32 / 255) - 23;
      let local = minLocal + ((total - minLocal) % (util - 4));
      if(local > maxLocal) local = minLocal;
      const partes = [buf.slice(pos, pos + local)];
      let prox = new DataView(buf.buffer, buf.byteOffset + pos + local, 4).getUint32(0);
      let restante = total - local;
      while(prox > 0 && restante > 0){
        const off = (prox - 1) * pagina;
        const pedaco = Math.min(restante, util - 4);
        partes.push(buf.slice(off + 4, off + 4 + pedaco));
        restante -= pedaco;
        prox = new DataView(buf.buffer, buf.byteOffset + off, 4).getUint32(0);
      }
      const dados = new Uint8Array(total);
      let p = 0;
      partes.forEach(x => { dados.set(x, p); p += x.length; });
      return { dados, fim: pos + local + 4 };
    }
    function decodificar(dados){
      const [tamHeader, n] = lerVarint(dados, 0);
      const tipos = [];
      let pos = n;
      while(pos < tamHeader){
        const [t, avanco] = lerVarint(dados, pos);
        tipos.push(t); pos += avanco;
      }
      let corpo = tamHeader;
      return tipos.map(t => {
        if(t === 0) return null;
        if(t >= 1 && t <= 6){
          const largura = [0,1,2,3,4,6,8][t];
          let v = 0n;
          for(let i = 0; i < largura; i++) v = (v << 8n) | BigInt(dados[corpo + i]);
          const bits = BigInt(largura * 8);
          if(v >= (1n << (bits - 1n))) v -= (1n << bits);
          corpo += largura;
          return Number(v);
        }
        if(t === 7){ const v = new DataView(dados.buffer, dados.byteOffset + corpo, 8).getFloat64(0); corpo += 8; return v; }
        if(t === 8) return 0;
        if(t === 9) return 1;
        if(t % 2 === 0){ const len = (t - 12) / 2; const v = buf.slice(0,0); corpo += len; return v; }
        const len = (t - 13) / 2;
        const texto = dec.decode(dados.slice(corpo, corpo + len));
        corpo += len;
        return texto;
      });
    }
    function percorrer(numeroPagina, saida, visitadas){
      if(visitadas.has(numeroPagina) || visitadas.size > 100000) return;
      visitadas.add(numeroPagina);
      const off = (numeroPagina - 1) * pagina;
      const base = numeroPagina === 1 ? 100 : 0;
      const tipo = buf[off + base];
      const nCells = vis.getUint16(off + base + 3);
      if(tipo === 0x0d){
        for(let i = 0; i < nCells; i++){
          const ptr = vis.getUint16(off + base + 8 + i * 2);
          let pos = off + ptr;
          const [total, a] = lerVarint(buf, pos); pos += a;
          const [, b] = lerVarint(buf, pos); pos += b;
          saida.push(decodificar(lerPayload(pos, total).dados));
        }
      }else if(tipo === 0x05){
        const cabecalho = base + 12;
        for(let i = 0; i < nCells; i++){
          const ptr = vis.getUint16(off + cabecalho + i * 2);
          percorrer(vis.getUint32(off + ptr), saida, visitadas);
        }
        percorrer(vis.getUint32(off + base + 8), saida, visitadas);
      }
    }

    const master = [];
    percorrer(1, master, new Set());
    const tabela = master.find(r => r[0] === "table" && String(r[1]).toLowerCase() === TABELA)
               || master.find(r => r[0] === "table");
    if(!tabela) throw new Error("nenhuma tabela encontrada no arquivo");

    const criacao = String(tabela[4] || "");
    const dentro = criacao.slice(criacao.indexOf("(") + 1, criacao.lastIndexOf(")"));
    const colunas = dentro.split(",").map(t => t.trim().split(/\s+/)[0].replace(/["`\[\]]/g, "")).filter(Boolean);

    const linhas = [];
    percorrer(Number(tabela[3]), linhas, new Set());
    return linhas.map(vals => {
      const obj = {};
      colunas.forEach((c, i) => { obj[c] = vals[i] === undefined ? null : vals[i]; });
      return obj;
    });
  }

  
  function texto(v){
    return v == null ? "NULL" : "'" + String(v).replace(/'/g, "''") + "'";
  }
  function dump(registros){
    const linhas = ["PRAGMA foreign_keys=OFF;", "BEGIN TRANSACTION;", SQL_CRIA + ";"];
    registros.forEach(c => {
      const vals = COLUNAS.map(col => {
        const v = c[col];
        return (typeof v === "number" && Number.isInteger(v)) ? String(v) : texto(v == null ? null : v);
      });
      linhas.push(`INSERT INTO ${TABELA} (${COLUNAS.join(", ")}) VALUES (${vals.join(", ")});`);
    });
    linhas.push("COMMIT;");
    return linhas.join("\n") + "\n";
  }
  function lerDump(txt){
    const registros = [];
    const re = /INSERT\s+INTO\s+[`"\[]?chamados[`"\]]?\s*(?:\(([^)]*)\))?\s*VALUES\s*/gi;
    let m;
    while((m = re.exec(txt)) !== null){
      const cols = m[1] ? m[1].split(",").map(c => c.trim().replace(/["`\[\]]/g, "")) : COLUNAS.slice();
      let i = re.lastIndex;
      while(i < txt.length && txt[i] !== "(") i++;
      i++;
      const vals = [];
      let atual = "", emTexto = false;
      while(i < txt.length){
        const ch = txt[i];
        if(emTexto){
          if(ch === "'"){
            if(txt[i+1] === "'"){ atual += "'"; i += 2; continue; }
            emTexto = false; i++; continue;
          }
          atual += ch; i++; continue;
        }
        if(ch === "'"){ emTexto = true; atual = atual.trim() === "" ? "" : atual; i++; continue; }
        if(ch === "," ){ vals.push(atual.trim()); atual = ""; i++; continue; }
        if(ch === ")"){ vals.push(atual.trim()); i++; break; }
        atual += ch; i++;
      }
      const obj = {};
      cols.forEach((c, k) => {
        let v = vals[k];
        if(v === undefined) v = null;
        else if(/^NULL$/i.test(v)) v = null;
        obj[c] = v;
      });
      registros.push(obj);
      re.lastIndex = i;
    }
    return registros;
  }

  return { escrever, ler, dump, lerDump, COLUNAS, TABELA, SQL_CRIA };
})();
