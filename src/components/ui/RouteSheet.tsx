import * as Dialog from "@radix-ui/react-dialog";
import { type ReactNode, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSheetDrag } from "./useSheetDrag";

export function RouteSheet({ label, children }: { label: string; children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const closing = useRef(false);
  const closeNow = () => navigate(-1);
  const closeWithAnimation = () => {
    if (closing.current) return;
    closing.current = true;
    setOpen(false);
    window.setTimeout(closeNow, 180);
  };
  const { contentRef, dragHandleProps } = useSheetDrag(closeNow);
  return <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) closeWithAnimation(); }}><Dialog.Portal>
    <Dialog.Overlay className="mora-sheet-overlay fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px]" />
    <Dialog.Content ref={contentRef} tabIndex={-1} onOpenAutoFocus={(event) => { event.preventDefault(); if (contentRef.current) { delete contentRef.current.dataset.dragClosing; contentRef.current.focus({ preventScroll: true }); } }} className="mora-sheet-content route-sheet scrollbar-hidden fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-b-0 border-white/15 bg-mora-fondo px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-20px_60px_rgba(0,0,0,.5)] focus:outline-none">
      <div {...dragHandleProps} className="relative cursor-grab touch-none pb-2 pt-3 active:cursor-grabbing" aria-label="Arrastrar para cerrar"><span aria-hidden="true" className="absolute inset-x-0 -bottom-2 -top-2" /><div className="mx-auto h-1.5 w-12 rounded-full bg-white/25" /></div>
      <Dialog.Title className="sr-only">{label}</Dialog.Title><Dialog.Description className="sr-only">Vista contextual sobre el listado anterior.</Dialog.Description>{children}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
