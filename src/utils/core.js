"use strict";

const $  = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
const pad = (n) => String(n).padStart(2, "0");

function escapeHtml(v){
  return String(v == null ? "" : v)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function normalize(v){
  return String(v == null ? "" : v)
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().trim().replace(/\s+/g," ");
}

function parseDataFlexivel(valor){
  if(!valor && valor !== 0) return null;
  if(valor instanceof Date) return isNaN(valor) ? null : valor;
  let s = String(valor).trim();
  if(!s) return null;

  if(/^\d{5}(\.\d+)?$/.test(s)){
    const serial = parseFloat(s);
    const ms = Math.round((serial - 25569) * 86400000);
    const d = new Date(ms);
    return isNaN(d) ? null : d;
  }

  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:[\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if(m){
    let ano = parseInt(m[3],10);
    if(ano < 100) ano += ano < 70 ? 2000 : 1900;
    const d = new Date(ano, parseInt(m[2],10)-1, parseInt(m[1],10),
                       parseInt(m[4]||"0",10), parseInt(m[5]||"0",10), parseInt(m[6]||"0",10));
    return isNaN(d) ? null : d;
  }

  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if(m){
    const d = new Date(parseInt(m[1],10), parseInt(m[2],10)-1, parseInt(m[3],10),
                       parseInt(m[4]||"0",10), parseInt(m[5]||"0",10), parseInt(m[6]||"0",10));
    return isNaN(d) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
function paraInput(date){
  if(!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if(isNaN(d)) return "";
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function deInput(valor){
  if(!valor) return null;
  const d = new Date(valor);
  return isNaN(d) ? null : d;
}
function fmtDataHora(iso){
  if(!iso) return "—";
  const d = new Date(iso);
  if(isNaN(d)) return "—";
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function minutosEntre(inicioIso, fimIso){
  const a = new Date(inicioIso), b = new Date(fimIso);
  if(isNaN(a) || isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 60000));
}
function fmtDuracao(min){
  if(min == null || isNaN(min)) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${pad(m)}m`;
}
