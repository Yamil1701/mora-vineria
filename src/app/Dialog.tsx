import { useEffect, useId, useRef, type ReactNode } from 'react';
/** Native focus containment; browser Back closes the overlay before leaving its screen. */
export function Dialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null), label = useId();
  const markerRef=useRef(crypto.randomUUID());
  const latest=useRef({busy,onClose});latest.current={busy,onClose};
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    const marker=markerRef.current;
    if(history.state?.moraModal!==marker)history.pushState({...history.state,moraModal:marker},'',location.href);
    const pop=()=>{if(history.state?.moraModal===marker)return;if(latest.current.busy)history.pushState({...history.state,moraModal:marker},'',location.href);else latest.current.onClose();};
    window.addEventListener('popstate',pop);
    dialog.showModal();
    dialog.querySelector<HTMLInputElement>('input:not([type=checkbox]),select,textarea')?.focus();
    return () => {window.removeEventListener('popstate',pop);queueMicrotask(()=>{if(!dialog.isConnected&&history.state?.moraModal===marker)history.back();});dialog.close();previous?.focus({preventScroll:true});};
  }, []);
  return <dialog ref={ref} aria-labelledby={label} className="m2-dialog m2-glass m2-functional-dialog" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}><h2 id={label} className="sr-only">{title}</h2>{children}</dialog>;
}
