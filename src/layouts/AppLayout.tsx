import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Inicio" },
  { to: "/ventas", label: "Ventas" },
  { to: "/productos", label: "Productos" },
  { to: "/reportes", label: "Reportes" },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-mora-fondo text-white">
      <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-24 pt-5">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-mora-fondo/95 px-3 py-2 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "rounded-2xl px-2 py-2 text-center text-xs font-medium transition",
                  isActive
                    ? "bg-mora-principal text-white"
                    : "text-white/65 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}