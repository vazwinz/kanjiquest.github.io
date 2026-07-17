/* ============================================================
   CHALLENGE  —  challenge.jsx
   Modo de teste puro. Lê a MESMA fonte (window.GLYPHS) e pode
   filtrar pelos kanji aprendidos no SRS — mas guarda estatísticas
   PRÓPRIAS (kanjiquest.challenge) e NUNCA mexe no agendamento do SRS.
   Mecânicas herdadas do nosso jogo de hiragana: MC (teclas 1–4),
   ⚡ relâmpago, streak/combos, áudio Web Audio, mapa de erros, histórico.
   ============================================================ */
const { useState: useStateC, useEffect: useEffectC, useRef: useRefC, useMemo: useMemoC, useCallback: useCallbackC } = React;

/* ---------- AUDIO ---------- */
/* motor compartilhado com os Estudos — ver sfx.jsx */
const Sfx = window.Sfx;

/* ---------- stats store (separado do SRS) ---------- */
const CKEY = 'kanjiquest.challenge';
function loadC(){ try{ return JSON.parse(localStorage.getItem(CKEY)||'{}'); }catch(e){ return {}; } }
function saveC(s){ try{ localStorage.setItem(CKEY, JSON.stringify(s)); }catch(e){} }
function getCS(){ return loadC().cs || {}; }
function bumpCS(char, ok){ const s=loadC(); const cs=s.cs||{}; if(!cs[char]) cs[char]={a:0,e:0}; cs[char].a++; if(!ok) cs[char].e++; s.cs=cs; saveC(s); }
function pushSess(rec){ const s=loadC(); const a=s.sess||[]; a.unshift(rec); if(a.length>20)a.length=20; s.sess=a; saveC(s); }
function getSess(){ return loadC().sess || []; }

function shuffleC(a){ const r=[...a]; for(let i=r.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [r[i],r[j]]=[r[j],r[i]]; } return r; }

/* quais glifos estão "aprendidos" no SRS (só leitura) */
function learnedGlyphs(){
  try{ const st=window.SRS.load(); if(!st||!st.cards) return []; return window.GLYPHS.filter(g=>st.cards[g.id]); }
  catch(e){ return []; }
}

/* ---------- leituras (kanji → hiragana) ---------- */
/* converte katakana (leitura on) para hiragana */
function kata2hira(s){ return s.replace(/[\u30a1-\u30f6]/g, c=>String.fromCharCode(c.charCodeAt(0)-0x60)); }
/* extrai as leituras de um glifo como hiragana limpo (sem romaji, sem ponto de okurigana) */
function readingsOf(g){
  const out=[];
  [g.kun, g.on].forEach(r=>{
    if(!r || r==='—') return;
    let k = r.split('(')[0].trim().replace(/[.\u30fb・,、\s]/g,'');
    k = kata2hira(k);
    if(k && !out.includes(k)) out.push(k);
  });
  return out;
}
function hasReading(g){ return readingsOf(g).length>0; }

/* ---------- CONFIG ---------- */
function ChallengeConfig({ onStart }){
  const learned = learnedGlyphs();
  const scopes = [
    { id:'learned', label:'Aprendidos', count: learned.length, hint:'sua coleção' },
    ...window.LEVELS.map(l=>({ id:l, label:l, count: window.glyphsByLevel(l).length, hint:'nível JLPT' })),
    { id:'all', label:'Todos', count: window.GLYPHS.length, hint:'tudo' },
  ];
  const [scope, setScope] = useStateC(learned.length>=4 ? 'learned' : 'all');
  const [len, setLen] = useStateC(12);
  const [lightning, setLightning] = useStateC(false);
  const [sound, setSound] = useStateC(true);
  const [mode, setMode] = useStateC('meaning');

  function poolFor(sc, m){
    if(m==='kana') return window.KATAKANA;
    if(sc==='learned') return learnedGlyphs();
    if(sc==='all') return window.GLYPHS;
    return window.glyphsByLevel(sc);
  }
  const pool = poolFor(scope, mode);
  const readablePool = (mode==='reading'||mode==='kana') ? pool.filter(hasReading) : pool;
  const canStart = readablePool.length >= 4;
  const effScope = mode==='kana' ? 'kana' : scope;

  return (
    <div className="step ch-config">
      <div className="ch-hero">
        <div className="ch-mark">挑戦</div>
        <h2>Challenge</h2>
        <p>Quizzes rápidos contra o relógio e a sua sequência. Testa o que você já viu — <b>sem mexer no seu agendamento de revisões</b>.</p>
      </div>

      <div className="cfg-block">
        <div className="cfg-lbl">Modo</div>
        <div className="cfg-grid c3">
          <button className={'pill'+(mode==='meaning'?' sel':'')} onClick={()=>{setMode('meaning');Sfx.click();}}>意味 · Significado<small>kanji ⇄ significado</small></button>
          <button className={'pill'+(mode==='reading'?' sel':'')} onClick={()=>{setMode('reading');Sfx.click();}}>読み · Leitura<small>kanji → hiragana</small></button>
          <button className={'pill'+(mode==='kana'?' sel':'')} onClick={()=>{setMode('kana');Sfx.click();}}>カタカナ · Bônus<small>katakana → romaji</small></button>
        </div>
      </div>

      {mode==='kana' ? (
        <div className="cfg-block">
          <div className="cfg-lbl">Escopo</div>
          <div className="ch-note">46 caracteres básicos (gojūon) + dakuten/handakuten (ガ, パ etc.) — {window.KATAKANA.length} no total.</div>
        </div>
      ) : (
        <div className="cfg-block">
          <div className="cfg-lbl">Escopo</div>
          <div className="cfg-grid">
            {scopes.map(s=>(
              <button key={s.id} className={'pill'+(scope===s.id?' sel':'')} disabled={s.count<4}
                onClick={()=>{ setScope(s.id); Sfx.click(); }}>
                {s.label}<small>{s.count} kanji</small>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="cfg-block">
        <div className="cfg-lbl">Tamanho da rodada</div>
        <div className="cfg-grid c3">
          {[8,12,20].map(n=>(
            <button key={n} className={'pill'+(len===n?' sel':'')} onClick={()=>{setLen(n);Sfx.click();}}>{n}<small>questões</small></button>
          ))}
        </div>
      </div>

      <div className="cfg-block">
        <div className="cfg-lbl">Opções</div>
        <div className="cfg-grid c2">
          <button className={'pill'+(lightning?' sel':'')} onClick={()=>{setLightning(v=>!v);Sfx.click();}}>⚡ Relâmpago<small>kanji some em 1,5s</small></button>
          <button className={'pill'+(sound?' sel':'')} onClick={()=>{setSound(v=>!v);Sfx.click();}}>🔊 Sons<small>feedback sonoro</small></button>
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-accent" disabled={!canStart} style={{padding:'15px 38px',fontSize:'17px'}}
          onClick={()=>{ Sfx.on=sound; onStart({ scope: effScope, pool, len: Math.min(len, readablePool.length), lightning, sound, mode }); }}>
          {canStart ? 'Começar challenge →' : (mode==='reading' ? 'Poucos kanji com leitura aqui' : 'Aprenda 4+ kanji primeiro')}
        </button>
      </div>
    </div>
  );
}

/* ---------- GAME ---------- */
function ChallengeGame({ cfg, onEnd }){
  const mode = cfg.mode || 'meaning';
  const readPool = useMemoC(()=> (mode==='kana'?window.KATAKANA:window.GLYPHS).filter(hasReading), [mode]);
  const queue = useMemoC(()=>{
    let pool = cfg.pool;
    if(mode==='reading'||mode==='kana') pool = pool.filter(hasReading);
    return shuffleC(pool).slice(0, cfg.len);
  }, []);
  const [qi, setQi] = useStateC(0);
  const [picked, setPicked] = useStateC(null);
  const [correct, setCorrect] = useStateC(0);
  const [streak, setStreak] = useStateC(0);
  const [best, setBest] = useStateC(0);
  const [hidden, setHidden] = useStateC(false);   // lightning
  const [burst, setBurst] = useStateC(null);
  const wrongIds = useRefC([]);
  const lightTimer = useRefC(null);
  const advTimer = useRefC(null);

  const item = queue[qi];
  // direção: leitura → k2r (kanji→hiragana); relâmpago força kanji→significado; senão alterna
  const dir = useMemoC(()=> (mode==='reading'||mode==='kana') ? 'k2r' : (cfg.lightning ? 'k2m' : (Math.random()<0.5 ? 'k2m' : 'm2k')), [qi]);

  const options = useMemoC(()=>{
    if(dir==='k2r'){
      const reads = readingsOf(item);
      const ans = reads[0];
      const tset = new Set(reads);
      const used = new Set([ans]);
      const others=[];
      for(const x of shuffleC(readPool)){
        if(x.id===item.id) continue;
        const r = readingsOf(x)[0];
        if(!r || used.has(r) || tset.has(r)) continue;
        used.add(r); others.push({label:r, ok:false});
        if(others.length===3) break;
      }
      return shuffleC([{label:ans, ok:true}, ...others]);
    }
    if(dir==='k2m'){
      const others = shuffleC(window.GLYPHS.filter(x=>x.id!==item.id)).slice(0,3).map(x=>({label:x.kw, ok:false}));
      return shuffleC([{label:item.kw, ok:true}, ...others]);
    } else {
      const others = shuffleC(window.GLYPHS.filter(x=>x.id!==item.id)).slice(0,3).map(x=>({label:x.id, ok:false}));
      return shuffleC([{label:item.id, ok:true}, ...others]);
    }
  }, [qi]);

  // lightning hide
  useEffectC(()=>{
    setHidden(false); setPicked(null);
    clearTimeout(lightTimer.current); clearTimeout(advTimer.current);
    if(cfg.lightning && dir!=='m2k'){
      lightTimer.current = setTimeout(()=>{ setHidden(true); Sfx.bolt(); }, 1500);
    }
    return ()=>{ clearTimeout(lightTimer.current); clearTimeout(advTimer.current); };
  }, [qi]);

  function choose(i){
    if(picked!==null) return;
    clearTimeout(lightTimer.current); setHidden(false);
    setPicked(i);
    const ok = options[i].ok;
    bumpCS(item.id, ok);
    if(ok){
      setCorrect(c=>c+1);
      const ns = streak+1; setStreak(ns); setBest(b=>Math.max(b,ns));
      Sfx.correct();
      if(ns>=3 && ns%3===0){ Sfx.streak(Math.floor(ns/3)); setBurst(`${ns}× 連続`); setTimeout(()=>setBurst(null),1000); }
    } else {
      setStreak(0); Sfx.wrong(); wrongIds.current.push(item.id);
    }
    advTimer.current = setTimeout(next, ok?900:1500);
  }
  function next(){
    if(qi+1 >= queue.length){
      const total=queue.length, acc=Math.round(100*(correct+ (picked!==null&&options[picked]?.ok?0:0))/total);
      finish();
    } else { setQi(qi+1); }
  }
  function finish(){
    const total = queue.length;
    const acc = Math.round(100*correct/total);
    pushSess({ when: Date.now(), scope: cfg.scope, total, correct, acc, best, lightning: cfg.lightning, mode: cfg.mode });
    onEnd({ total, correct, acc, best, wrong: wrongIds.current, scope: cfg.scope });
  }

  // teclado 1-4
  useEffectC(()=>{
    function onKey(e){
      if(picked!==null) return;
      const map={'1':0,'2':1,'3':2,'4':3};
      if(e.key in map){ e.preventDefault(); choose(map[e.key]); }
    }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [picked, qi, streak]);

  const acc = (qi>0||picked!==null) ? Math.round(100*correct/Math.max(1,(qi+(picked!==null?1:0)))) : null;
  const pct = Math.round((qi/queue.length)*100);

  return (
    <div className="step ch-game">
      <div className="ch-pills">
        <div className="ch-pill"><span className="pv" style={{color:'var(--accent)'}}>{streak}</span> 🔥 seq</div>
        <div className="ch-pill"><span className="pv">{acc!=null?acc+'%':'—'}</span> prec</div>
        <div className="ch-pill"><span className="pv">{best}</span> 🏆 rec</div>
        {cfg.lightning && <div className="ch-pill"><span className="pv" style={{color:'var(--accent)'}}>⚡</span> on</div>}
      </div>

      <div className="ch-prog"><span style={{width:pct+'%'}}></span></div>
      <div className="scount">{qi+1} / {queue.length}</div>

      {dir!=='m2k' ? (
        <>
          <div className="grid-wrap">
            <div className={'genko'+(cfg.lightning?' ring':'')}>
              {cfg.lightning && <div className={'ringspin'+(!hidden && picked===null?' run':'')}></div>}
              <span className={'glyph'+(hidden?' faded':'')}>{item.id}</span>
            </div>
          </div>
          <p className="prompt">{dir==='k2r'?(mode==='kana'?'Qual a leitura (romaji)?':'Qual a leitura (hiragana)?'):'Qual o significado?'}</p>
        </>
      ) : (
        <>
          <p className="prompt big-q">Qual kanji significa<br/><b>{item.kw}</b>?</p>
        </>
      )}

      <div className={'options '+(dir==='m2k'?'m2k':'k2m')}>
        {options.map((opt,i)=>{
          let cls='option'+(dir==='m2k'?' k':'');
          if(picked!==null){ if(opt.ok) cls+=' correct'; else if(i===picked) cls+=' wrong'; else cls+=' dim'; }
          return (
            <button key={i} className={cls} disabled={picked!==null} onClick={()=>choose(i)}>
              {dir!=='m2k' && <span className="okey">{i+1}</span>}
              {opt.label}
            </button>
          );
        })}
      </div>

      {burst && <div className="ch-burst">{burst}</div>}
    </div>
  );
}

/* ---------- RESULTS ---------- */
function ChallengeResults({ res, onAgain, onMenu }){
  const [tab, setTab] = useStateC('hm');
  const rank = res.acc===100 ? ['完','Perfeito!'] : res.acc>=80 ? ['良','Muito bem!'] : res.acc>=60 ? ['可','Bom progresso!'] : ['精','Continue treinando!'];
  const cs = getCS();
  const scopePool = res.scope==='kana' ? window.KATAKANA : res.scope==='learned' ? learnedGlyphs() : res.scope==='all' ? window.GLYPHS : window.glyphsByLevel(res.scope);
  const sessions = getSess();

  function heat(g){ const s=cs[g.id]; if(!s||!s.a) return 0; const r=s.e/s.a; return r<0.15?1:r<0.4?2:r<0.7?3:4; }
  const fmtWhen = t => { const d=new Date(t); return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); };
  const scopeLabel = s => s==='learned'?'Aprendidos':s==='all'?'Todos':s==='kana'?'Katakana':s;

  return (
    <div className="step summary">
      <div className="seal" style={{transform:'rotate(-6deg)'}}>{rank[0]}</div>
      <h2>{rank[1]}</h2>
      <p className="sub">Rodada de challenge — suas revisões de estudo seguem intactas.</p>
      <div className="scorecard">
        <div className="s"><div className="n">{res.total}</div><div className="l">Questões</div></div>
        <div className="s"><div className="n" style={{color:'var(--good)'}}>{res.correct}</div><div className="l">Acertos</div></div>
        <div className="s"><div className="n">{res.acc}%</div><div className="l">Precisão</div></div>
      </div>

      <div className="ch-tabs">
        <button className={'ch-tab'+(tab==='hm'?' on':'')} onClick={()=>setTab('hm')}>Mapa de erros</button>
        <button className={'ch-tab'+(tab==='hist'?' on':'')} onClick={()=>setTab('hist')}>Histórico</button>
      </div>

      {tab==='hm' ? (
        <div className="ch-pane">
          <div className="ch-note">Taxa de erro acumulada por kanji (neste escopo)</div>
          <div className="hm-grid">
            {scopePool.map(g=>{
              const h=heat(g); const s=cs[g.id];
              return (
                <div className={'hm-cell h'+h} key={g.id} title={`${g.kw} — ${s?s.e:0} erros / ${s?s.a:0}`}>
                  <span className="hk">{g.id}</span>
                  {s&&s.a>0 && <span className="hb">{s.e}</span>}
                </div>
              );
            })}
          </div>
          <div className="hm-legend">
            <span><i className="d" style={{background:'rgba(255,255,255,.5)',border:'1px solid var(--line)'}}></i>sem dados</span>
            <span><i className="d" style={{background:'var(--good-bg)'}}></i>ótimo</span>
            <span><i className="d" style={{background:'oklch(0.66 0.12 60 / .3)'}}></i>ok</span>
            <span><i className="d" style={{background:'var(--bad-bg)'}}></i>dificuldade</span>
          </div>
        </div>
      ) : (
        <div className="ch-pane">
          <div className="ch-note">Últimas rodadas</div>
          <div className="hist-list">
            {sessions.length===0 && <div className="ch-empty">nenhuma rodada ainda</div>}
            {sessions.map((s,i)=>(
              <div className="hist-row" key={i}>
                <span className="hwhen">{fmtWhen(s.when)}</span>
                <span className="hscope">{scopeLabel(s.scope)}{s.mode==='reading'?' · 読み':''}{s.lightning?' ⚡':''}</span>
                <span className="hacc">{s.correct}/{s.total} · {s.acc}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="actions">
        <button className="btn btn-ghost" onClick={onMenu}>Menu</button>
        <button className="btn btn-accent" onClick={onAgain}>Jogar de novo</button>
      </div>
    </div>
  );
}

/* ---------- COMPONENTE PRINCIPAL ---------- */
function Challenge(){
  const [screen, setScreen] = useStateC('config');
  const [cfg, setCfg] = useStateC(null);
  const [res, setRes] = useStateC(null);

  function start(c){ setCfg(c); setScreen('game'); }
  function end(r){ setRes(r); setScreen('results'); }

  return (
    <div className="stage">
      {screen==='config' && <ChallengeConfig onStart={start} />}
      {screen==='game' && <ChallengeGame key={JSON.stringify(cfg).length+''+Date.now()} cfg={cfg} onEnd={end} />}
      {screen==='results' && <ChallengeResults res={res} onAgain={()=>setScreen('config')} onMenu={()=>setScreen('config')} />}
    </div>
  );
}

window.Challenge = Challenge;
