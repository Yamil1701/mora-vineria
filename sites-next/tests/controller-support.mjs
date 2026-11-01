// Synthetic VM controller harness. It uses the production IndexedDB adapter.
// Fixture writes below are explicit test setup, never an application data path.
import {IDBFactory} from 'fake-indexeddb';
import {createPersistence as productionPersistence} from '../dist/persistence-controller.js';
import {snapshot} from '../dist/local-data.js';
export function controllerHarness({fault=()=>null}={}){
 let indexedDB=new IDBFactory();const name='controller';
 return {reset(){indexedDB=new IDBFactory();},async createPersistence(options){
  const p=await productionPersistence({...options,config:{enabled:false},storeOptions:{indexedDB,name,fault(w){if(fault()==='before'&&w.jobs.some(j=>j.request.kind==='sale'&&j.localApplied))throw Error('QuotaExceededError');if(fault()===true)throw Error('QuotaExceededError');}}});
  const perform=p.perform;p.perform=async(...args)=>{const r=await perform(...args);if(fault()==='after')throw Error('storage response interrupted');return r;};return p;
 },async seedFixture(p,state){const db=await new Promise((r,j)=>{const q=indexedDB.open(name,1);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);});await new Promise((r,j)=>{const tx=db.transaction('workspace','readwrite'),t=tx.objectStore('workspace'),q=t.get('current');q.onsuccess=()=>{const w=q.result;w.data=snapshot(state);t.put(w,'current');};tx.oncomplete=r;tx.onabort=()=>j(tx.error);});db.close();await p.store.load();},};
}
