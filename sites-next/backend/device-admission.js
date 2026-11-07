const codePattern=/^[0-9a-f]{32}$/;
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reject=()=>Object.assign(Error('Revisá los datos de la vinculación.'),{code:'REJECTED'});
export function createDeviceAdmission({repo,hash,deviceKey,issueSession}){
  return {
    manage:async(actor,input,request)=>{
      const {op,businessId,deviceId,code,targetId}=input||{};
      if(!uuidPattern.test(businessId)||!uuidPattern.test(deviceId))throw reject();
      const credential=await hash(deviceKey(request));
      const call=(args={})=>repo.manageDevices({businessId,deviceId,userId:actor.userId},credential,op,args);
      if(op==='list')return call();
      if(op==='revoke'){
        if(!uuidPattern.test(targetId)||targetId===deviceId)throw reject();
        return call({targetId});
      }
      if(op==='issue'){
        const next=crypto.randomUUID().replaceAll('-','');
        return {...await call({codeHash:await hash(next)}),code:next};
      }
      if(!['status','approve','cancel'].includes(op)||!codePattern.test(code))throw reject();
      return call({codeHash:await hash(code)});
    },
    pair:async(input,request)=>{
      const {op,code,deviceId,label}=input||{};
      if(!['request','status','claim'].includes(op)||!uuidPattern.test(deviceId)||!codePattern.test(code))throw reject();
      const name=typeof label==='string'?label.trim():'';
      if(op==='request'&&(!name||name.length>80))throw reject();
      const proof=await hash(deviceKey(request));
      const confirmation=op==='request'?String(crypto.getRandomValues(new Uint16Array(1))[0]%10000).padStart(4,'0'):null;
      const candidate={codeHash:await hash(code),deviceId,proof,label:name||null,confirmation};
      const result=await repo.pairDevice({...candidate,op});
      if(result.state!=='linked')return result;
      const session=await issueSession(result.userId);
      const complete=await repo.pairDevice({...candidate,op:'complete'});
      return complete.state==='linked'?{...result,session}:complete;
    }
  };
}

// The approved destination gets a fresh Auth session for the existing user.
// The magic link is exchanged inside Edge and never returned to either phone.
export function createDeviceSessionIssuer({url,secret,publicKey,fetcher=fetch}){
  const admin={apikey:secret,...(secret.startsWith('eyJ')?{Authorization:'Bearer '+secret}:{})};
  const call=async(path,headers,body)=>{
    const r=await fetcher(url+'/auth/v1/'+path,body===undefined?{headers}:{
      method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body)
    });
    if(!r.ok)throw Error('No pudimos abrir la sesión del dispositivo.');
    return r.json();
  };
  return async userId=>{
    const user=await call('admin/users/'+userId,admin);
    if(user.id!==userId||!user.email||!user.email_confirmed_at)throw Error('La cuenta necesita un acceso válido.');
    const link=await call('admin/generate_link',admin,{type:'magiclink',email:user.email});
    const token=link.hashed_token;
    if((link.id||link.user?.id)!==userId||!/^[a-f0-9]{40,128}$/i.test(token))throw Error('El enlace no corresponde a la cuenta.');
    const session=await call('verify',{apikey:publicKey},{token_hash:token,type:'email'});
    if(session.user?.id!==userId||!session.access_token||!session.refresh_token)throw Error('La sesión no corresponde a la cuenta.');
    return {...session,expires_at:session.expires_at??Math.floor(Date.now()/1000)+(session.expires_in||3600)};
  };
}
