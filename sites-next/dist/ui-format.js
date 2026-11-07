// Presentation only: never round or rewrite business values here.
const numbers=new Intl.NumberFormat('es-AR',{maximumFractionDigits:2});
const zone='America/Argentina/Salta';
const calendar=new Intl.DateTimeFormat('es-AR',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'});
const dates=new Intl.DateTimeFormat('es-AR',{timeZone:zone,day:'numeric',month:'long',year:'numeric'});
const times=new Intl.DateTimeFormat('es-AR',{timeZone:zone,hour:'2-digit',minute:'2-digit',hour12:false});
export const money=n=>(Number(n)<0?'−':'')+'$'+numbers.format(Math.abs(Number(n)));
export const signedMoney=n=>(Number(n)>0?'+':'')+money(n);
export const dateText=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)?calendar.format(new Date(value+'T12:00:00Z')):dates.format(new Date(value));
export const timeText=value=>times.format(new Date(value));
export function timestampText(value,day){
  const actual=dateText(value),journey=day?dateText(day):actual;
  return actual+' · '+timeText(value)+(journey===actual?'':' · Jornada '+journey);
}
