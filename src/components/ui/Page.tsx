import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { unirClases } from "../../utils/clases";
import { Icon } from "./Icon";
import { Button } from "./Button";

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={unirClases("mora-page space-y-5 lg:space-y-6", className)}>{children}</section>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="space-y-3 lg:flex lg:items-end lg:justify-between lg:gap-6 lg:space-y-0">
      <div className="min-w-0 max-w-2xl space-y-2">
        {eyebrow && <p className="text-sm font-medium text-mora-suave">{eyebrow}</p>}
        <h1 className="text-[26px] font-bold tracking-tight text-white lg:text-[32px]">{title}</h1>
        {description && <p className="text-sm leading-6 text-white/65">{description}</p>}
      </div>
      {action && <div className="lg:min-w-0 lg:max-w-sm lg:shrink-0">{action}</div>}
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
    <header data-task-header className="space-y-4 lg:space-y-5">
      <Button
        variant="ghost"
        className="-ml-3 min-h-12 px-3"
        onClick={onBack ?? (() => navigate(-1))}
        aria-label={`${backLabel}: salir de ${title}`}
      >
        <Icon name="volver" /> {backLabel}
      </Button>
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-white lg:text-[32px]">{title}</h1>
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
      {description && <p className="mt-1 text-sm leading-6 text-white/65">{description}</p>}
    </div>
  );
}
