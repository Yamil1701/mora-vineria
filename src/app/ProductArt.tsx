import type { DemoProduct } from './demo-data';

type ArtProduct = Pick<DemoProduct,'id'|'category'|'name'>;
const tones: Record<string, { glass: string; fluid: string; cap: string; label: string }> = {
  corona: { glass: '#fbd387', fluid: '#d59c2d', cap: '#b8bac0', label: '#eee6d9' },
  stella: { glass: '#d4bc55', fluid: '#c69e28', cap: '#f2dedd', label: '#f1e4ce' },
  heineken: { glass: '#267e48', fluid: '#185a36', cap: '#c0d4c6', label: '#e3e6e0' },
  coca: { glass: '#612e33', fluid: '#3b151b', cap: '#ca262d', label: '#de3038' },
  fernet: { glass: '#34261d', fluid: '#21160f', cap: '#a52a28', label: '#eee0b1' },
  redbull: { glass: '#9eb5c8', fluid: '#a2b8cc', cap: '#c2cdd8', label: '#405ab9' },
  trapiche: { glass: '#3d3428', fluid: '#2c2329', cap: '#bfae82', label: '#e2d0aa' },
};

/** Product imagery is intentionally abstract in the demo: no unchecked external product photographs. */
export function ProductArt({ product, className = '' }: { product: ArtProduct; className?: string }) {
  const t = tones[product.id] ?? { glass: '#44313a', fluid: '#291c2d', cap: '#b4a3a8', label: '#e5d9db' };
  const can = product.category === 'Energizantes';
  const bottle = product.category === 'Vinos' || product.category === 'Aperitivos';
  const view = can ? <>
    <rect x="18" y="5" width="24" height="61" rx="5" fill={t.glass}/><ellipse cx="30" cy="5" rx="12" ry="3.5" fill={t.cap}/>
    <rect x="18" y="21" width="24" height="28" rx="2" fill={t.label}/><path d="M26 20 36 36 25 51" stroke="#e6eaf3" opacity=".65" strokeWidth="3" fill="none"/>
  </> : <>
    <rect x={bottle ? 26 : 25} y="2" width={bottle ? 8 : 10} height="13" rx="2" fill={t.cap}/>
    <path d={bottle ? 'M25 13h10v7c0 5 9 12 9 18v22c0 6-4 8-14 8S16 66 16 60V38c0-6 9-13 9-18Z' : 'M25 12h10v8c0 4 8 10 8 16v25c0 5-5 7-13 7s-13-2-13-7V36c0-6 8-12 8-16Z'} fill={t.glass}/>
    <path d="M20 42h20v17c0 4-3 6-10 6s-10-2-10-6Z" fill={t.fluid} opacity=".9"/>
    <rect x="18" y="38" width="24" height="21" rx="2.5" fill={t.label} opacity=".95"/>
    <path d="M23 43h14" stroke="#47404b" strokeWidth="1.5" opacity=".45"/>
    <path d="M24 48h12M26 52h8" stroke="#453b42" strokeWidth="1" opacity=".35"/>
    <path d="M22 29q-4 8-4 19" stroke="white" strokeWidth="1.8" opacity=".25" fill="none"/>
  </>;
  return <div className={`m2-art ${className}`} aria-hidden="true"><svg viewBox="0 0 60 74" focusable="false" className="m2-art__svg" role="presentation"><ellipse cx="30" cy="70" rx="20" ry="2.5" fill="black" opacity=".28"/>{view}</svg></div>;
}
