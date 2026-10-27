import { Icon } from './icons';
/** Neutral placeholder: no photograph or guessed product/variant representation. */
export function ProductArt({ className = '' }: { product: { id: string; category: string; name: string }; className?: string }) {
 return <div className={`m2-art ${className}`} aria-hidden="true"><Icon name="box" size={28}/></div>;
}
