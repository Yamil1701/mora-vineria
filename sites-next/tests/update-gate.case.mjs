// Event-level simulation of the real update controller, not browser offline emulation.
import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
let online=true,now=0,reloads=0,stashes=0,posted=0,latestDialog;const intervalCallbacks=new Map(),swListeners={};
const control=()=>({hidden:false,disabled:false,textContent:'',listeners:{},focused:false,focus(){this.focused=true;},addEventListener(k,v){this.listeners[k]=v;}});
function makeDialog(){const controls=new Map(),events={};const d={closed:false,removed:false,querySelector(s){if(!controls.has(s))controls.set(s,control());return controls.get(s);},setAttribute(){},addEventListener(k,v){events[k]=v;},showModal(){this.open=true;},close(){this.closed=true;},remove(){this.removed=true;},events};latestDialog=d;return d;}
const worker={postMessage(){posted++;}},reg={waiting:worker,addEventListener(){},update:async()=>{}};
const serviceWorker={controller:{},addEventListener(k,v){swListeners[k]=v;},register:async()=>reg,ready:Promise.resolve(reg)};
const navigator={serviceWorker,get onLine(){return online;}},window={location:{reload(){reloads++;}},addEventListener(){}},document={visibilityState:'visible',createElement:makeDialog,body:{append(){}}};
const context=vm.createContext({navigator,window,document,Date:{now:()=>now},setInterval(fn,ms){intervalCallbacks.set(ms,fn);return ms;},clearInterval(ms){intervalCallbacks.delete(ms);},setTimeout(){return 9;},clearTimeout(){},fetch:async()=>({ok:true}),AbortSignal:{timeout:()=>({})}});
vm.runInContext(fs.readFileSync(new URL('../dist/update-gate.js',import.meta.url),'utf8').replace(/export /g,'')+'\nthis.install=installUpdateGate;',context);context.install({beforeReload(){stashes++;},onReady(){}});await Promise.resolve();await Promise.resolve();
const dialog=latestDialog;assert.ok(dialog.open);assert.equal(dialog.querySelector('#update-title').focused,true);assert.equal(dialog.querySelector('[data-update-now]').focused,false);assert.equal(dialog.querySelector('[data-update-later]').hidden,true);let prevented=false;dialog.events.cancel({preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(dialog.closed,false);
dialog.querySelector('[data-update-now]').listeners.click();assert.equal(stashes,1);assert.equal(posted,1);assert.equal(reloads,0);now=9000;intervalCallbacks.get(1000)();assert.equal(dialog.querySelector('[data-update-later]').hidden,false);dialog.querySelector('[data-update-later]').listeners.click();assert.equal(dialog.closed,true);
// A late activation after choosing Continue must gate again, not reload over new edits.
swListeners.controllerchange();assert.equal(reloads,0);assert.notEqual(latestDialog,dialog);latestDialog.querySelector('[data-update-now]').listeners.click();assert.equal(stashes,2);assert.equal(reloads,1);
console.log('Update gate passed: mandatory normal modal, cancel prevention, slow escape, snapshot before activation and no surprise late reload after continuing.');

// A first installation can briefly expose waiting before activation; it is not an update.
latestDialog=undefined; serviceWorker.controller=null; context.install({beforeReload(){throw Error('Unexpected reload');},onReady(){}});await Promise.resolve();await Promise.resolve();assert.equal(latestDialog,undefined);
