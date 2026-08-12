import { unirClases } from "../../utils/clases";

type StatusDotTone = "neutral" | "exito" | "advertencia" | "error" | "info";

const toneClasses: Record<StatusDotTone, string> = {
  neutral: "border border-white/30 bg-transparent",
  exito: "bg-mora-exito",
  advertencia: "bg-mora-advertencia",
  error: "bg-mora-error",
  info: "bg-mora-info",
};

export function StatusDot({
  tone = "neutral",
  pulse = false,
  className,
}: {
  tone?: StatusDotTone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={unirClases("mora-sync-dot h-2.5 w-2.5 shrink-0 rounded-full", toneClasses[tone], pulse && "animate-pulse", className)}
    />
  );
}
