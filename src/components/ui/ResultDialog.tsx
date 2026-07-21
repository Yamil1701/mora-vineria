import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import { Button } from "./Button";

export function ResultDialog({
  open,
  title,
  description,
  children,
  onAccept,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onAccept: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onAccept(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="mora-dialog-overlay fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="mora-dialog-content fixed inset-x-4 top-1/2 z-[70] mx-auto max-h-[calc(100dvh-2rem)] max-w-sm -translate-y-1/2 overflow-y-auto rounded-[2rem] border border-white/10 bg-mora-fondo p-5 shadow-2xl focus:outline-none">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mora-exito/15 text-2xl text-green-100" aria-hidden="true">✓</div>
          <Dialog.Title className="mt-4 text-center text-xl font-bold text-white">{title}</Dialog.Title>
          {description && <Dialog.Description className="mt-2 text-center text-sm leading-6 text-white/55">{description}</Dialog.Description>}
          <div className="mt-5">{children}</div>
          <Button fullWidth size="lg" className="mt-5" onClick={onAccept}>Aceptar</Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
