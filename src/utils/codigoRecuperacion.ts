export function descargarCodigoRecuperacion(codigo: string): void {
  const contenido = [
    "Mora Vinería — código de recuperación del dispositivo principal",
    "",
    codigo,
    "",
    "Guardalo en un lugar seguro. El código anterior deja de funcionar cada vez que se recupera el principal.",
  ].join("\n");
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/plain;charset=utf-8" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "mora-vineria-codigo-recuperacion.txt";
  enlace.click();
  URL.revokeObjectURL(url);
}
