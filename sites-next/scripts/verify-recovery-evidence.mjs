import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {DATA_KEYS,readBackup} from '../dist/local-data.js';
import {applyOperation} from '../dist/operations.js';
import {migrationFacts} from '../dist/migration-plan.js';

// These are synthetic files captured through the browser's real file controls.
// This comparison proves their contents; browser actions are recorded separately.
const root=resolve(process.argv[2]||'verificacion/recuperacion-json-v29');
const names=['Mora-QA-restauracion-v28.json','Mora-QA-exportado-antes-recarga.json','Mora-QA-exportado-despues-recargas.json'];
const raw=await Promise.all(names.map(name=>readFile(resolve(root,name),'utf8')));
const [input,before,after]=raw.map(readBackup);
const business=d=>Object.fromEntries(DATA_KEYS.filter(k=>k!=='workState').map(k=>[k,d[k]]));
assert.deepEqual(business(before),business(input));
assert.equal(before.operations.find(o=>o.id==='qa_prepared_expense').status,'prepared');
const expected=structuredClone(input);applyOperation(expected,'qa_prepared_expense');
assert.deepEqual(business(after),business(expected));
assert.equal(after.operations.find(o=>o.id==='qa_prepared_expense').status,'confirmed');
assert.equal(after.ledger.filter(e=>e.source==='manual:qa_prepared_expense').length,1);
assert.equal(after.ledger.length,before.ledger.length+1);
assert.equal(after.lots.find(l=>l.id==='qa_open_1').totalCost,null);
console.log(JSON.stringify({
  businessEntitiesMatch:true,preparedRecoveredExactlyOnce:true,
  excludedComparisonKeys:['workState'],
  before:migrationFacts(before),after:migrationFacts(after),
  files:names.map((name,i)=>({name,sha256:createHash('sha256').update(raw[i]).digest('hex')}))
},null,2));
