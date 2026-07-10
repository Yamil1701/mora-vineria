import { useCallback, useRef, useState, type ReactNode } from "react";

import type { ConfirmInput } from "./confirm.types";
import { ConfirmDialog } from "./ConfirmDialog";
import { ConfirmContext } from "./useConfirm";

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState<ConfirmInput | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setInput(null);
    resolver?.(confirmed);
  }, []);

  const confirm = useCallback((nextInput: ConfirmInput) => {
    resolverRef.current?.(false);
    setInput(nextInput);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <ConfirmDialog
        open={input !== null}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
        title={input?.title ?? "Confirmar acción"}
        description={input?.description}
        confirmLabel={input?.confirmLabel ?? "Confirmar"}
        cancelLabel={input?.cancelLabel}
        tone={input?.tone}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  );
}
