import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export function ActionCard({
  to,
  title,
  description,
  icon,
  attentionLabel,
}: {
  to: string;
  title: string;
  description: string;
  icon?: ReactNode;
  attentionLabel?: string;
}) {
  return (
    <Link
      to={to}
      className="relative flex min-h-20 items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-card transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99]"
    >
      {icon && (
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mora-principal/10 text-mora-suave">
          {icon}
          {attentionLabel && <span aria-hidden="true" className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-mora-fondo bg-mora-advertencia shadow-[0_0_10px_rgba(245,176,65,.55)]" />}
        </span>
      )}
      <span className="min-w-0 flex-1"><span className="text-sm font-semibold text-white">{title}</span><span className="mt-1 block text-xs leading-5 text-white/50">{description}</span></span>
      <span aria-hidden="true" className="text-white/30">›</span>
      {attentionLabel && <span className="sr-only">{attentionLabel}</span>}
    </Link>
  );
}
