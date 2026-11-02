import assert from 'node:assert/strict';
import {buildPaymentParts,paymentValid,appendMovement,expectedBalance,dailyMoney} from '../dist/money-model.js';
const at='2026-10-28T01:00:00Z',day='2026-10-27',ledger=[];
const draft={method:'cash',total:8500,share:'',received:'10000',customer:'',account:'brubank',verified:false,at};
assert.equal(paymentValid(draft),true);
assert.equal(paymentValid({...draft,received:'8000'}),false);
const cash=buildPaymentParts(draft);assert.equal(cash[0].amount,8500);
const post=(parts,base)=>parts.filter(p=>p.verified).forEach((p,i)=>appendMovement(ledger,{kind:'sale',legs:[{account:p.account,amount:p.amount}],source:base+':'+i,at,day}));
post(cash,'s1');post(cash,'s1');assert.equal(ledger.length,1);assert.equal(expectedBalance('cash',{amount:20000,seq:0},ledger),28500);
assert.equal(expectedBalance('cash',undefined,ledger),8500);
const pending=buildPaymentParts({...draft,method:'transfer'});post(pending,'s2');assert.equal(ledger.length,1);
pending[0].verified=true;post(pending,'s2');post(pending,'s2');assert.equal(ledger.length,2);
assert.equal(paymentValid({...draft,method:'mixed',share:'2000',received:'2500'}),true);
assert.equal(paymentValid({...draft,method:'mixed',share:'8500'}),false);
assert.equal(paymentValid({...draft,method:'mixed',share:'-5'}),false);
const mixed=buildPaymentParts({...draft,method:'mixed',share:'2000',verified:false});assert.deepEqual(mixed.map(p=>p.amount),[2000,6500]);post(mixed,'s3');assert.equal(ledger.length,3);
assert.equal(buildPaymentParts({...draft,method:'credit'}).length,0);
assert.equal(paymentValid({...draft,method:'credit',customer:'  '}),false);
const before=dailyMoney(ledger,day);assert.deepEqual(before,{cash:10500,transfer:8500,other:0,purchase:0,expense:0,withdrawal:0});
appendMovement(ledger,{kind:'move',legs:[{account:'cash',amount:-3000},{account:'brubank',amount:3000}],at,day,source:'move'});
assert.deepEqual(dailyMoney(ledger,day),before);assert.equal(expectedBalance('cash',{amount:20000,seq:0},ledger),27500);
assert.throws(()=>appendMovement(ledger,{kind:'move',legs:[{account:'cash',amount:-3000},{account:'cash',amount:3000}],at,day,source:'invalid-move'}));
assert.throws(()=>appendMovement(ledger,{kind:'expense',legs:[{account:'cash',amount:100}],at,day,source:'invalid-expense'}));
const ref={amount:50000,seq:ledger.length};appendMovement(ledger,{kind:'expense',legs:[{account:'cash',amount:-2000}],at,day,source:'expense'});assert.equal(expectedBalance('cash',ref,ledger),48000);
appendMovement(ledger,{kind:'contribution',legs:[{account:'cash',amount:4000}],at,day,source:'contribution'});
appendMovement(ledger,{kind:'withdrawal',legs:[{account:'cash',amount:-1000}],at,day,source:'withdrawal'});
assert.deepEqual(dailyMoney(ledger,day),{cash:10500,transfer:8500,other:4000,purchase:0,expense:2000,withdrawal:1000});
assert.deepEqual(dailyMoney(ledger,'2026-10-28'),{cash:0,transfer:0,other:0,purchase:0,expense:0,withdrawal:0});


assert.throws(()=>buildPaymentParts({...draft,method:'mixed',share:'9000'}));
assert.throws(()=>buildPaymentParts({...draft,total:1.5}));
assert.throws(()=>buildPaymentParts({...draft,method:'transfer',account:'cash'}));



assert.equal(expectedBalance('cash',undefined,[]),0);
assert.equal(expectedBalance('brubank',undefined,ledger),11500);

console.log('Money invariants passed: net cash, pending/confirmed transfer, mixed sums, idempotency, references, paired transfers, daily classifications.');
