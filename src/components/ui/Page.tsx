import type { ReactNode } from "react";

export function Page({ children }: { children: ReactNode }) {
  return <section className="space-y-5">{children}</section>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="space-y-3">
      <div className="space-y-2">
        {eyebrow && <p className="text-sm font-medium text-mora-suave">{eyebrow}</p>}
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && <p className="text-sm leading-6 text-white/65">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-white/55">{description}</p>}
    </div>
  );
}
