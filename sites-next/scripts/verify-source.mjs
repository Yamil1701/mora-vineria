import fs from 'node:fs/promises';import {resolve,relative,dirname} from 'node:path';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const root=resolve('dist'),seen=new Set();
async function visit(file){assert.ok(file.startsWith(root+'/'));if(seen.has(file))return;seen.add(file);const text=await fs.readFile(file,'utf8');for(const m of text.matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g))await visit(resolve(dirname(file),m[1]));}
await visit(resolve(root,'app.js'));
assert.ok(!seen.has(resolve(root,'idb-store.js'))&&!seen.has(resolve(root,'remote-queue.js')),'Experimental adapters require explicit integration gates before activation');
const sw=await fs.readFile(resolve(root,'sw.js'),'utf8'),assets=JSON.parse(sw.match(/const ASSETS=(\[[^;]+\])/)[1].replaceAll("'",'"'));
for(const asset of assets)if(asset!=='./')await fs.access(resolve(root,asset));
for(const file of seen)assert.ok(assets.includes('./'+relative(root,file)),relative(root,file)+' must be cached for offline use');
const manifest=JSON.parse(await fs.readFile(resolve(root,'manifest.webmanifest'),'utf8'));assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
for(const icon of manifest.icons){const b=await fs.readFile(resolve(root,icon.src));assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b.readUInt32BE(16)+'x'+b.readUInt32BE(20),icon.sizes);}
const files=[];async function walk(dir){for(const e of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const f=resolve(dir,e.name);if(e.isDirectory())await walk(f);else{const b=await fs.readFile(f);if(e.name.endsWith('.js'))assert.doesNotMatch(b.toString(),/sb_secret_[a-zA-Z0-9]{10,}|SUPABASE_SERVICE_ROLE_KEY/);files.push({path:relative(root,f),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}}}
await walk(root);await fs.mkdir('artifacts',{recursive:true});await fs.writeFile('artifacts/dist-manifest.json',JSON.stringify({entry:'app.js',reachable:[...seen].map(f=>relative(root,f)).sort(),files},null,2));
console.log(`Static source verified: ${seen.size} active modules, ${assets.length} cached paths, ${files.length} artifact files; experimental adapters inactive.`);
