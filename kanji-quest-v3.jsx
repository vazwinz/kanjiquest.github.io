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
  "kanjiFont": "mincho",
  "soundOn": true
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
  const { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakToggle, TweakSlider, TweakButton } = window;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useState('estudos');
  const [studyStats, setStudyStats] = useState({ collection:0, inSession:false });

  useEffect(()=>{
    const root=document.documentElement;
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--accent-soft', `color-mix(in srgb, ${t.accent} 14%, transparent)`);
  }, [t.accent]);

  useEffect(()=>{
    document.documentElement.style.setProperty('--kanji-font', KANJI_FONTS[t.kanjiFont] || KANJI_FONTS.mincho);
  }, [t.kanjiFont]);

  useEffect(()=>{
    if (window.Sfx) window.Sfx.on = t.soundOn;
  }, [t.soundOn]);

  const totalKanji = window.GLYPHS.length;

  const importRef = useRefS(null);

  function exportData(){
    const bundle={};
    ['kanjiquest.v2','kanjiquest.challenge','kanjiquest.focus'].forEach(k=>{
      try{ const v=localStorage.getItem(k); if(v) bundle[k]=JSON.parse(v); }catch(e){}
    });
    const blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=`kanjiquest-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importData(e){
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try{
        const bundle=JSON.parse(ev.target.result);
        if(!bundle['kanjiquest.v2']?.cards) return;
        Object.entries(bundle).forEach(([k,v])=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(er){} });
        location.reload();
      }catch(er){}
    };
    reader.readAsText(file);
    e.target.value='';
  }

  // força checar o service worker por uma versão nova antes de recarregar —
  // sem isso o Chrome só confere o sw.js uma vez a cada 24h
  function forceUpdate(){
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => reg && reg.update()).catch(()=>{});
    }
    location.reload();
  }

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

        {tab==='estudos'   && <window.Studies showNeuro={t.showNeuro} newPerSession={t.newPerSession} onStats={setStudyStats} />}
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
        <TweakToggle label="Som" value={t.soundOn} onChange={v=>setTweak('soundOn', v)} />
        <TweakSection label="Didática" />
        <TweakToggle label="Dicas de neurociência" value={t.showNeuro} onChange={v=>setTweak('showNeuro', v)} />
        <TweakSlider label="Kanji novos por sessão" min={2} max={8} step={1} value={t.newPerSession} onChange={v=>setTweak('newPerSession', v)} />
        <TweakSection label="Sistema" />
        <TweakButton label="🔄 Atualizar app" onClick={forceUpdate} />
        <TweakSection label="Dados" />
        <TweakButton label="📤 Exportar coleção" onClick={exportData} secondary />
        <TweakButton label="📥 Importar backup" onClick={()=>importRef.current.click()} secondary />
      </TweaksPanel>
      <input ref={importRef} type="file" accept=".json" style={{display:'none'}} onChange={importData} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
