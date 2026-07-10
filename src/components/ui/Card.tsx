import type { HTMLAttributes, ReactNode } from "react";

import { unirClases } from "../../utils/clases";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={unirClases("rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-card", className)}
      {...props}
    />
  );
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={unirClases("rounded-3xl border border-white/10 bg-white/[0.045] p-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={unirClases("text-lg font-semibold text-white", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={unirClases("mt-1 text-sm leading-6 text-white/60", className)} {...props} />;
}

export function CardKicker({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={unirClases("text-xs font-medium uppercase tracking-wide text-white/45", className)} {...props} />;
}

export function CardValue({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={unirClases("mt-2 text-2xl font-bold text-white", className)} {...props} />;
}

export function CardList({ children }: { children: ReactNode }) {
  return <div className="mt-3 space-y-2">{children}</div>;
}
