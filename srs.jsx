/* ============================================================
   ENGINE SRS — repetição espaçada (SM-2 simplificado)
   Mantém um "estado de memória" por kanji e agenda a próxima
   revisão. É isso que faz a coisa ESCALAR e RETER.
   ============================================================ */

const SRS = (function(){
  const DAY = 24*60*60*1000;
  const KEY = 'kanjiquest.v2';

  // estágios de intervalo (em dias) — visíveis pro usuário
  const STAGES = [0, 1, 3, 7, 16, 35, 90, 180];
  const stageLabel = s => {
    const d = STAGES[Math.min(s, STAGES.length-1)];
    if (d === 0) return 'agora';
    if (d === 1) return '1 dia';
    if (d < 30) return d + ' dias';
    const meses = Math.round(d/30);
    return meses === 1 ? '1 mês' : meses + ' meses';
  };

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch(e){ return null; }
  }
  function blank(){
    return { now: Date.now(), offset: 0, cards: {} };  // cards[id] = {stage, due, seen, lapses}
  }
  function save(state){
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){}
  }

  // relógio real (data do sistema) + deslocamento acumulado pelo botão de demo
  function clock(state){ return Date.now() + (state.offset||0); }

  function card(state, id){
    return state.cards[id] || null;
  }
  function isLearned(state, id){ return !!state.cards[id]; }

  // FOCO por nível: conjunto de ids do nível L + TODAS as peças-base
  // que eles precisam (recursivo), pra composição continuar funcionando.
  // level==='all' (ou vazio) => null (sem filtro).
  function focusSet(level){
    if (!level || level === 'all') return null;
    const out = new Set();
    function addWithDeps(id){
      if (out.has(id)) return;
      out.add(id);
      const g = G(id);
      (g && g.parts || []).forEach(p => { if (G(p)) addWithDeps(p); });
    }
    GLYPHS.filter(g => g.lvl === level).forEach(g => addWithDeps(g.id));
    return out;
  }

  // quais kanji estão DISPONÍVEIS pra aprender agora (pré-requisitos cumpridos)
  function unlockable(state, focus){
    let list = TEACH_ORDER.filter(id => {
      if (isLearned(state, id)) return false;
      const g = G(id);
      // todas as partes que são kanji ensináveis precisam já ter sido aprendidas
      const deps = (g.parts||[]).filter(p => !!G(p));
      return deps.every(p => isLearned(state, p));
    });
    if (focus) list = list.filter(id => focus.has(id));
    return list;
  }

  // revisões vencidas (due <= agora)
  function dueList(state, focus){
    const t = clock(state);
    let ids = Object.keys(state.cards).filter(id => state.cards[id].due <= t);
    if (focus) ids = ids.filter(id => focus.has(id));
    return ids.sort((a,b) => state.cards[a].due - state.cards[b].due);
  }

  function dueCount(state){ return dueList(state).length; }
  function learnedCount(state){ return Object.keys(state.cards).length; }
  // aprendidos dentro do foco (null => coleção inteira)
  function learnedIn(state, focus){
    if (!focus) return learnedCount(state);
    let n = 0; for (const id in state.cards){ if (focus.has(id)) n++; } return n;
  }

  // introduz um kanji novo (após a tela de "aprender")
  function introduce(state, id){
    if (state.cards[id]) return;
    state.cards[id] = { stage: 1, due: clock(state) + STAGES[1]*DAY, seen: 1, lapses: 0 };
    save(state);
  }

  // registra resultado de uma revisão. ok=true sobe de estágio; senão cai.
  function review(state, id, ok){
    const c = state.cards[id];
    if (!c) return;
    c.seen++;
    if (ok){
      c.stage = Math.min(c.stage + 1, STAGES.length - 1);
    } else {
      c.stage = Math.max(c.stage - 2, 1);
      c.lapses++;
    }
    c.due = clock(state) + STAGES[c.stage]*DAY + 5000; // +buffer p/ sair do "due" hoje
    save(state);
    return c;
  }

  // próximo estágio se acertar (pra mostrar no botão)
  function nextStageLabel(state, id){
    const c = state.cards[id];
    if (!c) return stageLabel(1);
    return stageLabel(Math.min(c.stage + 1, STAGES.length - 1));
  }
  function lapseStageLabel(state, id){
    const c = state.cards[id];
    if (!c) return stageLabel(1);
    return stageLabel(Math.max(c.stage - 2, 1));
  }

  // avança o relógio (botão de demo "passar 1 dia") — desloca o relógio real, não o substitui
  function advanceDays(state, n){
    state.offset = (state.offset||0) + n*DAY;
    save(state);
  }

  // monta a fila de uma sessão: revisões vencidas + N novos, INTERCALADO
  function buildSession(state, newLimit, focus){
    const due = dueList(state, focus);
    const news = unlockable(state, focus).slice(0, newLimit);
    const queue = [];
    // intercala: a cada 2 revisões, 1 novo (interleaving)
    let di = 0, ni = 0;
    while (di < due.length || ni < news.length){
      if (di < due.length){ queue.push({ kind:'review', id: due[di++] }); }
      if (di < due.length){ queue.push({ kind:'review', id: due[di++] }); }
      if (ni < news.length){ queue.push({ kind:'learn',  id: news[ni++] }); }
    }
    return queue;
  }

  // distribuição de maturidade pra barra do painel (opcionalmente dentro do foco)
  function maturity(state, focus){
    let novo=0, jovem=0, maduro=0;
    Object.keys(state.cards).forEach(id=>{
      if (focus && !focus.has(id)) return;
      const c = state.cards[id];
      if (c.stage <= 2) novo++;
      else if (c.stage <= 4) jovem++;
      else maduro++;
    });
    return { novo, jovem, maduro };
  }

  return {
    DAY, STAGES, stageLabel,
    load, blank, save,
    card, isLearned, unlockable, dueList, dueCount, learnedCount,
    focusSet, learnedIn,
    introduce, review, nextStageLabel, lapseStageLabel,
    advanceDays, buildSession, maturity, clock,
  };
})();

window.SRS = SRS;
