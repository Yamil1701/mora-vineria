import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useSheetDrag } from "./useSheetDrag";

export function BottomSheet({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode }) {
  const { contentRef, dragHandleProps } = useSheetDrag(() => onOpenChange(false));
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="mora-sheet-overlay fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px]" />
      <Dialog.Content ref={contentRef} tabIndex={-1} onOpenAutoFocus={(event) => { event.preventDefault(); if (contentRef.current) { delete contentRef.current.dataset.dragClosing; contentRef.current.focus({ preventScroll: true }); } }} className="mora-sheet-content fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-[2rem] border border-b-0 border-white/15 bg-mora-fondo shadow-[0_-20px_60px_rgba(0,0,0,.45)] focus:outline-none">
        <div {...dragHandleProps} className="relative cursor-grab touch-none px-5 pb-2 pt-3 active:cursor-grabbing" aria-label="Arrastrar para cerrar">
          <span aria-hidden="true" className="absolute inset-x-0 -bottom-2 -top-2" />
          <div className="mx-auto h-1.5 w-12 rounded-full bg-white/25" />
        </div>
        <header className="border-b border-white/10 px-5 pb-4 pt-1">
          <div><Dialog.Title className="text-xl font-bold text-white">{title}</Dialog.Title>{description && <Dialog.Description className="mt-1 text-sm text-white/55">{description}</Dialog.Description>}</div>
        </header>
        <div className="scrollbar-hidden overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
