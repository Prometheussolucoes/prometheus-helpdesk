const Store = (() => {
  const CHAVE = "helpdesk_db";
  let modo = "memoria";
  let cacheMemoria = null;

  const temArtefato = () => typeof window !== "undefined"
    && window.storage && typeof window.storage.get === "function";

  async function ler(){
    if(temArtefato()){
      try{
        const r = await window.storage.get(CHAVE);
        modo = "artefato";
        return r && r.value ? r.value : null;
      }catch(e){
        modo = "artefato";
        return null; 
      }
    }
    try{
      const v = localStorage.getItem(CHAVE);
      modo = "navegador";
      return v;
    }catch(e){
      modo = "memoria";
      return cacheMemoria;
    }
  }
  async function gravar(texto){
    if(temArtefato()){
      try{ await window.storage.set(CHAVE, texto); modo = "artefato"; return true; }
      catch(e){  }
    }
    try{ localStorage.setItem(CHAVE, texto); modo = "navegador"; return true; }
    catch(e){ cacheMemoria = texto; modo = "memoria"; return false; }
  }
  async function limpar(){
    if(temArtefato()){ try{ await window.storage.delete(CHAVE); }catch(e){} }
    try{ localStorage.removeItem(CHAVE); }catch(e){}
    cacheMemoria = null;
  }
  return { ler, gravar, limpar, modo: () => modo };
})();
