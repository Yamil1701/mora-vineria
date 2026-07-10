import { ToastProvider } from "./components/ui";
import { useInicializarBaseLocal } from "./hooks/useInicializarBaseLocal";
import { AppRouter } from "./routes/AppRouter";

export default function App() {
  const estadoBaseLocal = useInicializarBaseLocal();

  if (estadoBaseLocal === "cargando") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mora-fondo px-6 text-center text-white">
        <div>
          <p className="text-sm text-mora-suave">Mora Vinería</p>
          <h1 className="mt-2 text-2xl font-bold">Preparando tus datos</h1>
          <p className="mt-2 text-sm text-white/65">
            Tus datos se guardan en este dispositivo.
          </p>
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
        </div>
      </main>
    );
  }

  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}