import { Card, CardDescription, CardKicker, CardValue } from "./Card";
import type { ReactNode } from "react";

export function SummaryCard({
  label,
  value,
  detail,
  compact = false,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  compact?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Card className={compact ? "p-3" : undefined}>
      <div className="flex items-center justify-between gap-2"><CardKicker>{label}</CardKicker>{icon && <span className="text-mora-suave/75">{icon}</span>}</div>
      <CardValue className={compact ? "text-xl" : undefined}>{value}</CardValue>
      {detail && <CardDescription className="text-xs leading-5">{detail}</CardDescription>}
    </Card>
  );
}
