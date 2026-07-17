/* ============================================================
   SFX  —  sfx.jsx
   Efeitos sonoros compartilhados (Web Audio, zero deps).
   Usado pelo Challenge e pelos Estudos — mesmo motor, uma
   instância só de AudioContext pros dois modos.
   ============================================================ */
(function(){
  let _AC = null;
  function ac(){ if(!_AC){ try{ _AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return _AC; }
  function tone(freq, type, dur, vol, delay){
    const a=ac(); if(!a) return;
    try{
      const g=a.createGain(); g.connect(a.destination);
      const o=a.createOscillator(); o.connect(g); o.type=type;
      o.frequency.setValueAtTime(freq, a.currentTime+delay);
      g.gain.setValueAtTime(0, a.currentTime+delay);
      g.gain.linearRampToValueAtTime(vol, a.currentTime+delay+0.01);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime+delay+dur);
      o.start(a.currentTime+delay); o.stop(a.currentTime+delay+dur+0.02);
    }catch(e){}
  }
  window.Sfx = {
    on:true,
    correct(){ if(!this.on) return; tone(523,'sine',.09,.14,0); tone(659,'sine',.09,.12,.07); },
    wrong(){   if(!this.on) return; tone(200,'sawtooth',.14,.10,0); tone(180,'sawtooth',.10,.08,.10); },
    streak(n){ if(!this.on) return; [523,659,784,1047].slice(0,Math.min(n,4)).forEach((f,i)=>tone(f,'sine',.10,.15,i*.08)); },
    bolt(){    if(!this.on) return; tone(440,'square',.08,.08,0); },
    click(){   if(!this.on) return; tone(880,'sine',.04,.06,0); },
  };
})();
