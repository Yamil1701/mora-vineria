import type { HTMLAttributes } from "react";

import { unirClases } from "../../utils/clases";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-white/10 bg-white/[0.06] text-white/65",
  success: "border-mora-exito/30 bg-mora-exito/10 text-green-100",
  warning: "border-mora-advertencia/30 bg-mora-advertencia/10 text-yellow-100",
  danger: "border-mora-error/40 bg-mora-error/10 text-red-100",
  info: "border-mora-info/30 bg-mora-info/10 text-sky-100",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={unirClases(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
