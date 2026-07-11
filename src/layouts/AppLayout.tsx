import { useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ActualizacionPwa } from "../components/ActualizacionPwa";
import { EstadoConexionBanner } from "../components/EstadoConexionBanner";
import { Icon, type IconName } from "../components/ui/Icon";
import { useConfiguracionLocal } from "../hooks/useConfiguracionLocal";

const navItems: Array<{ to: string; label: string; icon: IconName }> = [
  { to: "/", label: "Inicio", icon: "home" },
  { to: "/ventas", label: "Ventas", icon: "ventas" },
  { to: "/productos", label: "Productos", icon: "productos" },
  { to: "/mas", label: "Más", icon: "mas" },
];
const prefijosMas = ["/mas", "/movimientos", "/reportes", "/proyecciones", "/configuracion"];

function esRutaEnfocada(pathname: string) {
  return pathname === "/ventas/nueva" || /^\/ventas\/[^/]+$/.test(pathname) || pathname === "/productos/nuevo" || pathname === "/productos/categorias" || /^\/productos\/[^/]+(?:\/editar)?$/.test(pathname) || pathname === "/movimientos/nuevo" || /^\/movimientos\/[^/]+$/.test(pathname) || /^\/configuracion\/.+/.test(pathname) || pathname === "/reportes/pdf-mensual";
}
function itemActivo(to: string, pathname: string) {
  if (to === "/") return pathname === "/";
  if (to === "/mas") return prefijosMas.some((prefijo) => pathname.startsWith(prefijo));
  return pathname.startsWith(to);
}

export function AppLayout() {
  const { pathname } = useLocation();
  const { configuracion } = useConfiguracionLocal();
  const enfocada = esRutaEnfocada(pathname);
  const puedeVender = configuracion?.deviceRole !== "consulta";
  const mainRef = useRef<HTMLElement | null>(null);
  useEffect(() => { mainRef.current?.focus({ preventScroll: true }); }, [pathname]);

  return <div className="min-h-screen bg-mora-fondo bg-[radial-gradient(circle_at_top,_rgba(215,38,143,0.09),_transparent_34rem)] text-white">
    <a href="#contenido-principal" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2 focus:text-mora-fondo">Ir al contenido</a>
    <EstadoConexionBanner /><ActualizacionPwa />
    <main ref={mainRef} id="contenido-principal" tabIndex={-1} className={`mx-auto min-h-screen w-full max-w-md px-4 pt-5 outline-none print:max-w-none print:px-0 print:pb-0 print:pt-0 ${enfocada ? "pb-[calc(env(safe-area-inset-bottom)+2rem)]" : "pb-[calc(env(safe-area-inset-bottom)+7rem)]"}`}><div key={pathname} className="animate-mora-route-enter"><Outlet /></div></main>
    {!enfocada && <nav aria-label="Navegación principal" className="pdf-no-print fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
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
