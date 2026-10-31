import {startWriterGate} from '../dist/writer-gate.js';
import {identifiedSaleCost} from '../dist/business-read.js';
import {effectiveSale,saleKey} from '../dist/business-read.js';
import {createWorkspaceUI} from '../dist/workflow-ui.js';
import {finishWorkflowOperation,WORKFLOW_FIELDS,WORKFLOW_PAGES} from '../dist/workflow-state.js';
import {receiptRemaining,receiptPaid} from '../dist/business-read.js';
import * as shortages from '../dist/shortage-model.js';
import {DRAFT_FIELDS} from '../dist/draft-model.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import * as cart from '../dist/cart-model.js';
import * as operations from '../dist/operations.js';
import * as purchasing from '../dist/purchasing.js';
import * as product from '../dist/product-model.js';
import * as supplier from '../dist/supplier-engine.js';
import * as costs from '../dist/costs.js';
import * as orders from '../dist/purchase-orders.js';
import * as data from '../dist/local-data.js';
import * as receiving from '../dist/receiving.js';
import * as money from '../dist/money-model.js';
import * as catalog from '../dist/catalog-data.js';
const memory=new Map();let fault=null;
const storage={getItem:k=>memory.get(k)??null,removeItem:k=>memory.delete(k),setItem(k,v){if(fault==='before'&&k==='mora.local.v1'&&JSON.parse(v).data.operations.some(o=>o.kind==='sale'&&o.status==='confirmed'))throw Error('No space');memory.set(k,String(v));if(fault==='after'&&k==='mora.local.v1'&&JSON.parse(v).data.operations.some(o=>o.kind==='sale'&&o.status==='confirmed'))throw Error('Response lost');}};
function boot(){
  const app={innerHTML:'',addEventListener(){}},notice={hidden:true},tasks=[];
  const context=vm.createContext({startWriterGate,identifiedSaleCost,effectiveSale,saleKey,createWorkspaceUI,finishWorkflowOperation,WORKFLOW_FIELDS,WORKFLOW_PAGES,receiptRemaining,receiptPaid,...shortages,DRAFT_FIELDS,...cart,...operations,...purchasing,...product,...supplier,...costs,...orders,...data,...receiving,...money,...catalog,crypto:{randomUUID},structuredClone,Date,Intl,setTimeout,clearTimeout,queueMicrotask:f=>tasks.push(f),navigator:{},document:{querySelector(s){if(s==='#app')return app;if(s==='#notice')return notice;if(s==='h1')return {focus(){}};return null;}},window:{localStorage:storage,sessionStorage:{getItem(){return null;}},scrollY:0,location:{href:'https://isolated.test/'},history:{replaceState(){},pushState(){}},scrollTo(){},addEventListener(){}},stopScanner(){},mountScanner(){},installUpdateGate(){}});
  const code=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/^checkConnection\(\);$/m,'');
  vm.runInContext(code+'\nthis.qa={state,add,go,commitData,confirmSale,performLocalOperation,total,cartView,productList,filteredProducts,captureWork,cleanup(){clearTimeout(noticeTimer);clearTimeout(clearTimer);}};',context);return context.qa;
}
let q=boot();q.state.products=[{...catalog.seeds[0],stock:0,price:3500}];
receiving.receiveGoods(q.state,{id:'r_initial',supplier:'Test',items:[{productId:'p1',qty:6,lineCost:18000}],paid:false,at:'2026-10-30T12:00:00.000Z',day:'2026-10-30'});
q.state.page='sale';q.add('p1');Object.assign(q.state,{page:'pay',method:'mixed',cashShare:'1000',received:'5000',customer:'Ana',discount:100,transferAccount:'mp',transferVerified:false});q.commitData();const opId=q.state.saleOperationId;q.cleanup();
q=boot();assert.equal(q.state.page,'pay');assert.equal(q.state.cart.p1,1);assert.equal(q.state.saleOperationId,opId);assert.equal(q.state.received,'5000');assert.equal(q.state.method,'mixed');assert.equal(q.state.cashShare,'1000');assert.equal(q.state.discount,100);assert.equal(q.state.transferAccount,'mp');
q.state.products[0].price=5500;q.commitData();assert.equal(q.total(),3500);assert.match(q.cartView(),/3\.500/);
// Failure before final write: prepared intent survives; next boot finishes it.
fault='before';q.confirmSale();assert.equal(q.state.sales.length,0);assert.equal(q.state.operations[0].status,'prepared');assert.equal(q.state.cart.p1,1);q.cleanup();fault=null;
q=boot();assert.equal(q.state.sales.length,1);assert.equal(q.state.products[0].stock,5);assert.equal(q.state.page,'done');assert.equal(q.state.completed.number,'001');assert.equal(q.state.cart.p1,undefined);assert.equal(q.state.sales[0].total,3400);assert.equal(q.state.ledger.length,1);q.cleanup();
// Failure after final write: snapshot already has all effects and the receipt.
q=boot();Object.assign(q.state,{page:'sale',received:'',method:'cash'});q.add('p1');Object.assign(q.state,{page:'pay',received:'6000'});q.commitData();fault='after';q.confirmSale();q.cleanup();fault=null;
q=boot();assert.equal(q.state.sales.length,2);assert.equal(q.state.products[0].stock,4);assert.equal(q.state.completed.number,'002');assert.equal(q.state.page,'done');assert.equal(q.state.ledger.length,2);
q.confirmSale();assert.equal(q.state.sales.length,2);q.cleanup();
assert.equal(data.readBackup(data.backupText(JSON.parse(storage.getItem('mora.local.v1')).data)).sales.length,2);
console.log('Actual app recovery: full payment draft restored, fixed price through catalogue changes, failure before final write, response lost after final write, reload recovers one result and never repeats stock or money.');

const invalidDraft=JSON.parse(storage.getItem('mora.local.v1')).data;invalidDraft.workState.page='unknown-page';assert.throws(()=>data.validateData(invalidDraft),/preparación/);

q=boot();q.go('catalog');q.state.search='Malbec';q.state.stockFilter=true;q.state.zeroOnly=true;q.go('home',{root:true});q.go('catalog');assert.equal(q.state.search,'Malbec');assert.equal(q.state.stockFilter,true);assert.equal(q.state.zeroOnly,true);q.cleanup();q=boot();assert.equal(q.state.page,'catalog');assert.equal(q.state.search,'Malbec');q.cleanup();

q=boot();Object.assign(q.state,{page:'pay',cart:{p1:6},cartPrices:{p1:{catalogPriceAtAdd:5500,appliedUnitPrice:5500}},shortageAccepted:{p1:6},method:'cash',received:'40000',discount:0});shortages.acceptShortages(q.state);q.confirmSale();assert.equal(q.state.products[0].stock,-2);q.state.page='catalog';q.state.search='';q.state.stockFilter=false;q.state.zeroOnly=false;assert.doesNotMatch(q.productList(),/-2 disponibles/);assert.match(q.productList(),/Sin stock/);q.cleanup();
