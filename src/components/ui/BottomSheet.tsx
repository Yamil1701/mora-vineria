import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function BottomSheet({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] data-[state=open]:animate-mora-fade" />
      <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-[2rem] border border-b-0 border-white/15 bg-mora-fondo shadow-[0_-20px_60px_rgba(0,0,0,.45)] focus:outline-none data-[state=open]:animate-mora-sheet">
        <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-white/20" />
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pb-4 pt-3">
          <div><Dialog.Title className="text-xl font-bold text-white">{title}</Dialog.Title>{description && <Dialog.Description className="mt-1 text-sm text-white/55">{description}</Dialog.Description>}</div>
          <Dialog.Close className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white/65 hover:bg-white/10" aria-label="Cerrar"><Icon name="cerrar" /></Dialog.Close>
        </header>
        <div className="overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
