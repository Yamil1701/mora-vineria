// Transactional local storage candidate. Not activated by app.js: controller
// integration must become asynchronous before it can replace localStorage.
import {emptyData,validateData,readBackup,backupText,hasBusinessData} from './local-data.js';
import {prepareOperation,applyOperation} from './operations.js';

export function openAtomicStore({indexedDB=globalThis.indexedDB,name='mora.atomic.candidate'}={}){
  if(!indexedDB)return Promise.reject(Error('Este navegador no permite abrir el almacenamiento seguro.'));
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(name,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('snapshots');
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(Error('Cerrá otras versiones antes de actualizar el almacenamiento.'));
    request.onsuccess=()=>{
      const db=request.result;db.onversionchange=()=>db.close();
      function change(expected,operation){return new Promise((resolveChange,rejectChange)=>{
        let tx;try{tx=db.transaction('snapshots','readwrite',{durability:'strict'});}catch(error){rejectChange(error);return;}
        const store=tx.objectStore('snapshots'),read=store.get('current');let output,failure;
        read.onsuccess=()=>{try{
          const previous=read.result||{revision:0,data:emptyData()},data=validateData(previous.data);
          const result=operation(data,store);
          if(result?.unchanged){output={...previous,result:result.result};return;}
          if(expected!==undefined&&expected!==previous.revision)throw Error('Los datos cambiaron. Volvé a revisar antes de guardar.');
          const next={revision:previous.revision+1,data:validateData(data)};store.put(next,'current');output={...next,result};
        }catch(error){failure=error;tx.abort();}};
        tx.oncomplete=()=>resolveChange(structuredClone(output));
        tx.onabort=()=>rejectChange(failure||tx.error||Error('No se guardaron los cambios.'));
        tx.onerror=()=>{failure??=tx.error;};
      });}
      const load=()=>new Promise((resolveLoad,rejectLoad)=>{
        const tx=db.transaction('snapshots','readonly'),request=tx.objectStore('snapshots').get('current');let value;
        request.onsuccess=()=>{value=request.result||{revision:0,data:emptyData()};};
        tx.oncomplete=()=>{try{resolveLoad({revision:value.revision,data:validateData(value.data)});}catch(error){rejectLoad(error);}};
        tx.onabort=()=>rejectLoad(tx.error);
      });
      resolve({load,close:()=>db.close(),
        prepare:(command,expected)=>change(expected,data=>{prepareOperation(data,command);data.workState.activeOperationId=command.id;return {id:command.id};}),
        confirm:(id,expected)=>change(expected,data=>{
          const op=data.operations.find(o=>o.id===id);if(op?.status==='confirmed')return {unchanged:true,result:structuredClone(op.result)};
          const result=applyOperation(data,id);data.workState.activeOperationId=null;return result;
        }),
        importIntoEmpty:raw=>change(undefined,(data,store)=>{
          if(hasBusinessData(data))throw Error('Los datos actuales se conservan. Recuperá la copia en un espacio vacío.');
          const imported=readBackup(raw);store.put(backupText(data),'before-restore');Object.assign(data,imported);return {restored:true};
        }),
        export:async()=>backupText((await load()).data)
      });
    };
  });
}
