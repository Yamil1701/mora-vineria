import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

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
      className="mora-action-row relative flex min-h-20 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-4 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99]"
    >
      {icon && (
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.045] text-mora-suave">
          {icon}
          {attentionLabel && <span aria-hidden="true" className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-mora-fondo bg-mora-advertencia " />}
        </span>
      )}
      <span className="min-w-0 flex-1"><span className="text-sm font-semibold text-white">{title}</span><span className="mt-1 block text-sm leading-5 text-white/65">{description}</span></span>
      <Icon name="siguiente" className="h-4 w-4 shrink-0 text-white/65" />
      {attentionLabel && <span className="sr-only">{attentionLabel}</span>}
    </Link>
  );
}
