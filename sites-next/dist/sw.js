// Static shell only. Business records remain in localStorage and JSON backups.
const CACHE='mora-shell-v27-final';
const ASSETS=['./','./index.html','./manifest.webmanifest','./assets/icons/mora-180.png','./assets/icons/mora-192.png','./assets/icons/mora-512.png','./style.css','./areas.css','./refinement.css','./workflows.css','./writer-gate.js','./app.js','./reports-model.js','./reports-ui.js','./money-history-ui.js','./correction-ui.js','./correction-validation.js','./sale-corrections.js','./workflow-ui.js','./workflow-state.js','./business-read.js','./extended-operations.js','./extended-validation.js','./shortage-model.js','./cart-model.js','./draft-model.js','./operations.js','./operation-validation.js','./product-model.js','./purchasing.js','./catalog-data.js','./scanner.js','./money-model.js','./local-data.js','./receiving.js','./purchase-orders.js','./supplier-engine.js','./costs.js','./update-gate.js','./assets/wine-red.webp','./assets/wine-white.webp','./assets/wine-rose.webp','./assets/accounts/brubank.png','./assets/accounts/mercado-pago.svg','./assets/accounts/naranja-x.webp'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
// A new version activates once all tabs of the previous version are closed.
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mora-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const r=event.request,url=new URL(r.url);if(r.method!=='GET'||url.origin!==self.location.origin||r.cache==='no-store')return;
  const allowed=ASSETS.some(a=>new URL(a,self.registration.scope).href===url.href);if(!allowed&&r.mode!=='navigate')return;
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(r))||(r.mode==='navigate'?await cache.match('./index.html'):null)||fetch(r)));
});
