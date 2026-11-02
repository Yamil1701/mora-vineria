import {mkdir,stat,chmod,readFile} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {createBrotliDecompress} from 'node:zlib';
import {pipeline} from 'node:stream/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
// Reproducible Chromium from the pinned NPM package, without a CDN download,
// vendor telemetry or ownership-changing extraction in managed containers.
export async function chromiumPath(){
  if(process.env.MORA_CHROMIUM)return process.env.MORA_CHROMIUM;
  const out=join(tmpdir(),'mora-qa-chromium-153');await mkdir(out,{recursive:true});
  const binary=join(out,'chromium');if(await stat(binary).then(s=>s.size>1000000).catch(()=>false))return binary;
  for(const [source,target] of [['chromium.br','chromium'],['fonts.tar.br','fonts.tar'],['swiftshader.tar.br','swiftshader.tar']]){
    await pipeline(createReadStream(new URL('../node_modules/@sparticuz/chromium/bin/'+source,import.meta.url)),createBrotliDecompress(),createWriteStream(join(out,target)));
    if(target.endsWith('.tar'))execFileSync('tar',['--no-same-owner','-xf',join(out,target),'-C',out]);
  }
  await chmod(binary,0o700);return binary;
}
