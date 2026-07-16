const CACHE = 'kanji-quest-v1';
const SHELL = ['Kanji Quest Mobile.html','data.jsx','kana.jsx','srs.jsx','studies.jsx','challenge.jsx','frases.jsx','buscar.jsx','tweaks-panel.jsx','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fetchPromise = fetch(e.request).then(res=>{
        if(res && res.status===200 && res.type==='basic'){
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put(e.request, copy));
        }
        return res;
      }).catch(()=>cached);
      return cached || fetchPromise;
    })
  );
});
