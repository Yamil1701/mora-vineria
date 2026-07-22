import * as Dialog from "@radix-ui/react-dialog";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UnsavedChangesContext } from "../../hooks/useUnsavedChanges";
import { useSheetDrag } from "./useSheetDrag";
import { useConfirm } from "./useConfirm";

export function RouteSheet({ label, children }: { label: string; children: ReactNode }) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [open, setOpen] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const closing = useRef(false);
  const navigated = useRef(false);
  const confirmationPending = useRef<Promise<boolean> | null>(null);
  const permitNavigation = useRef<(() => void) | null>(null);
  const registerPermitNavigation = useCallback((permit: (() => void) | null) => {
    permitNavigation.current = permit;
  }, []);
  const unsavedChangesBridge = useMemo(() => ({
    setDirty: setHasUnsavedChanges,
    registerPermitNavigation,
  }), [registerPermitNavigation]);
  const confirmarSalida = async () => {
    if (!hasUnsavedChanges) return true;
    if (confirmationPending.current) return confirmationPending.current;
    const pending = confirm({ title: "Salir sin guardar", description: "Los cambios que hiciste en este formulario se perderán.", confirmLabel: "Salir igualmente", tone: "danger" });
    confirmationPending.current = pending;
    try {
      return await pending;
    } finally {
      if (confirmationPending.current === pending) confirmationPending.current = null;
    }
  };
  const closeNow = () => {
    if (navigated.current) return;
    navigated.current = true;
    permitNavigation.current?.();
    navigate(-1);
  };
  const closeDragged = async () => {
    if (closing.current || navigated.current) return false;
    if (!await confirmarSalida()) return false;
    if (closing.current || navigated.current) return false;
    setHasUnsavedChanges(false);
    closeNow();
    return true;
  };
  const closeWithAnimation = async () => {
    if (closing.current) return;
    if (!await confirmarSalida()) return;
    if (closing.current || navigated.current) return;
    closing.current = true;
    setHasUnsavedChanges(false);
    setOpen(false);
    window.setTimeout(closeNow, 400);
  };
  const { contentRef, dragHandleProps } = useSheetDrag(closeDragged);
  return <UnsavedChangesContext.Provider value={unsavedChangesBridge}><Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) void closeWithAnimation(); }}><Dialog.Portal>
    <Dialog.Overlay onAnimationEnd={(event) => { if (!open && event.target === event.currentTarget) closeNow(); }} className="mora-sheet-overlay fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px]" />
    <Dialog.Content ref={contentRef} tabIndex={-1} onOpenAutoFocus={(event) => { event.preventDefault(); if (contentRef.current) { delete contentRef.current.dataset.dragClosing; contentRef.current.focus({ preventScroll: true }); } }} className="mora-sheet-content route-sheet scrollbar-hidden fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-b-0 border-white/15 bg-mora-fondo px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-20px_60px_rgba(0,0,0,.5)] focus:outline-none">
      <div {...dragHandleProps} className="relative cursor-grab touch-none pb-2 pt-3 active:cursor-grabbing" aria-label="Arrastrar para cerrar"><span aria-hidden="true" className="absolute inset-x-0 -bottom-2 -top-2" /><div className="mx-auto h-1.5 w-12 rounded-full bg-white/25" /></div>
      <Dialog.Title className="sr-only">{label}</Dialog.Title><Dialog.Description className="sr-only">Vista contextual sobre el listado anterior.</Dialog.Description>{children}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root></UnsavedChangesContext.Provider>;
}
