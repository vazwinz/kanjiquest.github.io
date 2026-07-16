const CACHE = 'kanji-quest-v2';
const SHELL = ['Kanji Quest Mobile.html','data.jsx','kana.jsx','srs.jsx','studies.jsx','challenge.jsx','frases.jsx','buscar.jsx','tweaks-panel.jsx','kanji-quest-v3.jsx','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
// Rede primeiro: sempre busca a versão mais nova; só cai pro cache se estiver
// offline. Evita ficar preso numa versão antiga depois de um deploy novo.
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    fetch(e.request).then(res=>{
      if(res && res.status===200 && res.type==='basic'){
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(e.request, copy));
      }
      return res;
    }).catch(()=>caches.match(e.request))
  );
});
