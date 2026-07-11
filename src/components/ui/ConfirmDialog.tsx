import * as AlertDialog from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";

import { unirClases } from "../../utils/clases";
import { Button } from "./Button";
import type { ConfirmTone } from "./confirm.types";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  disabled?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "default",
  disabled = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="mora-dialog-overlay pdf-no-print fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <AlertDialog.Content className="mora-dialog-content pdf-no-print fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-[2rem] border border-white/10 bg-mora-fondo p-5 text-white shadow-card outline-none">
          <AlertDialog.Title className="text-lg font-bold leading-6">{title}</AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-white/65">
              {description}
            </AlertDialog.Description>
          )}

          {children && <div className="mt-4">{children}</div>}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" fullWidth disabled={disabled}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant={tone === "danger" ? "danger" : "primary"}
                fullWidth
                disabled={disabled}
                onClick={onConfirm}
                className={unirClases(tone === "danger" && "bg-mora-error/20")}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function ConfirmDangerDialog(props: Omit<ConfirmDialogProps, "tone">) {
  return <ConfirmDialog {...props} tone="danger" />;
}
