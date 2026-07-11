import { BrandMark } from "./Brand";
import { Spinner } from "./ui";

export function BootSplash({ exiting = false }: { exiting?: boolean }) {
  return (
    <main className={`mora-boot-splash flex min-h-screen items-center justify-center bg-mora-fondo px-6 text-center text-white ${exiting ? "mora-boot-splash-exit" : ""}`}>
      <div className="animate-mora-loader-in">
        <BrandMark appIcon animated title="Mora Vinería" className="mx-auto h-32 w-32 rounded-[1.75rem] shadow-[0_18px_55px_rgba(215,38,143,.24)]" />
        <h1 className="mt-5 text-xl font-bold">Mora Vinería</h1>
        <div className="mt-4 flex flex-col items-center gap-3">
          <Spinner size="md" label="Preparando tus datos" />
          <p className="text-sm text-white/60">Preparando tus datos</p>
        </div>
      </div>
    </main>
  );
}
