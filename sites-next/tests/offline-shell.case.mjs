// Service-worker logic simulation; not a browser offline test.
import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
const handlers={},items=new Map();let claimed=false;
const cache={async addAll(paths){for(const p of paths){if(p!=='./')assert.ok(fs.existsSync(new URL('../dist/'+p.slice(2),import.meta.url)),p);items.set(new URL(p,'https://mora.test/').href,new Response(p));}},async match(r,options){if(options!==undefined)assert.equal(typeof options,'object');const url=typeof r==='string'?new URL(r,'https://mora.test/').href:r.url;return items.get(url)?.clone();}};
vm.runInNewContext(fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8'),{URL,self:{location:{origin:'https://mora.test'},registration:{scope:'https://mora.test/'},clients:{claim(){claimed=true;}},addEventListener(k,v){handlers[k]=v;},skipWaiting(){}},caches:{open:async()=>cache,keys:async()=>['mora-shell-v25'],delete:async()=>true},fetch(){throw Error('Offline');}});
let task;handlers.install({waitUntil(p){task=p;}});await task;handlers.activate({waitUntil(p){task=p;}});await task;assert.equal(claimed,true);
handlers.fetch({request:new Request('https://mora.test/app.js'),respondWith(p){task=p;}});assert.equal(await (await task).text(),'./app.js');
let intercepted=false;handlers.fetch({request:new Request('https://mora.test/index.html',{cache:'no-store'}),respondWith(){intercepted=true;}});assert.equal(intercepted,false);
handlers.fetch({request:new Request('https://other.test/'),respondWith(){intercepted=true;}});assert.equal(intercepted,false);assert.ok(items.has('https://mora.test/local-data.js'));assert.ok(items.has('https://mora.test/receiving.js'));
console.log('Offline shell logic passed: complete local asset list, cached modules without network, health requests and other origins bypassed. Browser activation/relaunch remains unverified.');

const manifest=JSON.parse(fs.readFileSync(new URL('../dist/manifest.webmanifest',import.meta.url),'utf8'));assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.display,'standalone');for(const icon of manifest.icons)assert.ok(fs.existsSync(new URL('../dist/'+icon.src,import.meta.url)));
const code=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');for(const name of ['workflow-ui.js','correction-ui.js','reports-ui.js','writer-gate.js','extended-validation.js'])assert.ok(items.has('https://mora.test/'+name));
const pageRequest={method:'GET',url:'https://mora.test/returning-route',mode:'navigate',cache:'default'};handlers.fetch({request:pageRequest,respondWith(p){task=p;}});assert.equal(await (await task).text(),'./index.html');
const scoped=code.match(/const ASSETS=(\[[^;]+\])/)[1];for(const path of JSON.parse(scoped.replaceAll("'",'"'))){const url=new URL(path,'https://mora.test/mora-vineria/sites-next/dist/');assert.ok(url.pathname.startsWith('/mora-vineria/sites-next/dist/'));}
console.log('PWA static checks passed: manifest/icons, critical modules, navigation fallback and relative resource scope below GitHub Pages subdirectory; installation and device reopening unverified.');
