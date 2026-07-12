import { ConfirmProvider, ToastProvider } from "./components/ui";
import { BootSplash } from "./components/BootSplash";
import { BrandMark } from "./components/Brand";
import { useInicializarBaseLocal } from "./hooks/useInicializarBaseLocal";
import { AppRouter } from "./routes/AppRouter";
import { SincronizacionAutomatica } from "./components/SincronizacionAutomatica";

export default function App() {
  const estadoBaseLocal = useInicializarBaseLocal();

  if (estadoBaseLocal === "marca" || estadoBaseLocal === "marca_saliendo") {
    return <BootSplash phase="brand" exiting={estadoBaseLocal === "marca_saliendo"} />;
  }

  if (estadoBaseLocal === "cargando" || estadoBaseLocal === "cargando_saliendo") {
    return <BootSplash phase="loading" exiting={estadoBaseLocal === "cargando_saliendo"} />;
  }

  if (estadoBaseLocal === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mora-fondo px-6 text-center text-white">
        <div>
          <BrandMark appIcon className="mx-auto h-20 w-20 rounded-2xl" />
          <p className="mt-4 text-sm text-mora-suave">Mora Vinería</p>
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
        <SincronizacionAutomatica />
        <AppRouter />
      </ConfirmProvider>
    </ToastProvider>
  );
}
