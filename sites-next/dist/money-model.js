// Monetary facts shared by the local workspace and the isolated demo. No bank connection.
export const accounts=[{id:'cash',name:'Efectivo',type:'cash'},{id:'brubank',name:'Brubank',type:'bank'},{id:'mp',name:'Mercado Pago',type:'bank'},{id:'nx',name:'Naranja X',type:'bank'}];
export const accountName=id=>accounts.find(a=>a.id===id)?.name||'Cuenta desconocida';
export const paymentCashDue=(method,total,share)=>method==='cash'?total:method==='mixed'?Number(share||0):0;
export function paymentValid({method,total,share,received,customer}){
  if(!Number.isSafeInteger(total)||total<0)return false;
  if(method==='credit')return !!customer.trim();
  if(method==='transfer')return true;
  const part=paymentCashDue(method,total,share);
  if(method==='mixed'&&(!Number.isSafeInteger(part)||part<=0||part>=total))return false;
  if(!['cash','mixed'].includes(method))return false;
  return (part===0||received!=='')&&Number.isSafeInteger(Number(received))&&Number(received)>=part;
}
export function buildPaymentParts({method,total,share,account,verified,at}){
  if(!Number.isSafeInteger(total)||total<0||!['cash','transfer','mixed','credit'].includes(method))throw new Error('Pago inválido');
  const cash=paymentCashDue(method,total,share),parts=[];
  if(method==='mixed'&&(!Number.isSafeInteger(cash)||cash<=0||cash>=total))throw new Error('Distribución inválida');
  if(cash>0)parts.push({method:'cash',account:'cash',amount:cash,verified:true,verifiedAt:at});
  if(['transfer','mixed'].includes(method)&&total-cash>0){if(!accounts.some(a=>a.id===account&&a.type==='bank'))throw new Error('Cuenta inválida');parts.push({method:'transfer',account,amount:total-cash,verified:!!verified,verifiedAt:verified?at:null});}
  return parts;
}
export function appendMovement(ledger,{kind,legs,source,note='',at,day}){
  if(!source||!['sale','contribution','expense','withdrawal','purchase','move','debt-payment','purchase-payment','sale-correction','payment-correction'].includes(kind))throw new Error('Origen o clase de movimiento inválidos');
  if(source&&ledger.some(e=>e.source===source))return false;
  if(!legs.length||!legs.every(l=>accounts.some(a=>a.id===l.account)&&Number.isSafeInteger(l.amount)&&l.amount!==0))throw new Error('Movimiento inválido');
  const sum=legs.reduce((a,l)=>a+l.amount,0);
  if(kind==='move'&&(legs.length!==2||legs[0].account===legs[1].account||sum!==0))throw new Error('Traspaso inválido');
  if(['sale','contribution','debt-payment'].includes(kind)&&legs.some(l=>l.amount<0))throw new Error('Ingreso inválido');
  if(['expense','withdrawal','purchase','purchase-payment'].includes(kind)&&legs.some(l=>l.amount>0))throw new Error('Egreso inválido');
  ledger.push({seq:ledger.length+1,kind,legs:structuredClone(legs),source,note,at,day});return true;
}
export function expectedBalance(account,reference,ledger){
  const base=reference||{amount:0,seq:0};
  return base.amount+ledger.filter(e=>e.seq>base.seq).reduce((sum,e)=>sum+e.legs.filter(l=>l.account===account).reduce((a,l)=>a+l.amount,0),0);
}
export function dailyMoney(ledger,day){
  const result={cash:0,transfer:0,other:0,purchase:0,expense:0,withdrawal:0};
  for(const e of ledger.filter(e=>e.day===day)){
    if(e.kind==='move')continue;
    for(const l of e.legs){if(e.kind==='sale'||e.kind==='debt-payment'||e.kind==='sale-correction')result[l.account==='cash'?'cash':'transfer']+=l.amount;
      else if(e.kind==='contribution')result.other+=l.amount;
      else if(e.kind==='purchase-payment')result.purchase-=l.amount;
      else if(e.kind in result)result[e.kind]-=l.amount;}
  }
  return result;
}
