import type { ReactNode } from "react";

import { Panel } from "./Card";
import { Button } from "./Button";

type NoticeTone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<NoticeTone, string> = {
  neutral: "border-white/10 bg-white/[0.045] text-white/65",
  success: "border-mora-exito/30 bg-mora-exito/10 text-green-100",
  warning: "border-mora-advertencia/30 bg-mora-advertencia/10 text-yellow-100",
  danger: "border-mora-error/40 bg-mora-error/10 text-red-100",
};

export function Notice({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: NoticeTone;
}) {
  return <div role={tone === "danger" ? "alert" : "status"} className={`rounded-3xl border p-4 text-sm leading-6 ${toneClasses[tone]}`}>{children}</div>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Panel className="bg-black/10 text-center">
      <p className="text-sm font-semibold text-white">{title}</p>
      {description && <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </Panel>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <Notice tone="danger"><div className="flex items-center justify-between gap-3"><span>{message}</span>{onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>Reintentar</Button>}</div></Notice>;
}
