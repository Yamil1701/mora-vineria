import { useEffect, useId, useRef, type ReactNode } from 'react';
/** Native modal focus containment, Escape and focus restoration, without another UI kit. */
export function Dialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null), label = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    dialog.querySelector<HTMLInputElement>('input:not([type=checkbox])')?.focus();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={label} className="m2-dialog m2-glass m2-functional-dialog" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}><h2 id={label} className="sr-only">{title}</h2>{children}</dialog>;
}
