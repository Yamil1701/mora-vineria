import type { ReactNode } from "react";
import { useDelayedVisibility } from "../../hooks/useDelayedVisibility";

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
