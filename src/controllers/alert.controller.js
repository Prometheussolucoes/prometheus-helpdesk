const INTERVALO_ALERTA = 60 * 60 * 1000;

function aplicarConfigNaTela(){
  $("#cfgSom").checked = !!state.config.som;
  $("#cfgDesktop").checked = !!state.config.desktop;
  atualizarHintProximoAlerta();
}
$("#cfgSom").addEventListener("change", () => { state.config.som = $("#cfgSom").checked; persistir(); });
$("#cfgDesktop").addEventListener("change", async () => {
  const querAtivar = $("#cfgDesktop").checked;
  if(querAtivar && "Notification" in window && Notification.permission !== "granted"){
    try{
      const p = await Notification.requestPermission();
      if(p !== "granted"){
        $("#cfgDesktop").checked = false;
        state.config.desktop = false;
        persistir();
        toast("Notificação bloqueada", "O navegador não liberou o aviso do sistema. O alerta na tela continua funcionando.", "alert");
        return;
      }
    }catch(e){  }
  }
  state.config.desktop = querAtivar;
  persistir();
});

function bipe(){
  if(!state.config.som) return;
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    const ctx = new Ctx();
    const tocar = (freq, inicio, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + inicio);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + inicio + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + inicio + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + inicio);
      osc.stop(ctx.currentTime + inicio + dur + 0.02);
    };
    tocar(660, 0, 0.16);
    tocar(880, 0.2, 0.22);
    setTimeout(() => { try{ ctx.close(); }catch(e){} }, 900);
  }catch(e){  }
}
function dispararAlerta(){
  const n = abertos().length;
  if(!n) return;
  const maisAntigo = abertos().sort((a, b) => new Date(a.abertura) - new Date(b.abertura))[0];
  const espera = fmtDuracao(Math.round((Date.now() - new Date(maisAntigo.abertura)) / 60000));
  const titulo = n === 1 ? "1 chamado aguardando fechamento" : `${n} chamados aguardando fechamento`;
  const msg = `O mais antigo é ${maisAntigo.id}, parado há ${espera}.`;
  toast(titulo, msg, "alert", 12000);
  bipe();
  if(state.config.desktop && "Notification" in window && Notification.permission === "granted"){
    try{ new Notification("PROMETHEUS — " + titulo, { body: msg }); }catch(e){}
  }
}
function atualizarHintProximoAlerta(){
  const el = $("#nextAlertHint");
  if(!el) return;
  if(!abertos().length){ el.textContent = "Sem chamados abertos — nada a lembrar."; return; }
  const base = state.config.ultimoAlerta ? new Date(state.config.ultimoAlerta).getTime() : Date.now();
  const restante = Math.max(0, INTERVALO_ALERTA - (Date.now() - base));
  el.textContent = `Próximo lembrete em ${Math.ceil(restante / 60000)} min.`;
}
$("#btnTestAlert").addEventListener("click", () => {
  if(!abertos().length){ toast("Fila vazia", "Não há chamados em aberto para lembrar agora.", "alert"); return; }
  dispararAlerta();
});

function tique(){
  const agora = new Date();
  $("#clockText").textContent = `${pad(agora.getHours())}:${pad(agora.getMinutes())}`;
  if($("#panel-fila").classList.contains("active")) renderFila();
  if($("#panel-dashboard").classList.contains("active")) renderDashboard();
  atualizarHintProximoAlerta();

  if(abertos().length){
    const base = state.config.ultimoAlerta ? new Date(state.config.ultimoAlerta).getTime() : null;
    if(base == null){
      state.config.ultimoAlerta = new Date().toISOString();
      persistir();
    }else if(Date.now() - base >= INTERVALO_ALERTA){
      state.config.ultimoAlerta = new Date().toISOString();
      persistir();
      dispararAlerta();
    }
  }
}
