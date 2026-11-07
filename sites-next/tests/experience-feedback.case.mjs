import {test} from 'node:test';
import assert from 'node:assert/strict';
import {paymentFeedback} from '../dist/experience-feedback.js';
import {money,signedMoney,dateText,timeText,timestampText} from '../dist/ui-format.js';
import {emptyData,backupText,readBackup} from '../dist/local-data.js';
import {keepForm,savedForm,forgetForm,workspaceFormKey,validateDrafts} from '../dist/draft-model.js';
import {finishWorkflowOperation} from '../dist/workflow-state.js';

test('mixed guidance stays incomplete until both cash inputs are valid, independent of transfer verification',()=>{
 for(const verified of [false,true])for(const share of ['', '0','3500','4000']){
  const f=paymentFeedback({method:'mixed',total:3500,share,received:'10000',transferVerified:verified});
  assert.equal(f.canConfirm,false);assert.equal(f.cashReady,false);assert.match(f.message,/Indicá/);
 }
 const base={method:'mixed',total:3500,share:'1000'};
 for(const received of ['','500']){const f=paymentFeedback({...base,received});assert.equal(f.canConfirm,false);assert.equal(f.cashReady,false);}
 const pending=paymentFeedback({...base,received:'2000'});assert.equal(pending.canConfirm,true);assert.equal(pending.transferPending,true);assert.equal(pending.message,'Transferencia por verificar');
 const paid=paymentFeedback({...base,received:'2000',transferVerified:true});assert.equal(paid.canConfirm,true);assert.equal(paid.transferPending,false);
 const blocked=paymentFeedback({...base,received:'2000',allowed:false,blockedMessage:'Confirmá la disponibilidad física.'});assert.equal(blocked.cashReady,false);assert.match(blocked.message,/disponibilidad/);
});

test('currency and dates share Spanish Argentina presentation without changing arithmetic or business-day semantics',()=>{
 assert.equal(money(8500),'$8.500');assert.equal(money(7625),'$7.625');assert.equal(money(1.25),'$1,25');assert.equal(money(-500),'−$500');assert.equal(signedMoney(500),'+$500');
 const fractional=17500/12;money(fractional);assert.equal(fractional,17500/12);
 assert.equal(dateText('2026-10-31'),'31 de octubre de 2026');
 assert.equal(dateText('2026-11-01T01:00:00Z'),'31 de octubre de 2026');assert.equal(timeText('2026-11-01T01:00:00Z'),'22:00');
 assert.equal(timestampText('2026-11-01T08:30:00Z','2026-10-31'),'1 de noviembre de 2026 · 05:30 · Jornada 31 de octubre de 2026');
 assert.equal(timestampText('2026-11-01T01:00:00Z','2026-10-31'),'31 de octubre de 2026 · 22:00');
});

test('separate form drafts survive backup and are removed when their operation completes',()=>{
 const d=emptyData();d.savedForms={};keepForm(d,'product:new',{name:'Pendiente',price:'4500'});keepForm(d,'product:p1',{id:'p1',name:'Edición'});keepForm(d,workspaceFormKey('debt-payment','debt_1'),{id:'w_test',kind:'debt-payment',amount:'250'});
 d.workState.savedForms=structuredClone(d.savedForms);const restored=readBackup(backupText(d));
 assert.equal(restored.workState.savedForms['product:new'].name,'Pendiente');
 finishWorkflowOperation(restored,{id:'w_test',kind:'debt-payment',payload:{debtId:'debt_1'}},{});
 assert.equal(restored.workState.savedForms['workspace:debt-payment:debt_1'],undefined);assert.ok(restored.workState.savedForms['product:new']);
 const copy=savedForm(d,'product:new');copy.name='Otra cosa';assert.equal(savedForm(d,'product:new').name,'Pendiente');forgetForm(d,'product:new');assert.equal(savedForm(d,'product:new'),null);
});

test('form capacity preserves accepted drafts and is separate from active work',()=>{
 const d=emptyData();
 const photo='data:image/jpeg;base64,'+'A'.repeat(85000);
 for(let i=0;i<5;i++)assert.equal(keepForm(d,'product:p'+i,{photo}),true);
 const accepted=d.savedForms;
 assert.equal(keepForm(d,'product:p5',{photo}),false);
 assert.equal(d.savedForms,accepted);
 d.workState={savedForms:accepted,supplierDraft:{source:'A'.repeat(100000)}};
 assert.doesNotThrow(()=>validateDrafts(d));
 forgetForm(d,'product:p0');assert.equal(keepForm(d,'product:p5',{photo}),true);

 d.savedForms={};
 for(let i=0;i<50;i++)assert.equal(keepForm(d,'product:p'+i,{name:'Pendiente'}),true);
 assert.equal(keepForm(d,'product:p50',{name:'Nuevo'}),false);
 assert.equal(keepForm(d,'product:p49',{name:'Actualizado'}),true);
 assert.equal(Object.keys(d.savedForms).length,50);
});
