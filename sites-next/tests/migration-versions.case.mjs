import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {readBackup,backupText,DATA_KEYS} from '../dist/local-data.js';
const path=new URL('./fixtures/',import.meta.url);
test('authentic v3 and frozen-v26 v4 backups upgrade to v5 without losing common business facts',async()=>{
  const files=await fs.readdir(path);const v3=files.find(f=>f.includes('v3'));assert.ok(v3);
  const a=readBackup(await fs.readFile(new URL(v3,path),'utf8')),b=readBackup(await fs.readFile(new URL('backup-v4.json',path),'utf8'));
  assert.deepEqual(a,b);for(const d of [a,b]){const raw=backupText(d);assert.equal(JSON.parse(raw).version,5);assert.deepEqual(readBackup(raw),d);assert.ok(DATA_KEYS.every(k=>k in d));}
});
