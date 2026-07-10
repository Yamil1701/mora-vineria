import type { ReactNode } from "react";

export type ConfirmTone = "default" | "danger";

export type ConfirmInput = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

export type ConfirmContextValue = (input: ConfirmInput) => Promise<boolean>;
