import { BrandMark } from "./Brand";
import { Spinner } from "./ui";

export function BootSplash({
  phase,
  exiting = false,
}: {
  phase: "brand" | "loading";
  exiting?: boolean;
}) {
  return (
    <main
      className={`mora-boot-splash relative flex min-h-screen items-center justify-center overflow-hidden bg-mora-fondo px-6 text-center text-white ${exiting ? "mora-boot-splash-exit" : ""}`}
    >
      <span aria-hidden="true" className="mora-boot-ambient mora-boot-ambient-one" />
      <span aria-hidden="true" className="mora-boot-ambient mora-boot-ambient-two" />

      {phase === "brand" ? (
        <div className="mora-brand-start relative">
          <span aria-hidden="true" className="mora-brand-start-glow" />
          <BrandMark
            appIcon
            animated
            title="Mora Vinería"
            className="mora-brand-start-mark relative mx-auto h-32 w-32 rounded-[1.75rem]"
          />
          <h1 className="mora-brand-start-name mt-5 text-xl font-bold">Mora Vinería</h1>
        </div>
      ) : (
        <div className="mora-loading-focus flex flex-col items-center gap-4" aria-live="polite">
          <span className="mora-loading-halo flex h-20 w-20 items-center justify-center rounded-full">
            <Spinner size="lg" label="Preparando tus datos" className="text-mora-suave" />
          </span>
          <p className="text-sm text-white/60">Preparando tus datos</p>
        </div>
      )}
    </main>
  );
}
