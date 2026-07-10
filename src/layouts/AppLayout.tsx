import { type ReactNode, useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { ActualizacionPwa } from "../components/ActualizacionPwa";
import { EstadoConexionBanner } from "../components/EstadoConexionBanner";
import { useConfiguracionLocal } from "../hooks/useConfiguracionLocal";

function Icono({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      {children}
    </svg>
  );
}

const navItems = [
  {
    to: "/",
    label: "Inicio",
    icono: (
      <Icono>
        <path d="M4 10.6 12 4l8 6.6V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.4Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </Icono>
    ),
  },
  {
    to: "/ventas",
    label: "Ventas",
    icono: (
      <Icono>
        <path d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </Icono>
    ),
  },
  {
    to: "/productos",
    label: "Productos",
    icono: (
      <Icono>
        <path d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M4 8.5V16l8 4 8-4V8.5M12 13v7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </Icono>
    ),
  },
  {
    to: "/mas",
    label: "Más",
    icono: (
      <Icono>
        <circle cx="5" cy="12" r="1.4" fill="currentColor" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
        <circle cx="19" cy="12" r="1.4" fill="currentColor" />
      </Icono>
    ),
  },
] as const;

const prefijosMas = ["/mas", "/movimientos", "/reportes", "/proyecciones", "/configuracion"];

function esRutaEnfocada(pathname: string): boolean {
  return (
    pathname === "/ventas/nueva" ||
    /^\/ventas\/[^/]+$/.test(pathname) ||
    pathname === "/productos/nuevo" ||
    pathname === "/productos/categorias" ||
    /^\/productos\/[^/]+(?:\/editar)?$/.test(pathname) ||
    pathname === "/movimientos/nuevo" ||
    /^\/movimientos\/[^/]+$/.test(pathname) ||
    /^\/configuracion\/.+/.test(pathname) ||
    pathname === "/reportes/pdf-mensual"
  );
}

function itemActivo(to: string, pathname: string): boolean {
  if (to === "/") return pathname === "/";
  if (to === "/mas") return prefijosMas.some((prefijo) => pathname.startsWith(prefijo));
  return pathname.startsWith(to);
}

export function AppLayout() {
  const { pathname } = useLocation();
  const { configuracion } = useConfiguracionLocal();
  const enfocada = esRutaEnfocada(pathname);
  const mostrarNuevaVenta = !enfocada && configuracion?.deviceRole !== "consulta";
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-mora-fondo bg-[radial-gradient(circle_at_top,_rgba(215,38,143,0.09),_transparent_34rem)] text-white">
      <a href="#contenido-principal" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2 focus:text-mora-fondo">
        Ir al contenido
      </a>
      <EstadoConexionBanner />
      <ActualizacionPwa />

      <main
        ref={mainRef}
        id="contenido-principal"
        tabIndex={-1}
        className={`mx-auto min-h-screen w-full max-w-md px-4 pt-5 print:max-w-none print:px-0 print:pb-0 print:pt-0 ${
          enfocada ? "pb-[calc(env(safe-area-inset-bottom)+2rem)]" : "pb-[calc(env(safe-area-inset-bottom)+10.5rem)]"
        }`}
      >
        <Outlet />
      </main>

      {!enfocada && (
        <>
          {mostrarNuevaVenta && (
            <div className="pdf-no-print fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-20 px-4">
              <div className="mx-auto flex max-w-md justify-end">
                <Link
                  to="/ventas/nueva"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-mora-principal px-5 py-3 font-semibold text-white shadow-[0_12px_32px_rgba(215,38,143,0.35)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.98]"
                >
                  <span aria-hidden="true" className="text-xl">＋</span>
                  Nueva venta
                </Link>
              </div>
            </div>
          )}

          <nav aria-label="Navegación principal" className="pdf-no-print fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-mora-fondo/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur">
            <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
              {navItems.map((item) => {
                const activo = itemActivo(item.to, pathname);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={activo ? "page" : undefined}
                    className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave ${
                      activo ? "bg-mora-principal text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.icono}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
