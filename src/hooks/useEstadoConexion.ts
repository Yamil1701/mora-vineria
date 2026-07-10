import { useEffect, useState } from "react";

export function useEstadoConexion(): boolean {
  const [enLinea, setEnLinea] = useState(() => {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  });

  useEffect(() => {
    function marcarEnLinea() {
      setEnLinea(true);
    }

    function marcarSinConexion() {
      setEnLinea(false);
    }

    window.addEventListener("online", marcarEnLinea);
    window.addEventListener("offline", marcarSinConexion);

    return () => {
      window.removeEventListener("online", marcarEnLinea);
      window.removeEventListener("offline", marcarSinConexion);
    };
  }, []);

  return enLinea;
}
