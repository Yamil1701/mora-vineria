import {useEffect,useState,type FormEvent} from 'react';
import {GlassPanel,MoraButton} from '../ui/components';
import {formatArs} from '../ui/format';
import {parseInteger,signed} from '../domain/rules';
import type {FormOperation,Product} from '../domain/types';
import type {LocalService} from '../local/service';
import {errorText} from './OperationForms';
export type MovementKind='expense'|'contribution'|'count';
export function MovementForm({kind,initial,products,service,busy,onSave,onClose}:{kind:MovementKind;initial?:FormOperation;products:Product[];service:LocalService;busy:boolean;onSave:(o:FormOperation)=>Promise<void>;onClose:()=>void}) {
 const money=initial?.type==='RecordExpense'||initial?.type==='RecordContribution'?initial.payload:undefined;
 const prior=initial?.type==='RecordStockCount'?initial.payload:undefined;
 const [amount,setAmount]=useState(String(money?.amount??'')),[concept,setConcept]=useState(money?.concept??prior?.reason??''),[note,setNote]=useState(money?.note??prior?.note??'');
 const [productId,setProductId]=useState(prior?.productId??products[0]?.id??''),[counted,setCounted]=useState(String(prior?.counted??''));
 const [baseline,setBaseline]=useState<{stock:number;commandId:string|null}|null>(null),[confirmed,setConfirmed]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(kind!=='count'||!productId)return;let cancelled=false;setBaseline(null);setConfirmed(false);void service.stockBaseline(productId).then(b=>{if(!cancelled)setBaseline(b);}).catch(e=>{if(!cancelled)setError(errorText(e));});return()=>{cancelled=true;};},[kind,productId,service]);
 let difference:number|null=null;try{if(baseline&&counted.trim())difference=signed(parseInteger(counted,'Cantidad contada')-baseline.stock);}catch{/* shown on submit */}
 const title=kind==='expense'?'Registrar gasto':kind==='contribution'?'Registrar aporte':'Contar y ajustar stock';
 async function submit(e:FormEvent){e.preventDefault();setError('');try{
   if(!confirmed)throw new Error('Revisá los datos y confirmá lo ocurrido físicamente.');
   if(kind==='count'){if(!baseline)throw new Error('Esperá la lectura del stock.');await onSave({type:'RecordStockCount',payload:{countId:crypto.randomUUID(),productId,expectedStock:baseline.stock,expectedStockCommandId:baseline.commandId,counted:parseInteger(counted,'Cantidad contada'),reason:concept,note}});}
   else await onSave({type:kind==='expense'?'RecordExpense':'RecordContribution',payload:{movementId:crypto.randomUUID(),amount:parseInteger(amount,'Importe',true),concept,note}});
 }catch(e){setError(errorText(e));}}
 return <GlassPanel className="m2-operation-form"><div className="m2-section-top"><h2>{title}</h2><MoraButton variant="quiet" disabled={busy} onClick={onClose}>Cerrar</MoraButton></div>
 <p className="m2-muted-light">{kind==='expense'?'Salida de efectivo por un gasto puntual. Las compras de mercadería se registran en Recibir mercadería, para no descontarlas dos veces.':kind==='contribution'?'Dinero externo que entró en efectivo. No se registra como venta ni ganancia.':'Contá las unidades físicas. El ajuste conserva ventas anteriores; bajas por FIFO y sobrantes con costo desconocido.'}</p>
 <form onSubmit={submit}><fieldset disabled={busy}>
 {kind==='count'?<><label className="m2-field">Producto<select required value={productId} onChange={e=>{setProductId(e.target.value);setCounted('');}}>{!products.length&&<option value="">No hay productos</option>}{products.map(p=><option key={p.id} value={p.id}>{p.name}{p.variant?` · ${p.variant}`:''}{!p.active?' · Inactivo':''}</option>)}</select></label><label className="m2-field">Cantidad contada<input required inputMode="numeric" value={counted} onChange={e=>{setCounted(e.target.value);setConfirmed(false);}}/></label><p aria-live="polite">Stock anterior: {baseline?.stock??'Leyendo…'} · Contado: {counted||'—'} · Diferencia: {difference===null?'—':difference>0?`+${difference}`:difference}</p></>:<label className="m2-field">Importe $<input required inputMode="numeric" value={amount} onChange={e=>{setAmount(e.target.value);setConfirmed(false);}}/></label>}
 <label className="m2-field">{kind==='count'?'Motivo':'Concepto / procedencia'}<input required maxLength={120} value={concept} onChange={e=>{setConcept(e.target.value);setConfirmed(false);}} placeholder={kind==='expense'?'Ej. bolsas':kind==='contribution'?'Ej. aporte del dueño':'Ej. conteo de estante / rotura'}/></label>
 <label className="m2-field">Nota (opcional)<textarea maxLength={120} value={note} onChange={e=>setNote(e.target.value)}/></label>
 <p className="m2-note">La hora y jornada se guardan al confirmar la operación, aunque se reintente después.</p>
 <label className="m2-check-row"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> {kind==='count'?'Comprobé el conteo y autorizo este ajuste':'Comprobé el movimiento de efectivo'}</label>
 {error&&<p role="alert" className="m2-operation-error">{error}</p>}
 <MoraButton block type="submit" isBusy={busy} disabled={!confirmed||(kind==='count'&&!baseline)}>Guardar {kind==='expense'?'gasto':kind==='contribution'?'aporte':'conteo y ajuste'}</MoraButton>
 </fieldset></form></GlassPanel>;
}
export function MovementDetails({operation}:{operation:FormOperation}){
 if(operation.type==='RecordExpense'||operation.type==='RecordContribution')return <p>{operation.payload.concept} · {formatArs(operation.payload.amount)} · {operation.type==='RecordExpense'?'Salida de efectivo':'Aporte externo'}</p>;
 if(operation.type==='RecordStockCount')return <p>{operation.payload.reason} · Anterior {operation.payload.expectedStock} · Contado {operation.payload.counted} · Diferencia {operation.payload.counted-operation.payload.expectedStock} un.</p>;
 return null;
}
