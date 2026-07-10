import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { ActualizacionPwa } from "../components/ActualizacionPwa";
import { EstadoConexionBanner } from "../components/EstadoConexionBanner";

function IconoInicio() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10.6 12 4l8 6.6V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconoVentas() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9 8h6M9 12h6M9 16h3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconoProductos() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M4 8.5V16l8 4 8-4V8.5M12 13v7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconoReportes() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 19V5M5 19h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M9 16v-5M13 16V8M17 16v-8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

type NavItem = {
  to: string;
  label: string;
  icono: ReactNode;
};

const navItems: NavItem[] = [
  { to: "/", label: "Inicio", icono: <IconoInicio /> },
  { to: "/ventas", label: "Ventas", icono: <IconoVentas /> },
  { to: "/productos", label: "Productos", icono: <IconoProductos /> },
  { to: "/reportes", label: "Reportes", icono: <IconoReportes /> },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-mora-fondo bg-[radial-gradient(circle_at_top,_rgba(215,38,143,0.09),_transparent_34rem)] text-white">
      <EstadoConexionBanner />
      <ActualizacionPwa />

      <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-[6.5rem] pt-5 print:max-w-none print:px-0 print:pb-0 print:pt-0">
        <Outlet />
      </main>

      <nav className="pdf-no-print fixed inset-x-0 bottom-0 border-t border-white/10 bg-mora-fondo/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] font-medium transition",
                  isActive
                    ? "bg-mora-principal text-white"
                    : "text-white/65 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              <span>{item.icono}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}