import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "./Icon";
import type { ReactNode } from "react";
import { useSheetDrag } from "./useSheetDrag";

export function BottomSheet({ open, onOpenChange, title, description, children, preventClose }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode; preventClose?: () => Promise<boolean> }) {
  const close = async () => { if (preventClose && !await preventClose()) return false; onOpenChange(false); return true; };
  const { contentRef, dragHandleProps } = useSheetDrag(close);
  return <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (nextOpen) onOpenChange(true); else void close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="mora-sheet-overlay fixed inset-0 z-40 bg-black/65 " />
      <Dialog.Content ref={contentRef} tabIndex={-1} onOpenAutoFocus={(event) => { event.preventDefault(); if (contentRef.current) { delete contentRef.current.dataset.dragClosing; contentRef.current.focus({ preventScroll: true }); } }} className="mora-sheet-content mora-desktop-panel bottom-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-[1.25rem] border border-b-0 border-white/15 bg-mora-fondo shadow-[0_-8px_32px_rgba(0,0,0,.25)] focus:outline-none">
        <div {...dragHandleProps} className="mora-sheet-drag-handle relative cursor-grab touch-none px-5 pb-2 pt-3 active:cursor-grabbing" aria-label="Arrastrar para cerrar">
          <span aria-hidden="true" className="absolute inset-x-0 -bottom-2 -top-2" />
          <div className="mx-auto h-1.5 w-12 rounded-full bg-white/25" />
        </div>
        <header className="border-b border-white/10 px-5 pb-4 pt-1 lg:px-6 lg:pb-5 lg:pt-6">
          <div className="pr-12"><Dialog.Title className="text-xl font-bold text-white">{title}</Dialog.Title><Dialog.Description className={description ? "mt-1 text-sm text-white/65" : "sr-only"}>{description ?? "Revisá los datos de esta tarea antes de continuar."}</Dialog.Description></div>
        <Dialog.Close aria-label="Cerrar panel" className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-xl text-white/65 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave lg:right-4 lg:top-4"><Icon name="cerrar" /></Dialog.Close></header>
        <div className="scrollbar-hidden overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 lg:px-6 lg:pb-6 lg:pt-5">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
