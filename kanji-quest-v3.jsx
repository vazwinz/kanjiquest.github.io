/* ============================================================
   SHELL  —  kanji-quest-v3.jsx
   Menu com abas: Estudos | Challenge. Ambos leem a MESMA fonte
   (window.GLYPHS). Hospeda Tweaks. Estado de cada modo é dele.
   ============================================================ */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "oklch(0.585 0.175 32)",
  "showNeuro": true,
  "newPerSession": 4,
  "kanjiFont": "mincho"
}/*EDITMODE-END*/;

const KANJI_FONTS = {
  mincho: "'Shippori Mincho B1', serif",
  gothic: "'Zen Kaku Gothic New', sans-serif"
};

const ACCENT_OPTIONS = [
  "oklch(0.585 0.175 32)",  // 朱 vermelhão
  "oklch(0.50 0.11 250)",   // 藍 índigo
  "oklch(0.50 0.13 300)",   // 紫 violeta
  "oklch(0.46 0.10 200)"    // 縹 azul-petróleo
];

function App(){
  const { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakToggle, TweakSlider } = window;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useState('estudos');
  const [studyStats, setStudyStats] = useState({ points:0, collection:0, inSession:false });

  useEffect(()=>{
    const root=document.documentElement;
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--accent-soft', `color-mix(in srgb, ${t.accent} 14%, transparent)`);
  }, [t.accent]);

  useEffect(()=>{
    document.documentElement.style.setProperty('--kanji-font', KANJI_FONTS[t.kanjiFont] || KANJI_FONTS.mincho);
  }, [t.kanjiFont]);

  const totalKanji = window.GLYPHS.length;

  return (
    <div className="app">
      <div className="frame">
        <div className="topbar">
          <div className="brand" onClick={()=>setTab('estudos')}>
            <span className="mark">道</span><span className="name">Caminho do Kanji</span>
          </div>
          <div className="topbar-right">
            {tab==='estudos'
              ? <div className="stats">
                  <div className="stat"><div className="num">{studyStats.points}</div><div className="lab">Pontos</div></div>
                  <div className="stat"><div className="num">{studyStats.collection}</div><div className="lab">Coleção</div></div>
                </div>
              : <div className="stats">
                  <div className="stat"><div className="num">{totalKanji}</div><div className="lab">No baralho</div></div>
                </div>}
            <button className="gear-btn" aria-label="Configurações" title="Configurações"
                    onClick={()=>window.dispatchEvent(new CustomEvent('tweaks:toggle'))}>⚙</button>
          </div>
        </div>

        <div className="tabbar">
          <button className={'tab'+(tab==='estudos'?' on':'')} onClick={()=>setTab('estudos')}>
            <span className="tjp">学</span> Estudos
          </button>
          <button className={'tab'+(tab==='challenge'?' on':'')} onClick={()=>setTab('challenge')}>
            <span className="tjp">挑</span> Challenge
          </button>
          <button className={'tab'+(tab==='frases'?' on':'')} onClick={()=>setTab('frases')}>
            <span className="tjp">文</span> Frases
          </button>
          <button className={'tab'+(tab==='buscar'?' on':'')} onClick={()=>setTab('buscar')}>
            <span className="tjp">探</span> Buscar
          </button>
        </div>

        {tab==='estudos'   && <window.Studies showNeuro={t.showNeuro} newPerSession={t.newPerSession} onPoints={setStudyStats} />}
        {tab==='challenge' && <window.Challenge />}
        {tab==='frases'    && <window.Frases />}
        {tab==='buscar'    && <window.Buscar />}

        <div className="footnote">
          {tab==='estudos'   && <>Composição por componentes + repetição espaçada (<span className="jp">間隔反復</span>) — o motor do Anki e do WaniKani.</>}
          {tab==='challenge' && <>Modo de teste — lê a sua coleção, mas <b>não altera</b> o agendamento das revisões.</>}
          {tab==='frases'    && <>Leitura guiada — toda frase usa só kanji do baralho. Toque um kanji para o sentido, o cartão para a tradução.</>}
          {tab==='buscar'    && <>Pesquisa sobre os <b>{totalKanji}</b> glifos do baralho — por kanji, significado ou leitura (<span className="jp">音訓</span>).</>}
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Aparência" />
        <TweakColor label="Cor de acento" value={t.accent} options={ACCENT_OPTIONS} onChange={v=>setTweak('accent', v)} />
        <TweakToggle label="Fonte tipo letreiro (gothic)" value={t.kanjiFont==='gothic'} onChange={v=>setTweak('kanjiFont', v?'gothic':'mincho')} />
        <TweakSection label="Didática" />
        <TweakToggle label="Dicas de neurociência" value={t.showNeuro} onChange={v=>setTweak('showNeuro', v)} />
        <TweakSlider label="Kanji novos por sessão" min={2} max={8} step={1} value={t.newPerSession} onChange={v=>setTweak('newPerSession', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
