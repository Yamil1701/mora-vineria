import * as Toast from "@radix-ui/react-toast";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { unirClases } from "../../utils/clases";
import { ToastContext } from "./useToast";
import type { ToastInput, ToastTone } from "./toast.types";

type ToastItem = Required<ToastInput> & {
  id: string;
  tone: ToastTone;
};

const TOAST_LIMIT = 4;
const DEFAULT_DURATION = 4200;

const toneClasses: Record<ToastTone, string> = {
  success: "border-mora-exito/35 bg-mora-toastExito text-green-50",
  error: "border-mora-error/40 bg-mora-toastError text-red-50",
  warning: "border-mora-advertencia/40 bg-mora-toastAdvertencia text-yellow-50",
  info: "border-mora-info/35 bg-mora-toastInfo text-sky-50",
};

const toneLabels: Record<ToastTone, string> = {
  success: "Listo",
  error: "Revisar",
  warning: "Atención",
  info: "Info",
};

function crearIdToast() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizarToast(input: ToastInput | string, description?: string): ToastInput {
  if (typeof input === "string") {
    return { title: input, description };
  }

  return input;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const cerrarToast = useCallback((id: string) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((tone: ToastTone, input: ToastInput | string, description?: string) => {
    const toast = normalizarToast(input, description);

    setToasts((items) => [
      ...items.slice(-(TOAST_LIMIT - 1)),
      {
        id: crearIdToast(),
        tone,
        title: toast.title,
        description: toast.description ?? "",
        duration: toast.duration ?? DEFAULT_DURATION,
      },
    ]);
  }, []);

  const value = useMemo(
    () => ({
      show,
      success: (input: ToastInput | string, description?: string) => show("success", input, description),
      error: (input: ToastInput | string, description?: string) => show("error", input, description),
      warning: (input: ToastInput | string, description?: string) => show("warning", input, description),
      info: (input: ToastInput | string, description?: string) => show("info", input, description),
    }),
    [show],
  );

  return (
    <Toast.Provider swipeDirection="right">
      <ToastContext.Provider value={value}>{children}</ToastContext.Provider>

      {toasts.map((item) => (
        <Toast.Root
          key={item.id}
          className={unirClases(
            "mora-toast rounded-3xl border p-4 shadow-card backdrop-blur data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
            toneClasses[item.tone],
          )}
          duration={item.duration}
          onOpenChange={(open) => {
            if (!open) cerrarToast(item.id);
          }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">
              {toneLabels[item.tone]}
            </p>
            <Toast.Title className="mt-1 text-sm font-semibold leading-5">{item.title}</Toast.Title>
            {item.description && (
              <Toast.Description className="mt-1 text-sm leading-5 opacity-70">
                {item.description}
              </Toast.Description>
            )}
          </div>
        </Toast.Root>
      ))}

      <Toast.Viewport className="pdf-no-print fixed inset-x-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[100] mx-auto flex max-w-md flex-col gap-3 outline-none" />
    </Toast.Provider>
  );
}
