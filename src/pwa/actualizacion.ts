export type ResultadoBusquedaActualizacion =
  | "disponible"
  | "al_dia"
  | "no_disponible";

function esperarEstado(worker: ServiceWorker): Promise<void> {
  if (worker.state === "installed" || worker.state === "activated") return Promise.resolve();
  return new Promise((resolve) => {
    const limite = window.setTimeout(() => {
      worker.removeEventListener("statechange", alCambiar);
      resolve();
    }, 10_000);
    const alCambiar = () => {
      if (worker.state === "installed" || worker.state === "activated" || worker.state === "redundant") {
        window.clearTimeout(limite);
        worker.removeEventListener("statechange", alCambiar);
        resolve();
      }
    };
    worker.addEventListener("statechange", alCambiar);
  });
}

export async function buscarActualizacionPwa(): Promise<ResultadoBusquedaActualizacion> {
  if (!("serviceWorker" in navigator)) return "no_disponible";
  const registro = await navigator.serviceWorker.getRegistration();
  if (!registro) return "no_disponible";

  let detectada = Boolean(registro.installing || registro.waiting);
  const alEncontrar = () => { detectada = true; };
  registro.addEventListener("updatefound", alEncontrar);
  try {
    await registro.update();
    const worker = registro.installing ?? registro.waiting;
    if (worker) {
      detectada = true;
      await esperarEstado(worker);
    }
    return detectada || Boolean(registro.waiting) ? "disponible" : "al_dia";
  } finally {
    registro.removeEventListener("updatefound", alEncontrar);
  }
}

export async function aplicarActualizacionPwa(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const registro = await navigator.serviceWorker.getRegistration();
  if (!registro?.waiting) return false;
  registro.waiting.postMessage({ type: "SKIP_WAITING" });
  return true;
}
