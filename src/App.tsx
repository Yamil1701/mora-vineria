import { ConfirmProvider, ToastProvider } from "./components/ui";
import { useInicializarBaseLocal } from "./hooks/useInicializarBaseLocal";
import { useDelayedVisibility } from "./hooks/useDelayedVisibility";
import { AppRouter } from "./routes/AppRouter";

export default function App() {
  const estadoBaseLocal = useInicializarBaseLocal();
  const mostrarCarga = useDelayedVisibility(estadoBaseLocal === "cargando", 250);

  if (estadoBaseLocal === "cargando") {
    if (!mostrarCarga) return <div className="min-h-screen bg-mora-fondo" />;
    return (
      <main className="flex min-h-screen items-center justify-center bg-mora-fondo px-6 text-center text-white">
        <div className="animate-mora-loader-in">
          <p className="text-sm text-mora-suave">Mora Vinería</p>
          <h1 className="mt-2 text-2xl font-bold">Preparando tus datos</h1>
          <p className="mt-2 text-sm text-white/65">
            Tus datos se guardan en este dispositivo.
          </p>
          <div className="mx-auto mt-5 h-1 w-28 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-mora-loader-bar rounded-full bg-mora-principal" /></div>
        </div>
      </main>
    );
  }

  if (estadoBaseLocal === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mora-fondo px-6 text-center text-white">
        <div>
          <p className="text-sm text-mora-suave">Mora Vinería</p>
          <h1 className="mt-2 text-2xl font-bold">No se pudo preparar la app</h1>
          <p className="mt-2 text-sm text-white/65">
            Cerrá y volvé a abrir la app. Si el problema sigue, revisamos la configuración local.
          </p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-12 rounded-2xl bg-mora-principal px-5 text-sm font-semibold">Intentar nuevamente</button>
        </div>
      </main>
    );
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <AppRouter />
      </ConfirmProvider>
    </ToastProvider>
  );
}
