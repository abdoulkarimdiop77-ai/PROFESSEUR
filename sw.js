// KOTO — service worker : l'application s'ouvre même avec une mauvaise connexion.
// Les données (Supabase) ne sont jamais mises en cache ici.
const VERSION='koto-v1';
const COEUR=['./','index.html','manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(COEUR)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.hostname.endsWith('supabase.co'))return; // données : toujours en direct
  const memeSite=url.origin===location.origin;
  const cdn=/cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/.test(url.hostname);
  if(memeSite){
    // réseau d'abord (toujours la dernière version), copie en secours si hors ligne
    e.respondWith(fetch(req).then(r=>{const c=r.clone();caches.open(VERSION).then(x=>x.put(req,c));return r;}).catch(()=>caches.match(req).then(r=>r||caches.match('index.html'))));
  }else if(cdn){
    // bibliothèques : copie locale d'abord
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(n=>{const c=n.clone();caches.open(VERSION).then(x=>x.put(req,c));return n;})));
  }
});
