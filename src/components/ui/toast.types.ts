export type ToastTone = "success" | "error" | "warning" | "info";

export type ToastInput = {
  title: string;
  description?: string;
  duration?: number;
};

export type ToastContextValue = {
  show: (tone: ToastTone, input: ToastInput | string, description?: string) => void;
  success: (input: ToastInput | string, description?: string) => void;
  error: (input: ToastInput | string, description?: string) => void;
  warning: (input: ToastInput | string, description?: string) => void;
  info: (input: ToastInput | string, description?: string) => void;
};
