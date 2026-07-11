import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: false };

  static getDerivedStateFromError(): State { return { error: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error inesperado en Mora Vinería", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="flex min-h-screen items-center justify-center bg-mora-fondo px-6 text-center text-white"><div className="max-w-sm animate-mora-enter"><p className="text-sm font-medium text-mora-suave">Mora Vinería</p><h1 className="mt-2 text-2xl font-bold">No pudimos mostrar esta pantalla</h1><p className="mt-3 text-sm leading-6 text-white/65">Tus datos siguen guardados en este dispositivo. Podés intentar cargar la aplicación nuevamente.</p><div className="mt-6 grid gap-3"><button type="button" onClick={() => window.location.reload()} className="min-h-14 rounded-3xl bg-mora-principal px-5 font-semibold">Intentar nuevamente</button><a href={import.meta.env.BASE_URL} className="flex min-h-12 items-center justify-center rounded-2xl border border-white/10 text-sm font-semibold text-white/75">Volver al inicio</a></div></div></main>;
  }
}
