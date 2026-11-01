// Trusted server boundary. No browser-supplied snapshot is accepted here.
// The caller must supply an identity verified by Auth, never one from the JSON body.
import {validateData} from '../dist/local-data.js';
import {prepareOperation,applyOperation,canonical,businessDay} from '../dist/operations.js';
import {applyCommand,COMMAND_KINDS,sharedSnapshot} from '../dist/command-domain.js';

export class CommandError extends Error{
  constructor(code,message){super(message);this.code=code;}
}
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
const allowed=new Set(COMMAND_KINDS);
export function validateRequest(input,actor){
  if(!uuid(actor?.userId))throw new CommandError('FORBIDDEN','Acceso no autorizado.');
  if(!input||!uuid(input.businessId)||!uuid(input.deviceId)||!id(input.id)||!allowed.has(input.kind)||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0)throw new CommandError('REJECTED','Identidad o versión inválidas.');
  if(typeof input.at!=='string'||!/^\d{4}-\d\d-\d\dT/.test(input.at)||!Number.isFinite(Date.parse(input.at)))throw new CommandError('REJECTED','Fecha inválida.');
  if(!input.payload||typeof input.payload!=='object'||Array.isArray(input.payload)||canonical(input.payload).length>(input.kind==='import-initial'?11000000:200000))throw new CommandError('REJECTED','Contenido inválido.');
  // Whitelist the envelope, including its sealed physical timestamp.
  return structuredClone(Object.fromEntries(['businessId','deviceId','id','kind','payload','expectedRevision','at'].map(k=>[k,input[k]])));
}
export async function requestDigest(request){
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(request)));
  return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export function createCommandService({repository,now=()=>new Date().toISOString()}){
  return {
    async read(actor,input){if(!uuid(actor?.userId)||!uuid(input?.businessId)||!uuid(input?.deviceId))throw new CommandError('FORBIDDEN','Acceso no autorizado.');return repository.read({userId:actor.userId,businessId:input.businessId,deviceId:input.deviceId});},
    async result(actor,input){const r=validateRequest(input,actor);return repository.lookup({...actor,businessId:r.businessId,deviceId:r.deviceId},r);},
    async submit(actor,input){
      const r=validateRequest(input,actor),context={userId:actor.userId,businessId:r.businessId,deviceId:r.deviceId};
      // lookup also checks current membership and revocation, even for a replay.
      const prior=await repository.lookup(context,r);if(prior)return prior;
      const current=await repository.read(context);
      if(current.revision!==r.expectedRevision)throw new CommandError('CONFLICT','Los datos cambiaron. Conservamos el registro para revisar.');
      if(r.kind==='import-initial'){if(current.revision!==0)throw new CommandError('REJECTED','La importación inicial requiere un negocio nuevo y vacío.');const {readBackup}=await import('../dist/local-data.js');const digest=await requestDigest(readBackup(r.payload.rawBackup));if(digest!==r.payload.sourceDigest)throw new CommandError('REJECTED','La copia cambió desde su revisión.');}
      let next,result;
      try{next=validateData(current.snapshot);result=applyCommand(next,r);next=validateData(next);}catch(error){throw new CommandError('REJECTED',error.message);}
      const response={...r,status:'confirmed',revision:r.expectedRevision+1,result,confirmedAt:now()};
      // The repository must atomically recheck access/revision and commit facts + result.
      return repository.commit(context,r,await requestDigest(r),next,response);
    }
  };
}
