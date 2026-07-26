import { useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ActualizacionPwa } from "../components/ActualizacionPwa";
import { AvisoInicioSinConexion } from "../components/AvisoInicioSinConexion";
import { BrandMark } from "../components/Brand";
import { Icon, type IconName } from "../components/ui/Icon";
import { useConfiguracionLocal } from "../hooks/useConfiguracionLocal";
import { IndicadorSincronizacion } from "../components/IndicadorSincronizacion";

const navItems: Array<{ to: string; label: string; icon: IconName }> = [
  { to: "/", label: "Inicio", icon: "home" },
  { to: "/ventas", label: "Ventas", icon: "ventas" },
  { to: "/productos", label: "Productos", icon: "productos" },
  { to: "/mas", label: "Más", icon: "mas" },
];
const prefijosMas = ["/mas", "/movimientos", "/tesoreria", "/reportes", "/proyecciones", "/configuracion"];

function esRutaEnfocada(pathname: string) {
  return pathname === "/ventas/nueva" || /^\/ventas\/[^/]+$/.test(pathname) || pathname === "/productos/nuevo" || pathname === "/productos/categorias" || /^\/productos\/[^/]+(?:\/editar)?$/.test(pathname) || pathname === "/movimientos/nuevo" || /^\/movimientos\/[^/]+$/.test(pathname) || /^\/tesoreria\/.+/.test(pathname) || /^\/configuracion\/.+/.test(pathname) || pathname === "/reportes/pdf-mensual";
}
function itemActivo(to: string, pathname: string) {
  if (to === "/") return pathname === "/";
  if (to === "/mas") return prefijosMas.some((prefijo) => pathname.startsWith(prefijo));
  return pathname.startsWith(to);
}

function SidebarEscritorio({ pathname, puedeVender }: { pathname: string; puedeVender: boolean }) {
  return (
    <aside className="pdf-no-print fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/10 bg-mora-fondo/95 px-4 py-6 shadow-[20px_0_60px_rgba(0,0,0,.16)] backdrop-blur lg:flex">
      <Link to="/" className="flex items-center gap-3 rounded-2xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave">
        <BrandMark appIcon className="h-11 w-11 shrink-0 rounded-xl shadow-card" />
        <span>
          <span className="block text-sm font-bold text-white">Mora Vinería</span>
          <span className="mt-0.5 block text-xs text-white/45">Control diario</span>
        </span>
      </Link>

      {puedeVender && (
        <Link
          to="/ventas/nueva"
          className="mt-7 flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-mora-principal px-4 font-semibold text-white shadow-[0_14px_34px_rgba(215,38,143,.25)] transition hover:bg-mora-principalHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[.98]"
        >
          <Icon name="agregar" className="h-6 w-6" />
          Nueva venta
        </Link>
      )}

      <nav aria-label="Navegación principal" className="mt-6 flex flex-1 flex-col gap-1.5">
        {navItems.map((item) => {
          const activo = itemActivo(item.to, pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={activo ? "page" : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave ${activo ? "bg-mora-principal/15 text-mora-suave" : "text-white/60 hover:bg-white/8 hover:text-white"}`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AppLayout() {
  const { pathname } = useLocation();
  const { configuracion } = useConfiguracionLocal();
  const enfocada = esRutaEnfocada(pathname);
  const puedeVender = configuracion?.deviceRole !== "consulta";
  const mainRef = useRef<HTMLElement | null>(null);
  useEffect(() => { mainRef.current?.focus({ preventScroll: true }); }, [pathname]);

  return <div className="mora-app-shell min-h-screen bg-mora-fondo text-white">
    <a href="#contenido-principal" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2 focus:text-mora-fondo">Ir al contenido</a>
    <AvisoInicioSinConexion /><ActualizacionPwa />
    <IndicadorSincronizacion conSidebar={!enfocada} />
    {!enfocada && <SidebarEscritorio pathname={pathname} puedeVender={puedeVender} />}
    <div className={!enfocada ? "min-h-screen lg:pl-64" : "min-h-screen"}>
      <main ref={mainRef} id="contenido-principal" tabIndex={-1} className={`mx-auto min-h-screen w-full px-4 pt-5 outline-none print:max-w-none print:px-0 print:pb-0 print:pt-0 lg:px-8 lg:pt-8 ${enfocada ? "max-w-md pb-[calc(env(safe-area-inset-bottom)+2rem)] lg:max-w-2xl lg:pb-10" : "max-w-md pb-[calc(env(safe-area-inset-bottom)+7rem)] lg:max-w-4xl lg:pb-12"}`}><div key={pathname} className="animate-mora-route-enter"><Outlet /></div></main>
    </div>
    {!enfocada && <nav aria-label="Navegación principal" className="pdf-no-print fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] lg:hidden">
      <div className={`relative mx-auto grid max-w-md items-end rounded-[1.75rem] border border-white/10 bg-mora-fondo/95 p-1.5 shadow-[0_-10px_35px_rgba(0,0,0,.35)] backdrop-blur ${puedeVender ? "grid-cols-5" : "grid-cols-4"}`}>
        {navItems.map((item, index) => {
          const activo = itemActivo(item.to, pathname);
          return <div key={item.to} className={puedeVender && index === 2 ? "col-start-4" : undefined}><Link to={item.to} aria-current={activo ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave ${activo ? "bg-mora-principal/15 text-mora-suave" : "text-white/55 hover:bg-white/8 hover:text-white"}`}><Icon name={item.icon} /><span>{item.label}</span></Link></div>;
        })}
        {puedeVender && <Link to="/ventas/nueva" aria-label="Nueva venta" className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-5 items-center justify-center rounded-full border-[5px] border-mora-fondo bg-mora-principal text-white shadow-[0_10px_28px_rgba(215,38,143,.38)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-95"><Icon name="agregar" className="h-7 w-7" /><span className="sr-only">Nueva venta</span></Link>}
      </div>
    </nav>}
  </div>;
}
