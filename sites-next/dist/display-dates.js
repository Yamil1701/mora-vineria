const monthFormat=new Intl.DateTimeFormat('es-AR',{timeZone:'UTC',month:'long',year:'numeric'});
const dayFormat=new Intl.DateTimeFormat('es-AR',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'});
const upper=s=>s.charAt(0).toUpperCase()+s.slice(1);
export const monthLabel=month=>upper(monthFormat.format(new Date(month+'-01T12:00:00Z')));
export const dateLabel=day=>dayFormat.format(new Date(day+'T12:00:00Z'));
export function rangeLabel(from,to){
  if(from===to)return dateLabel(from);
  if(from.slice(0,7)===to.slice(0,7))return 'Del '+Number(from.slice(8))+' al '+dateLabel(to);
  return 'Del '+dateLabel(from)+' al '+dateLabel(to);
}
