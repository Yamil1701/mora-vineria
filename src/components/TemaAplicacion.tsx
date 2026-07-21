import { useLayoutEffect } from "react";

import { usePreferenciasUi } from "../stores/preferenciasUi";

const colores = {
  oscuro: "#121014",
  claro: "#fff7fb",
} as const;

export function TemaAplicacion() {
  const tema = usePreferenciasUi((estado) => estado.tema);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = tema;
    document.documentElement.style.colorScheme = tema === "claro" ? "light" : "dark";
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute("content", colores[tema]);
  }, [tema]);

  return null;
}
