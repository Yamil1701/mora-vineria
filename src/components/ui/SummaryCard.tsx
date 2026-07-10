import { Card, CardDescription, CardKicker, CardValue } from "./Card";

export function SummaryCard({
  label,
  value,
  detail,
  compact = false,
}: {
  label: string;
  value: string;
  detail?: string;
  compact?: boolean;
}) {
  return (
    <Card className={compact ? "p-3" : undefined}>
      <CardKicker>{label}</CardKicker>
      <CardValue className={compact ? "text-xl" : undefined}>{value}</CardValue>
      {detail && <CardDescription className="text-xs leading-5">{detail}</CardDescription>}
    </Card>
  );
}
