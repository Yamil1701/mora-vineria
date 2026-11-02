// Exact rational costs; only selling-price suggestions round to multiples of $500.
const gcd=(a,b)=>b?gcd(b,a%b):a;
export function costFraction(total,qty,units=qty){if(!Number.isSafeInteger(total)||total<0||!Number.isSafeInteger(qty)||qty<1||!Number.isSafeInteger(units)||units<0)throw Error('Costo o cantidad inválidos.');const n=BigInt(total)*BigInt(units),d=BigInt(qty),g=gcd(n,d);return {n:String(n/g),d:String(d/g)};}
export function addFractions(parts){let n=0n,d=1n;for(const p of parts){const pn=BigInt(p.n),pd=BigInt(p.d);if(pd<=0n||pn<0n)throw Error('Fracción inválida.');n=n*pd+pn*d;d*=pd;const g=gcd(n,d);n/=g;d/=g;}return {n:String(n),d:String(d)};}
export const fractionNumber=f=>Number(f.n)/Number(f.d);
export const lotTotal=l=>l.totalCost??l.qty*l.unitCost;
export const lineTotal=i=>i.lineCost??i.qty*i.unitCost;
export const publicPrice=(packCost,units)=>Math.ceil(packCost*3/(units*1000))*500;
export function scaleFraction(f,units,divisor=1){if(!Number.isSafeInteger(units)||units<0||!Number.isSafeInteger(divisor)||divisor<1)throw Error('Cantidad inválida.');const n=BigInt(f.n)*BigInt(units),d=BigInt(f.d)*BigInt(divisor);if(n<0n||d<=0n)throw Error('Fracción inválida.');const g=gcd(n,d);return {n:String(n/g),d:String(d/g)};}
export const allocationCost=(lot,qty)=>lot.costBasis?scaleFraction(lot.costBasis,qty):costFraction(lotTotal(lot),lot.qty,qty);
