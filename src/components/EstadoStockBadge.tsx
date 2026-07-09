import { calcularEstadoStock } from "../domain/productos";

interface EstadoStockBadgeProps {
  stockActual: number;
  stockObjetivo: number;
}

export function EstadoStockBadge({ stockActual, stockObjetivo }: EstadoStockBadgeProps) {
  const estado = calcularEstadoStock(stockActual, stockObjetivo);

  const estilos = {
    sin_stock: "bg-mora-error/15 text-red-200 border-mora-error/30",
    critico: "bg-mora-error/15 text-red-200 border-mora-error/30",
    bajo: "bg-mora-advertencia/15 text-yellow-100 border-mora-advertencia/30",
    disponible: "bg-mora-exito/15 text-green-100 border-mora-exito/30",
  }[estado];

  const texto = {
    sin_stock: "Sin stock",
    critico: "Stock crítico",
    bajo: "Quedan pocas unidades",
    disponible: "Disponible",
  }[estado];

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${estilos}`}>
      {texto}
    </span>
  );
}