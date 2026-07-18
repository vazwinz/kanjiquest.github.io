/* ============================================================
   BUSCAR (pesquisa)  —  buscar.jsx  →  window.Buscar
   Pesquisa sobre window.GLYPHS: por kanji, significado (pt),
   ou leitura (kun/on, kana ou romaji). Filtra por nível e por
   "só aprendidos" (lê o SRS, não altera nada).
   ============================================================ */
const { useState: useBsState, useMemo: useBsMemo } = React;

/* normaliza pt-BR: minúsculas + remove acentos (kana fica intacto) */
const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

/* índice de busca por glifo: id + kw + kun + on, normalizado */
function buildHaystack(g){
  return norm([g.id, g.kw, g.kun, g.on].join(' '));
}

/* mapa: id → kanji que o usam como peça ("aparece em") */
const USED_IN = (function(){
  const m = {};
  window.GLYPHS.forEach(g => (g.parts||[]).forEach(p => {
    (m[p] = m[p] || []).push(g.id);
  }));
  return m;
})();

const BS_FILTERS = [
  ['all','Todos'], ['N5','N5'], ['N4','N4'], ['N3','N3'], ['N2','N2'], ['N1','N1'], ['—','Peças'],
];

function readLearned(){
  try {
    const st = window.SRS && window.SRS.load();
    return st ? new Set(Object.keys(st.cards)) : new Set();
  } catch(e){ return new Set(); }
}

function Detail({ g, learned, onPick, onClose }){
  const parts = (g.parts||[]).map(window.G).filter(Boolean);
  const used = (USED_IN[g.id]||[]);
  return (
    <div className="bs-modal" onClick={onClose}>
      <div className="bs-sheet" onClick={e=>e.stopPropagation()}>
        <button className="bs-x" onClick={onClose} aria-label="fechar">×</button>
        <div className="bs-head">
          <div className="bs-glyph">{g.id}</div>
          <div className="bs-headinfo">
            <div className="bm">{g.kw}</div>
            <div className="bs-tags">
              <span className="bs-tag lv">{g.lvl==='—'?'peça-base':g.lvl}</span>
              {g.parts.length===0 ? <span className="bs-tag">átomo</span> : <span className="bs-tag">{g.parts.length} peças</span>}
              {window.CLASS_LABELS && g.cls && g.cls.split(' · ').map((c,i)=>(
                <span className="bs-tag cls" key={i}>{window.CLASS_LABELS[c] || c}</span>
              ))}
              {learned.has(g.id) && <span className="bs-tag ok">✓ aprendido</span>}
            </div>
          </div>
        </div>

        <div className="bs-rd">
          {g.kun && g.kun!=='—' && <span className="chip"><b>kun</b>{g.kun}</span>}
          {g.on && g.on!=='—' && <span className="chip"><b>on</b>{g.on}</span>}
          {g.phon === 'semantico' &&
          <span className="chip phon-note" title="Essa leitura não ajuda a adivinhar o som de nenhum kanji composto que usa essa peça — é radical de sentido, não de som.">
            não prediz som de outros kanji
          </span>}
        </div>

        {parts.length>0 && (
          <div className="bs-blk">
            <div className="bl">Composição</div>
            <div className="bs-parts">
              {parts.map((p,i)=>(
                <button className="bs-pp" key={i} onClick={()=>onPick(p.id)}>
                  <span className="ppk">{p.id}</span>
                  <span className="ppw">{p.kw}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {g.story && (
          <div className="bs-blk">
            <div className="bl">História</div>
            <div className="bs-story">{g.story}</div>
          </div>
        )}

        {g.use && (
          <div className="bs-blk">
            <div className="bl">Uso real</div>
            <div className="bs-story">{g.use === '—' ? 'Só existe dentro de outros kanji — nunca vira palavra sozinha.' : g.use}</div>
          </div>
        )}

        {used.length>0 && (
          <div className="bs-blk">
            <div className="bl">Aparece em ({used.length})</div>
            <div className="bs-used">
              {used.map(id=>(
                <button className="bs-uk" key={id} onClick={()=>onPick(id)}>{id}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Buscar(){
  const [q, setQ] = useBsState('');
  const [lvl, setLvl] = useBsState('all');
  const [onlyLearned, setOnlyLearned] = useBsState(false);
  const [pick, setPick] = useBsState(null); // id aberto no detalhe
  const learned = useBsMemo(readLearned, [pick, onlyLearned]);

  // pré-computa haystack uma vez
  const index = useBsMemo(()=> window.GLYPHS.map(g=>({ g, hay: buildHaystack(g) })), []);

  const nq = norm(q.trim());
  const results = useBsMemo(()=>{
    return index.filter(({g, hay})=>{
      if (lvl!=='all' && g.lvl!==lvl) return false;
      if (onlyLearned && !learned.has(g.id)) return false;
      if (!nq) return true;
      return hay.includes(nq);
    }).map(x=>x.g);
  }, [index, nq, lvl, onlyLearned, learned]);

  const picked = pick ? window.G(pick) : null;

  return (
    <div className="bs">
      <div className="bs-search">
        <span className="mag">探</span>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="kanji, significado ou leitura…  (ex: 海, mar, umi)"
          autoComplete="off" autoCorrect="off" spellCheck="false"
        />
        {q && <button className="clr" onClick={()=>setQ('')} aria-label="limpar">×</button>}
      </div>

      <div className="bs-filters">
        {BS_FILTERS.map(([key,label])=>(
          <button key={key} className={'bs-fp'+(lvl===key?' on':'')} onClick={()=>setLvl(key)}>{label}</button>
        ))}
        <button className={'bs-fp tog'+(onlyLearned?' on':'')} onClick={()=>setOnlyLearned(v=>!v)}>aprendidos</button>
      </div>

      <div className="bs-count">
        {results.length} {results.length===1?'resultado':'resultados'}
        {nq && <> para “<b style={{color:'var(--ink-soft)'}}>{q.trim()}</b>”</>}
      </div>

      {results.length===0 ? (
        <div className="bs-empty">
          <span className="be">無</span>
          Nada encontrado.<br/>Tente o kanji, o significado em português, ou a leitura (kana ou romaji).
        </div>
      ) : (
        <div className="bs-grid">
          {results.map(g=>(
            <button
              key={g.id}
              className={'bs-item'+(learned.has(g.id)?' learned':'')+(g.parts.length===0?' atom':'')}
              onClick={()=>setPick(g.id)}
              title={g.kw}
            >
              <span className="blv">{g.lvl==='—'?'部':g.lvl}</span>
              {learned.has(g.id) && <span className="lp"></span>}
              <span className="bk">{g.id}</span>
              <span className="bw">{g.kw}</span>
            </button>
          ))}
        </div>
      )}

      {picked && (
        <Detail g={picked} learned={learned} onPick={setPick} onClose={()=>setPick(null)} />
      )}
    </div>
  );
}

window.Buscar = Buscar;
