import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export function RouteSheet({ label, children }: { label: string; children: ReactNode }) {
  const navigate = useNavigate();
  return <Dialog.Root open onOpenChange={(open) => { if (!open) navigate(-1); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] data-[state=open]:animate-mora-fade" /><Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-b-0 border-white/15 bg-mora-fondo px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-[0_-20px_60px_rgba(0,0,0,.5)] focus:outline-none data-[state=open]:animate-mora-sheet"><Dialog.Title className="sr-only">{label}</Dialog.Title><Dialog.Description className="sr-only">Vista contextual sobre el listado anterior.</Dialog.Description><div className="mx-auto mb-2 h-1 w-12 rounded-full bg-white/20" />{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
