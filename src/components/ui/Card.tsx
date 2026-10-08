import type { HTMLAttributes, ReactNode } from "react";

import { unirClases } from "../../utils/clases";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={unirClases("mora-panel rounded-2xl border border-white/10 bg-mora-superficie p-4", className)}
      {...props}
    />
  );
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={unirClases("mora-panel rounded-2xl border border-white/10 bg-mora-superficie p-4", className)}
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
  return <p className={unirClases("text-sm font-medium text-white/65", className)} {...props} />;
}

export function CardValue({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={unirClases("mora-value mt-2 text-2xl font-bold text-white", className)} {...props} />;
}

export function CardList({ children }: { children: ReactNode }) {
  return <div className="mt-3 space-y-2">{children}</div>;
}
