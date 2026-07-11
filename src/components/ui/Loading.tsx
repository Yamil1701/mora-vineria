import type { ReactNode } from "react";
import { useDelayedVisibility } from "../../hooks/useDelayedVisibility";

type SpinnerSize = "sm" | "md" | "lg";
const spinnerSizes: Record<SpinnerSize, string> = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-9 w-9" };

export function Spinner({ size = "md", label = "Cargando", className = "" }: { size?: SpinnerSize; label?: string; className?: string }) {
  return <span role="status" aria-label={label} className={`inline-flex shrink-0 ${className}`}><svg viewBox="0 0 24 24" className={`${spinnerSizes[size]} animate-mora-spinner`} aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth="3" /><path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" /></svg></span>;
}

export function DelayedFallback({ children, delay = 180 }: { children: ReactNode; delay?: number }) {
  return useDelayedVisibility(true, delay) ? <>{children}</> : null;
}

export function Skeleton({ className = "h-12" }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-mora-skeleton rounded-2xl bg-white/[0.07] ${className}`} />;
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return <div role="status" aria-label="Cargando contenido" className="space-y-3">{Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-20" />)}</div>;
}

export function PageSkeleton() {
  return <div role="status" aria-label="Cargando pantalla" className="mx-auto w-full max-w-md space-y-5 px-4 pt-5"><Skeleton className="h-7 w-36" /><Skeleton className="h-4 w-64 max-w-full" /><div className="grid grid-cols-2 gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div><ListSkeleton rows={3} /></div>;
}
