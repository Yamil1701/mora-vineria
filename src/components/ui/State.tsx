import type { ReactNode } from "react";

import { Panel } from "./Card";

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
  return <div className={`rounded-3xl border p-4 text-sm leading-6 ${toneClasses[tone]}`}>{children}</div>;
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Panel className="bg-black/10 text-center">
      <p className="text-sm font-semibold text-white">{title}</p>
      {description && <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>}
    </Panel>
  );
}
