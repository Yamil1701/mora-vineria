import {freezeCartPrices} from './cart-model.js';
// Product identity changes never rewrite sales, orders, receipts or FIFO lots.
export const productModels=['bottle','can','carton','pack'];
export const validProductPhoto=s=>typeof s==='string'&&s.length<=90000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(s);
export function productDraft(p){const m=/^([\d.]+)\s*(ml|L)$/i.exec(p.size);return {id:p.id,expectedPriceVersion:p.priceVersion||0,name:p.name,variety:p.variety,cat:p.cat,volume:m?.[1]||'',volumeUnit:m?.[2]?.toLowerCase()==='l'?'L':'ml',price:String(p.price),target:String(p.target||''),barcode:p.barcode||'',photo:p.photo||'',model:p.model||'bottle'};}
export function writeProduct(s,d,{id,at=new Date().toISOString()}={}){
  const old=d.id?s.products.find(p=>p.id===d.id):null;
  if(d.id&&!old)throw Error('No encontré el producto para editar.');
  if(old&&(d.expectedPriceVersion??0)!==(old.priceVersion||0))throw Error('El precio cambió desde que abriste el producto. Volvé a abrirlo para revisar.');
  freezeCartPrices(s);
  const name=String(d.name||'').trim(),variety=String(d.variety||'').trim(),v=Number(String(d.volume).replace(',','.')),unit=d.volumeUnit||'ml',price=Number(d.price),target=Number(d.target||0),barcode=String(d.barcode||'').trim();
  if(!name||name.length>60||!variety||variety.length>60)throw Error('Completá el nombre y la variedad.');
  const ml=v*(unit==='L'?1000:1);if(!['ml','L'].includes(unit)||!Number.isFinite(v)||v<=0||ml>10000||Math.abs(ml-Math.round(ml))>1e-6)throw Error('Revisá el contenido: hasta 10 L, sin fracciones de ml.');
  if(!Number.isSafeInteger(price)||price<1||price>999999999||!Number.isSafeInteger(target)||target<0||target>99999)throw Error('Revisá el precio y el stock objetivo.');
  if(barcode&&(!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(barcode)||!validGTIN(barcode)))throw Error('Revisá el código de barras o dejalo vacío.');
  if(barcode&&s.products.some(p=>p.id!==old?.id&&p.barcode?.padStart(14,'0')===barcode.padStart(14,'0')))throw Error('Ese código ya pertenece a otro producto, incluso si está desactivado.');
  if(d.photo&&!validProductPhoto(d.photo))throw Error('La foto no es válida. Volvé a elegirla.');
  if(!['Tintos','Blancos','Rosados','Cervezas','Sin alcohol','Aperitivos','Espirituosas','Otros'].includes(d.cat))throw Error('Elegí una categoría.');
  const patch={name,variety,cat:d.cat,size:String(v)+' '+unit,price,target,barcode,model:productModels.includes(d.model)?d.model:'bottle',photo:d.photo||'',tone:d.cat==='Tintos'?'red':d.cat==='Blancos'?'white':'rose'};
  const photos=s.products.reduce((n,p)=>n+(p.id===old?.id?0:(p.photo?.length||0)),0)+(patch.photo.length||0);if(photos>2500000)throw Error('El espacio de fotos está completo. Quitá alguna foto o usá un modelo.');
  if(old){const changes={};for(const [k,v] of Object.entries(patch))if(old[k]!==v)changes[k]={before:k==='photo'?Boolean(old[k]):(old[k]??null),after:k==='photo'?Boolean(v):v};if(Object.keys(changes).length){if(old.price!==patch.price)old.priceVersion=(old.priceVersion||0)+1;old.changes=[...(old.changes||[]),{at,kind:'edit',fields:changes}];Object.assign(old,patch);}}
  else{s.products.push({id,...patch,priceVersion:0,stock:0,origin:'Sin especificar',active:true,changes:[{at,kind:'create'}]});}
  return old||s.products.at(-1);
}
export function setProductActive(s,id,active,at=new Date().toISOString()){
  const p=s.products.find(p=>p.id===id);if(!p)throw Error('No encontré el producto.');
  if(s.cart[id])throw Error('Quitá este producto del carrito antes de desactivarlo.');
  if((p.active!==false)===active)return false;
  p.active=active;p.changes=[...(p.changes||[]),{at,kind:active?'activate':'deactivate'}];
  if(!active)s.favorites=s.favorites.filter(f=>f!==id);return true;
}
function validGTIN(s){let sum=0;const a=s.slice(0,-1).split('').reverse();a.forEach((x,i)=>sum+=Number(x)*(i%2?1:3));return (10-sum%10)%10===Number(s.at(-1));}
