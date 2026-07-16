/* ============================================================
   FRASES (leitura)  —  frases.jsx  →  window.Frases
   Lê window.GLYPHS pra glosar cada kanji da frase.
   Todas as frases usam SOMENTE kanji presentes no baralho
   (validado). Kana só nas partículas/terminações.
   ============================================================ */
const { useState: useFrState } = React;

/* tier: 'b' básicas · 'i' intermediárias · 'a' avançadas */
const SENTENCES = [
  ['b','私は本を読む。','watashi wa hon o yomu','Eu leio um livro.'],
  ['b','母は魚を買う。','haha wa sakana o kau','Minha mãe compra peixe.'],
  ['b','父は車で会社へ行く。','chichi wa kuruma de kaisha e iku','Meu pai vai à empresa de carro.'],
  ['b','妹は赤い花が好きだ。','imōto wa akai hana ga suki da','Minha irmã caçula gosta de flores vermelhas.'],
  ['b','夏に海へ行く。','natsu ni umi e iku','No verão eu vou ao mar.'],
  ['b','友だちと店で茶を飲む。','tomodachi to mise de cha o nomu','Tomo chá com os amigos na loja.'],
  ['b','雨の日は家で音楽を聞く。','ame no hi wa ie de ongaku o kiku','Em dias de chuva escuto música em casa.'],
  ['b','犬は外で水を飲む。','inu wa soto de mizu o nomu','O cachorro bebe água lá fora.'],
  ['b','姉は白い服を着る。','ane wa shiroi fuku o kiru','Minha irmã mais velha veste roupa branca.'],
  ['b','今日は天気がいい。','kyō wa tenki ga ii','Hoje o tempo está bom.'],

  ['i','朝早く起きて、山の道を歩く。','asa hayaku okite, yama no michi o aruku','De manhã cedo eu acordo e caminho pela trilha da montanha.'],
  ['i','先生は教室で漢字を教える。','sensei wa kyōshitsu de kanji o oshieru','O professor ensina kanji na sala de aula.'],
  ['i','母は米を買って料理を作る。','haha wa kome o katte ryōri o tsukuru','Minha mãe compra arroz e prepara a comida.'],
  ['i','父は新しい家を建てる。','chichi wa atarashii ie o tateru','Meu pai constrói uma casa nova.'],
  ['i','秋になると林が赤くなる。','aki ni naru to hayashi ga akaku naru','Quando chega o outono, o bosque fica vermelho.'],
  ['i','古い店の前に人が多い。','furui mise no mae ni hito ga ōi','Há muita gente em frente à loja antiga.'],
  ['i','弟は学校で文を書く。','otōto wa gakkō de bun o kaku','Meu irmão mais novo escreve um texto na escola.'],
  ['i','妹は歌を歌うのが好きだ。','imōto wa uta o utau no ga suki da','Minha irmã caçula gosta de cantar.'],
  ['i','駅の近くに新しい店がある。','eki no chikaku ni atarashii mise ga aru','Perto da estação há uma loja nova.'],
  ['i','時間を時計で見る。','jikan o tokei de miru','Vejo as horas no relógio.'],

  ['a','医者は病院で子どもを見る。','isha wa byōin de kodomo o miru','O médico examina as crianças no hospital.'],
  ['a','兄弟で力を合わせて重い物を持つ。','kyōdai de chikara o awasete omoi mono o motsu','Os irmãos juntam forças e carregam algo pesado.'],
  ['a','毎日漢字を書いて、言葉の意味を考える。','mainichi kanji o kaite, kotoba no imi o kangaeru','Todo dia escrevo kanji e penso no sentido das palavras.'],
  ['a','新聞で世界の中の出来事を知る。','shinbun de sekai no naka no dekigoto o shiru','Pelo jornal fico sabendo dos acontecimentos do mundo.'],
  ['a','強い風が吹いて、木が大きく動く。','tsuyoi kaze ga fuite, ki ga ōkiku ugoku','Um vento forte sopra e a árvore balança bastante.'],
  ['a','兄は毎朝電車で会社へ通う。','ani wa maiasa densha de kaisha e kayou','Meu irmão mais velho vai de trem à empresa toda manhã.'],
  ['a','店の主人は客に茶を出す。','mise no shujin wa kyaku ni cha o dasu','O dono da loja serve chá ao cliente.'],
  ['a','安い肉を買って、家で料理を作る。','yasui niku o katte, ie de ryōri o tsukuru','Compro carne barata e cozinho em casa.'],
  ['a','地図を見て、駅から海まで歩く。','chizu o mite, eki kara umi made aruku','Olho o mapa e caminho da estação até o mar.'],
  ['a','王は国を強くするために働く。','ō wa kuni o tsuyoku suru tame ni hataraku','O rei trabalha para tornar o país forte.'],
];

const FR_TIERS = [
  ['b','Básicas','sujeito · objeto · verbo'],
  ['i','Intermediárias','tempo, lugar e composição'],
  ['a','Avançadas','orações encadeadas'],
];

const isKanji = ch => /[\u4e00-\u9faf]/.test(ch);

function KanjiTok({ ch, selKey, mySel, onSel }){
  const g = window.G(ch);
  const open = selKey === mySel;
  if (!g) return ch; // segurança: não está no baralho (não deve ocorrer)
  return (
    <span
      className={'kj'+(open?' sel':'')}
      onClick={(e)=>{ e.stopPropagation(); onSel(open?null:mySel); }}
    >
      {ch}
      {open && (
        <span className="kj-pop" onClick={e=>e.stopPropagation()}>
          <span className="pk">{ch}<span className="pm">{g.kw}</span></span>
          <span className="prd">
            {g.kun && g.kun!=='—' ? <>kun · {g.kun}<br/></> : null}
            {g.on && g.on!=='—' ? <>on · {g.on}</> : null}
          </span>
          <span className="lk">{g.lvl==='—'?'peça-base':g.lvl}</span>
        </span>
      )}
    </span>
  );
}

function FrCard({ idx, jp, rom, pt, openCard, setOpenCard }){
  const [sel, setSel] = useFrState(null); // qual kanji está com popover
  const open = openCard === idx;
  return (
    <div
      className={'fr-card'+(open?' open':'')}
      onClick={()=>{ setSel(null); setOpenCard(open?null:idx); }}
    >
      <div className="fr-jp">
        {[...jp].map((ch,i)=> isKanji(ch)
          ? <KanjiTok key={i} ch={ch} selKey={sel} mySel={i} onSel={setSel} />
          : <span key={i}>{ch}</span>
        )}
      </div>
      <div className="fr-reveal">
        <div className="fr-rom">{rom}</div>
        <div className="fr-pt">{pt}</div>
      </div>
      <div className="fr-hint"><span className="ar">▸</span> toque para revelar</div>
    </div>
  );
}

function Frases(){
  const [openCard, setOpenCard] = useFrState(null);

  return (
    <div className="fr">
      <div className="fr-intro">
        <h2>Frases</h2>
        <p>Todo kanji aqui já está no seu baralho — só as partículas vêm em kana.
           Toque um <span style={{color:'var(--accent)',fontWeight:700}}>kanji em vermelhão</span> para
           ver o sentido, ou no cartão para revelar a tradução.</p>
      </div>

      {FR_TIERS.map(([tier,title,sub])=>(
        <div className="fr-sec" key={tier}>
          <div className="sh">{title} · <span style={{textTransform:'none',letterSpacing:0,fontWeight:600,color:'var(--muted)'}}>{sub}</span></div>
          {SENTENCES.map((s,i)=> s[0]===tier ? (
            <FrCard key={i} idx={i} jp={s[1]} rom={s[2]} pt={s[3]} openCard={openCard} setOpenCard={setOpenCard} />
          ) : null)}
        </div>
      ))}
    </div>
  );
}

window.Frases = Frases;
