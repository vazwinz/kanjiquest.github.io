/* ============================================================
   ESTUDOS  —  studies.jsx
   Fluxo de SRS por composição: painel → sessão → resumo.
   Componente autônomo: dono do estado de SRS, pontos e carimbo.
   Lê window.GLYPHS / window.SRS (fonte única: data.jsx).
   ============================================================ */
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS, useMemo: useMemoS, useCallback: useCallbackS } = React;

function shuffleS(a) {const r = [...a];for (let i = r.length - 1; i > 0; i--) {const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]];}return r;}

function BreakdownS({ g }) {
  if (!g.parts.length) return null;
  return (
    <div className="breakdown">
      {g.parts.map((p, i) =>
      <React.Fragment key={i}>
          {i > 0 && <span className="op">+</span>}
          <div className="piece"><div className="pk">{p}</div><div className="pl">{window.keyword(p)}</div></div>
        </React.Fragment>
      )}
      <span className="op eq">=</span>
      <div className="piece result"><div className="pk">{g.id}</div><div className="pl">{g.kw}</div></div>
    </div>);

}
function ReadingsS({ g }) {
  return (
    <div className="readings">
      {g.kun !== '—' && <span className="chip"><b>kun</b>{g.kun}</span>}
      <span className="chip"><b>on</b>{g.on}</span>
      {g.phon === 'semantico' &&
      <span className="chip phon-note" title="Essa leitura não ajuda a adivinhar o som de nenhum kanji composto que usa essa peça — é radical de sentido, não de som. Decorar o som aqui não rende nada, foca no significado.">
        não prediz som de outros kanji
      </span>}
      {g.phon === 'fonetico' &&
      <span className="chip phon-good" title={`Esse ON se repete em: ${g.phonUsers.split('・').join(', ')}. Vale a pena decorar — vai te ajudar a adivinhar o som desses kanji.`}>
        <b>ON</b> prevê o som de {g.phonUsers.split('・').length} kanji
      </span>}
    </div>);

}
function NeuroTagS({ label, show }) {
  return <div className={'neuro' + (show ? '' : ' hide')}><span className="dot"></span>{label}</div>;
}

/* ---------- DASHBOARD ---------- */
function Dashboard({ state, onStudy, onAdvanceDay, onFixClock, onReset, newPerSession, focus, onFocus }) {
  const [pickedCell, setPickedCell] = useStateS(null);
  const [popShift, setPopShift] = useStateS(0);

  // evita que o balão do popover saia da tela em kanji perto da borda esquerda/direita
  function togglePop(e, id) {
    if (pickedCell === id) { setPickedCell(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const margin = 10, popW = 230, half = popW / 2;
    const center = rect.left + rect.width / 2;
    let shift = 0;
    if (center - half < margin) shift = margin - (center - half);
    else if (center + half > window.innerWidth - margin) shift = (window.innerWidth - margin) - (center + half);
    setPopShift(shift);
    setPickedCell(id);
  }
  const focusS = window.SRS.focusSet(focus);
  const focusGlyphs = focusS ? window.GLYPHS.filter((g) => focusS.has(g.id)) : window.GLYPHS;
  const due = window.SRS.dueList(state, focusS);
  const unlock = window.SRS.unlockable(state, focusS);
  const learned = window.SRS.learnedIn(state, focusS);
  const mat = window.SRS.maturity(state, focusS);
  const totalTeachable = focusGlyphs.length;
  const newThisSession = Math.min(unlock.length, newPerSession);
  const dayNum = Math.round((window.SRS.clock(state) - state.born) / window.SRS.DAY);
  const sessionSize = due.length + newThisSession;

  const focusChips = [{ id: 'all', label: 'Tudo' }, ...window.LEVELS.map((l) => ({ id: l, label: l }))];

  function cellInfo(g) {
    if (!window.SRS.isLearned(state, g.id)) {
      const ready = unlock.includes(g.id);
      return { locked: !ready, pip: null };
    }
    const c = window.SRS.card(state, g.id);
    const duenow = c.due <= window.SRS.clock(state);
    let pip = c.stage <= 2 ? 'novo' : c.stage <= 4 ? 'jovem' : 'maduro';
    if (duenow) pip = 'duenow';
    return { locked: false, pip };
  }

  return (
    <div className="dash step">
      <div className="hello">Bom estudo.</div>
      <div className="date">Dia {dayNum} · {learned} de {totalTeachable} kanji {focus === 'all' ? 'na sua coleção' : 'no ' + focus}</div>

      <div className="focus-row">
        <span className="focus-lbl">Foco</span>
        <div className="focus-chips">
          {focusChips.map((c) => {
            const fs = window.SRS.focusSet(c.id);
            const gl = fs ? window.GLYPHS.filter((g) => fs.has(g.id)) : window.GLYPHS;
            const ln = window.SRS.learnedIn(state, fs);
            return (
              <button key={c.id} className={'fchip' + (focus === c.id ? ' on' : '')} onClick={() => onFocus(c.id)}>
                {c.label}<small>{ln}/{gl.length}</small>
              </button>);
          })}
        </div>
      </div>

      <div className="queue-cards">
        <div className="qcard due">
          <div className="big">{due.length}</div>
          <div className="lab">Revisões para hoje</div>
          <div className="sub">{due.length ? 'itens prestes a serem esquecidos' : 'tudo em dia — volte amanhã'}</div>
        </div>
        <div className="qcard new">
          <div className="big">{newThisSession}</div>
          <div className="lab">Kanji novos liberados</div>
          <div className="sub">{unlock.length ? unlock.slice(0, newThisSession).join(' ') : (focus === 'all' ? 'aprenda as peças primeiro' : 'nível completo aqui — tudo aprendido')}</div>
        </div>
      </div>

      <div className="start-row">
        <button className="btn btn-primary" disabled={sessionSize === 0} onClick={onStudy} style={{ padding: '15px 34px', fontSize: '17px' }}>
          {sessionSize ? `Estudar agora · ${sessionSize} ${sessionSize === 1 ? 'item' : 'itens'}` : 'Nada para estudar agora'}
        </button>
        {sessionSize === 0 && due.length === 0 && <button className="mini" onClick={onAdvanceDay}>⏩ Avançar 1 dia</button>}
      </div>

      {learned > 0 &&
      <div className="mat">
          <div className="h">Maturidade da memória</div>
          <div className="matbar">
            {mat.novo > 0 && <i className="novo" style={{ flex: mat.novo }}></i>}
            {mat.jovem > 0 && <i className="jovem" style={{ flex: mat.jovem }}></i>}
            {mat.maduro > 0 && <i className="maduro" style={{ flex: mat.maduro }}></i>}
          </div>
          <div className="matleg">
            <span><b style={{ background: 'oklch(0.78 0.014 70)' }}></b>Novo {mat.novo}</span>
            <span><b style={{ background: 'oklch(0.66 0.12 60)' }}></b>Jovem {mat.jovem}</span>
            <span><b style={{ background: 'var(--good)' }}></b>Maduro {mat.maduro}</span>
          </div>
        </div>
      }

      <div className="coll">
        <div className="h">Sua coleção</div>
        <div className="gridcells">
          {focusGlyphs.map((g) => {
            const info = cellInfo(g);
            const isSupport = focus !== 'all' && g.lvl !== focus;
            const lvLabel = g.lvl === '—' ? 'peça' : g.lvl;
            const cls = 'cell' + (info.locked ? ' locked' : '') + (window.isAtom(g) && !info.locked ? ' atom' : '') + (isSupport && !info.locked ? ' support' : '');
            const title = info.locked ? 'bloqueado' : isSupport ? `${g.kw} · peça de apoio (${lvLabel})` : g.kw;
            const open = pickedCell === g.id;
            return (
              <div className={cls + (open ? ' sel' : '')} key={g.id} title={title}
                   onClick={(e) => !info.locked && togglePop(e, g.id)}>
                {info.locked ? '·' : g.id}
                {isSupport && !info.locked && <span className="lvbadge">{lvLabel}</span>}
                {info.pip && <span className={'pip ' + info.pip}></span>}
                {open &&
                <span className="kj-pop" onClick={(e) => e.stopPropagation()}
                      style={popShift ? { transform: `translateX(calc(-50% + ${popShift}px))` } : undefined}>
                  <span className="pk">{g.id}<span className="pm">{g.kw}</span></span>
                  <span className="prd">
                    {g.kun !== '—' ? <>kun · {g.kun}<br /></> : null}
                    on · {g.on}
                  </span>
                  <span className="lk">{g.lvl === '—' ? 'peça-base' : g.lvl}</span>
                </span>}
              </div>);

          })}
        </div>
      </div>

      <div className="clockbar">
        <span><span className="note">Relógio da demo:</span> <span className="day">Dia {dayNum}</span></span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button className="mini" onClick={onAdvanceDay}>⏩ Avançar 1 dia</button>
          {state.offset > 0 &&
          <button className="mini" onClick={onFixClock} title="Zera só o deslocamento do botão de demo, sem apagar sua coleção">
            🔧 Corrigir relógio (+{Math.round(state.offset / window.SRS.DAY)}d)
          </button>}
          <button className="mini" onClick={onReset}>↺ Zerar</button>
        </span>
      </div>
    </div>);

}

/* ---------- FRASE DE EXEMPLO ---------- */
function ExFrase({ id }) {
  const [open, setOpen] = useStateS(false);
  const [idx, setIdx] = useStateS(0);
  const [showPt, setShowPt] = useStateS(false);
  const matches = (window.SENTENCES || []).filter(s => s[1].includes(id));
  if (!matches.length) return null;
  const s = matches[idx % matches.length];
  const isKj = ch => /[一-龯]/.test(ch);
  return (
    <div className="ex-frase">
      <button className="ex-btn" onClick={() => { if (!open) setShowPt(false); setOpen(o => !o); }}>
        {open ? '▴' : '例'} frase de exemplo{!open && matches.length > 1 && <span className="ex-count"> ×{matches.length}</span>}
      </button>
      {open && (
        <div className="ex-card">
          <div className="ex-jp">
            {[...s[1]].map((ch, i) => (
              <span key={i} className={ch === id ? 'ex-target' : isKj(ch) ? 'ex-kj' : ''}>{ch}</span>
            ))}
          </div>
          <div className="ex-rom">{s[2]}</div>
          {showPt
            ? <div className="ex-pt">{s[3]}</div>
            : <button className="ex-reveal" onClick={e => { e.stopPropagation(); setShowPt(true); }}>ver tradução →</button>
          }
          {matches.length > 1 && (
            <button className="ex-next" onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % matches.length); setShowPt(false); }}>
              próxima →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- APRENDER (composição) ---------- */
function LearnStep({ g, onIntroduce, showNeuro }) {
  const atom = window.isAtom(g);
  return (
    <div className="step">
      <NeuroTagS label={atom ? 'Nova peça · imagem mental' : 'Composição · construir com o que você já sabe'} show={showNeuro} />
      <div className="grid-wrap"><div className="genko"><span className="glyph">{g.id}</span></div></div>
      <div className="tagrow">
        <span className={'tag' + (atom ? ' tag-radical' : ' tag-kanji')}>{atom ? 'Radical' : 'Kanji'}</span>
        {window.CLASS_LABELS && g.cls && g.cls.split(' · ').map((c, i) =>
          <span className="tag tag-class" key={i}>{window.CLASS_LABELS[c] || c}</span>
        )}
      </div>
      <div className="meaning">{g.kw}</div>
      <ReadingsS g={g} />
      <BreakdownS g={g} />
      <p className="mnemonic">
        <span className="lead">{atom ? 'De onde vem a forma' : 'A história que liga as peças'}</span>
        <strong>{g.story}</strong>
      </p>
      {g.use &&
      <p className="mnemonic usebox">
        <span className="lead">{g.use === '—' ? 'Uso real' : 'Na prática'}</span>
        <strong>{g.use === '—' ? 'Só existe dentro de outros kanji — nunca vira palavra sozinha.' : g.use}</strong>
      </p>}
      <ExFrase id={g.id} />
      <div className="actions">
        <button className="btn btn-primary" onClick={onIntroduce}>{atom ? 'Memorizei a peça →' : 'Entendi a composição →'}</button>
      </div>
    </div>);

}

/* ---------- REVISÃO (recuperação ativa + grade SRS por escolha real, não autoavaliação) ---------- */
function ReviewStep({ state, id, pool, onGrade, showNeuro, training }) {
  const g = window.G(id);
  const [revealed, setRevealed] = useStateS(false);
  const [picked, setPicked] = useStateS(null);
  const [gaveUp, setGaveUp] = useStateS(false);
  const nextOk = window.SRS.nextStageLabel(state, id);
  const nextBad = window.SRS.lapseStageLabel(state, id);
  const options = useMemoS(() => {
    const distract = shuffleS(pool.filter((x) => x !== g.kw)).slice(0, 2);
    return shuffleS([{ label: g.kw, ok: true }, ...distract.map((d) => ({ label: d, ok: false }))]);
  }, [id]);
  const answered = picked !== null || gaveUp;
  const isCorrect = picked !== null && options[picked].ok;
  function choose(opt, i) {
    if (answered) return;
    setPicked(i);
    setTimeout(() => onGrade(opt.ok), opt.ok ? 1500 : 1600);
  }
  function giveUp() {
    if (answered) return;
    setRevealed(true);
    setGaveUp(true);
    setTimeout(() => onGrade(false), 1600);
  }
  return (
    <div className="step">
      <NeuroTagS label="Recuperação ativa · lembrar antes de ver" show={showNeuro} />
      <div className="grid-wrap"><div className="genko"><span className="glyph">{g.id}</span></div></div>
      {!revealed ?
      <>
          <p className="prompt">Sem espiar: <b>significado e leitura?</b><br />Forme a resposta na cabeça primeiro.</p>
          <div className="reveal blank">resposta escondida — recupere de memória</div>
          <div className="actions">
            <button className="btn btn-ghost" onClick={giveUp}>Não lembro</button>
            <button className="btn btn-primary" onClick={() => setRevealed(true)}>Pronto, escolher</button>
          </div>
        </> :

      <>
          <p className="prompt">Qual o significado?</p>
          <div className="options k2m">
            {options.map((opt, i) => {
              let cls = 'option';
              if (answered) {if (opt.ok) cls += ' correct';else if (i === picked) cls += ' wrong';else cls += ' dim';}
              return <button key={i} className={cls} disabled={answered} onClick={() => choose(opt, i)}>{opt.label}</button>;
            })}
          </div>
          {answered &&
          <div className="reveal">
              <div className="sub">{g.story}</div>
              <div className="rd">{g.kun !== '—' && <span className="chip"><b>kun</b>{g.kun}</span>}<span className="chip"><b>on</b>{g.on}</span></div>
              <ExFrase id={g.id} />
              <div className="gi" style={{ marginTop: 8 }}>{training ? 'treino · agendamento intacto' : isCorrect ? `próxima em ${nextOk}` : `revisar em ${nextBad}`}</div>
            </div>
          }
        </>
      }
    </div>);

}

/* ---------- CHECAGEM rápida (quiz logo após aprender) ---------- */
function QuickCheck({ id, pool, onResult, showNeuro }) {
  const g = window.G(id);
  const [picked, setPicked] = useStateS(null);
  const options = useMemoS(() => {
    const distract = shuffleS(pool.filter((x) => x !== g.kw)).slice(0, 3);
    return shuffleS([{ label: g.kw, ok: true }, ...distract.map((d) => ({ label: d, ok: false }))]);
  }, [id]);
  function choose(opt, i) {if (picked !== null) return;setPicked(i);setTimeout(() => onResult(opt.ok), opt.ok ? 800 : 1400);}
  return (
    <div className="step">
      <NeuroTagS label="Checagem imediata · fixar o novo" show={showNeuro} />
      <div className="grid-wrap"><div className="genko"><span className="glyph sm">{g.id}</span></div></div>
      <p className="prompt">O que esse kanji significa?</p>
      <div className="options k2m">
        {options.map((opt, i) => {
          let cls = 'option';
          if (picked !== null) {if (opt.ok) cls += ' correct';else if (i === picked) cls += ' wrong';else cls += ' dim';}
          return <button key={i} className={cls} disabled={picked !== null} onClick={() => choose(opt, i)}>{opt.label}</button>;
        })}
      </div>
    </div>);

}

/* ---------- RESUMO DA SESSÃO ---------- */
function Summary({ state, result, onHome, onRedo, redoSize, redoDone }) {
  const acc = result.answered ? Math.round(100 * result.correct / result.answered) : 100;
  const upcoming = Object.keys(state.cards).map((id) => ({ id, due: state.cards[id].due })).sort((a, b) => a.due - b.due).slice(0, 5);
  const fmt = (due) => {
    const days = Math.max(0, Math.round((due - window.SRS.clock(state)) / window.SRS.DAY));
    if (days <= 0) return 'hoje';
    if (days === 1) return 'amanhã';
    if (days < 30) return `em ${days} dias`;
    return `em ${Math.round(days / 30)} ${Math.round(days / 30) === 1 ? 'mês' : 'meses'}`;
  };
  return (
    <div className="summary step">
      <div className="seal">完</div>
      <h2>Sessão concluída!</h2>
      <p className="sub">Os itens foram reagendados pela curva do esquecimento. Volte quando vencerem.</p>
      <div className="scorecard">
        <div className="s"><div className="n">{result.learned}</div><div className="l">Novos</div></div>
        <div className="s"><div className="n">{result.reviewed}</div><div className="l">Revisados</div></div>
        <div className="s"><div className="n">{acc}%</div><div className="l">Precisão</div></div>
      </div>
      <div className="nextrev">
        <div className="rh">Próximas revisões agendadas</div>
        {upcoming.map((u) =>
        <div className="rrow" key={u.id}><div className="rk">{u.id}</div><div className="rm">{window.G(u.id).kw}</div><div className="rt">{fmt(u.due)}</div></div>
        )}
      </div>
      <div className="actions">
        {redoSize > 0 &&
        <button className="btn btn-ghost" onClick={onRedo} title="Repete a sessão até você acertar tudo. Não mexe no agendamento.">
            {redoDone ? 'Refazer de novo' : `Refazer · ${redoSize} itens`}
          </button>
        }
        <button className="btn btn-primary" onClick={onHome}>Voltar ao painel</button>
      </div>
      {redoDone && <p className="sub" style={{ marginTop: 10 }}>Rodada limpa — você acertou tudo no treino. O agendamento acima continua o mesmo.</p>}
    </div>);

}

/* ============================================================
   COMPONENTE PRINCIPAL: Studies
   ============================================================ */
function Studies({ showNeuro, newPerSession, onPoints }) {
  const [state, setState] = useStateS(() => {
    const loaded = window.SRS.load();
    if (loaded && loaded.cards) {if (!loaded.born) loaded.born = loaded.now;return loaded;}
    const s = window.SRS.blank();s.born = s.now;return s;
  });
  const [screen, setScreen] = useStateS('dash');
  const [focus, setFocusRaw] = useStateS(() => {try {return localStorage.getItem('kanjiquest.focus') || 'all';} catch (e) {return 'all';}});
  const setFocus = useCallbackS((l) => {setFocusRaw(l);try {localStorage.setItem('kanjiquest.focus', l);} catch (e) {}}, []);
  const [queue, setQueue] = useStateS([]);
  const [qi, setQi] = useStateS(0);
  const [phase, setPhase] = useStateS('main');
  const [points, setPoints] = useStateS(0);
  const [streak, setStreak] = useStateS(0);
  const [stamp, setStamp] = useStateS(false);
  const result = useRefS({ learned: 0, reviewed: 0, correct: 0, answered: 0 });
  /* REFAZER — treino depois do resumo: repete a sessão até sair uma rodada
     limpa. NÃO encosta no SRS: o erro da sessão real já foi registrado e é
     ele que manda no agendamento; aqui é só martelar a memória. A 1ª rodada
     leva a fila inteira (pra reforçar também o que acertou), e as seguintes
     só o que caiu, até esvaziar. */
  const sessionQueue = useRefS([]);
  const redoWrong = useRefS([]);
  const [training, setTraining] = useStateS(false);
  const [redoRound, setRedoRound] = useStateS(0);
  const [redoDone, setRedoDone] = useStateS(false);

  const learnedTotal = window.SRS.learnedCount(state);
  useEffectS(() => {onPoints && onPoints({ points, collection: learnedTotal, inSession: screen === 'session' });}, [points, learnedTotal, screen]);

  const persist = useCallbackS((s) => {window.SRS.save(s);setState({ ...s });}, []);
  const meaningPool = useMemoS(() => window.GLYPHS.map((g) => g.kw), []);

  function startSession() {
    const q = window.SRS.buildSession(state, newPerSession, window.SRS.focusSet(focus));
    if (!q.length) return;
    setQueue(q);setQi(0);setPhase('main');
    sessionQueue.current = q;setTraining(false);setRedoRound(0);setRedoDone(false);
    result.current = { learned: 0, reviewed: 0, correct: 0, answered: 0 };
    setScreen('session');
  }
  /* dispara o Refazer a partir do resumo: rodada 1 = a fila original inteira */
  function startRedo() {
    const base = sessionQueue.current;
    if (!base.length) return;
    redoWrong.current = [];
    setQueue(base);setQi(0);setPhase('main');
    setTraining(true);setRedoRound(1);setRedoDone(false);
    setScreen('session');
  }
  function goHome() {setTraining(false);setScreen('dash');}
  function fireStamp() {setStamp(true);setTimeout(() => setStamp(false), 700);}
  function nextItem() {
    if (qi + 1 < queue.length) {setQi(qi + 1);setPhase('main');return;}
    if (!training) {setScreen('summary');return;}
    const again = redoWrong.current;
    if (!again.length) {setTraining(false);setRedoDone(true);setScreen('summary');return;}
    redoWrong.current = [];
    setQueue(again);setQi(0);setPhase('main');setRedoRound((r) => r + 1);
  }
  /* resposta dentro do Refazer: só decide se o item volta na próxima rodada */
  function trainingResult(ok) {
    const item = queue[qi];
    if (ok) {
      const ns = streak + 1;setStreak(ns);setPoints((p) => p + 5);fireStamp();
      window.Sfx.correct();if (ns >= 3 && ns % 3 === 0) window.Sfx.streak(Math.floor(ns / 3));
    } else {redoWrong.current = [...redoWrong.current, item];setStreak(0);window.Sfx.wrong();}
    nextItem();
  }

  function onIntroduce() {
    const id = queue[qi].id;
    window.SRS.introduce(state, id);result.current.learned++;persist(state);setPhase('check');
  }
  function onCheckResult(ok) {
    if (training) return trainingResult(ok);
    result.current.answered++;
    if (ok) {
      result.current.correct++;const ns = streak + 1;setStreak(ns);setPoints((p) => p + 10);fireStamp();
      window.Sfx.correct();if (ns >= 3 && ns % 3 === 0) window.Sfx.streak(Math.floor(ns / 3));
    } else {setStreak(0);window.Sfx.wrong();}
    nextItem();
  }
  function onGrade(ok) {
    if (training) return trainingResult(ok);
    const id = queue[qi].id;
    window.SRS.review(state, id, ok);result.current.reviewed++;result.current.answered++;
    if (ok) {
      result.current.correct++;const ns = streak + 1;setStreak(ns);setPoints((p) => p + 10 + ns * 2);fireStamp();
      window.Sfx.correct();if (ns >= 3 && ns % 3 === 0) window.Sfx.streak(Math.floor(ns / 3));
    } else {setStreak(0);window.Sfx.wrong();}
    persist(state);nextItem();
  }
  function advanceDay() {window.SRS.advanceDays(state, 1);persist(state);}
  function fixClock() {window.SRS.clearOffset(state);persist(state);}
  function reset() {const s = window.SRS.blank();s.born = s.now;persist(s);setScreen('dash');setPoints(0);setStreak(0);}

  let body;
  if (screen === 'dash') {
    body = <Dashboard state={state} onStudy={startSession} onAdvanceDay={advanceDay} onFixClock={fixClock} onReset={reset} newPerSession={newPerSession} focus={focus} onFocus={setFocus} />;
  } else if (screen === 'summary') {
    body = <Summary state={state} result={result.current} onHome={goHome} onRedo={startRedo} redoSize={sessionQueue.current.length} redoDone={redoDone} />;
  } else {
    const item = queue[qi];
    // no Refazer a rodada entra no key pra o passo remontar do zero a cada volta
    const k = (training ? 't' + redoRound + '-' : '') + qi;
    if (item.kind === 'learn' && !training) {
      body = phase === 'main' ?
      <LearnStep key={'l' + k} g={window.G(item.id)} onIntroduce={onIntroduce} showNeuro={showNeuro} /> :
      <QuickCheck key={'c' + k} id={item.id} pool={meaningPool} onResult={onCheckResult} showNeuro={showNeuro} />;
    } else if (item.kind === 'learn') {
      // já leu o mnemônico nesta sessão — no treino vai direto pra pergunta
      body = <QuickCheck key={'c' + k} id={item.id} pool={meaningPool} onResult={onCheckResult} showNeuro={showNeuro} />;
    } else {
      body = <ReviewStep key={'r' + k} state={state} id={item.id} pool={meaningPool} onGrade={onGrade} showNeuro={showNeuro} training={training} />;
    }
  }

  return (
    <>
      {screen === 'session' &&
      <>
          <div className="sprog">
            {queue.map((s, i) => <div key={i} className={'sseg ' + (i < qi ? 'done' : i === qi ? 'active' : '')}><span className="fill"></span></div>)}
          </div>
          <div className="scount">{qi + 1} / {queue.length} · {training ? `refazendo · rodada ${redoRound}` : queue[qi].kind === 'learn' ? 'aprendendo' : 'revisando'} · {points} pts · 🔥 {streak}</div>
        </>
      }
      <div className="stage">{body}</div>
      {stamp && <div className="stamp-layer"><div className="hanko">良</div></div>}
    </>);

}

window.Studies = Studies;