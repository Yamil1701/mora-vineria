import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "./Button";

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

export function TaskHeader({
  title,
  description,
  backLabel = "Volver",
  onBack,
}: {
  title: string;
  description?: ReactNode;
  backLabel?: string;
  onBack?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <header data-task-header className="space-y-4">
      <Button
        variant="ghost"
        className="-ml-3 min-h-12 px-3"
        onClick={onBack ?? (() => navigate(-1))}
        aria-label={`${backLabel}: salir de ${title}`}
      >
        <span aria-hidden="true">←</span> {backLabel}
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-white/65">{description}</p>}
      </div>
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
