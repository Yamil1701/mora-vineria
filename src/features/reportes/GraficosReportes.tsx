import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Panel, SectionHeader } from "../../components/ui";
import { MEDIOS_DE_PAGO } from "../../constants";
import type { ResumenConRanking } from "../../domain/reportes";
import { formatearPesos } from "../../utils/dinero";

const colorTexto = "rgb(var(--mora-chart-text) / .62)";
const colorGrilla = "rgb(var(--mora-chart-grid) / .12)";
const colorCursor = "rgb(var(--mora-chart-cursor) / .06)";
const colorSuperficie = "rgb(var(--mora-superficie-elevada))";
const colorBorde = "rgb(var(--mora-chart-grid) / .16)";
const colores = ["#D7268F", "#28D970", "#3BA7FF", "#F5B82E", "#9B7BFF", "#F27D52"];

function acortarNombre(nombre: string): string {
  return nombre.length > 16 ? `${nombre.slice(0, 15)}…` : nombre;
}

export function GraficosReportes({
  resumen,
  tipo = "todos",
}: {
  resumen: ResumenConRanking;
  tipo?: "productos" | "medios" | "todos";
}) {
  const productos = resumen.productosMasVendidos.slice(0, 5).map((producto, index) => ({
    nombre: acortarNombre(producto.nombre),
    cantidad: producto.cantidad,
    color: colores[index % colores.length],
  }));
  const medios = resumen.mediosPagoMasUsados.map((medio, index) => ({
    nombre:
      MEDIOS_DE_PAGO.find((opcion) => opcion.value === medio.medioPago)?.label ?? "Otro",
    total: medio.totalVendido,
    color: colores[(index + 1) % colores.length],
  }));

  if ((tipo === "productos" && productos.length === 0) || (tipo === "medios" && medios.length === 0) || (tipo === "todos" && productos.length === 0 && medios.length === 0)) return null;

  return (
    <section className="space-y-3" aria-label="Gráficos del mes actual">
      {tipo !== "medios" && productos.length > 0 && (
        <Panel className="space-y-3">
          <SectionHeader
            title="Unidades más vendidas"
            description="Los cinco productos con mayor cantidad vendida en el mes."
          />
          <div className="h-56" role="img" aria-label="Gráfico de productos más vendidos">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productos} layout="vertical" margin={{ left: 4, right: 12 }}>
                <CartesianGrid stroke={colorGrilla} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: colorTexto, fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={92}
                  tick={{ fill: colorTexto, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: colorCursor }}
                  contentStyle={{
                    background: colorSuperficie,
                    border: `1px solid ${colorBorde}`,
                    borderRadius: 16,
                    color: colorTexto,
                  }}
                />
                <Bar dataKey="cantidad" name="Unidades" radius={[0, 8, 8, 0]}>{productos.map((item) => <Cell key={item.nombre} fill={item.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      {tipo !== "productos" && medios.length > 0 && (
        <Panel className="space-y-3">
          <SectionHeader
            title="Cobros por medio de pago"
            description="Dinero recibido por cada medio durante el período."
          />
          <div className="h-56" role="img" aria-label="Gráfico de ventas por medio de pago">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={medios} layout="vertical" margin={{ left: 4, right: 12 }}>
                <CartesianGrid stroke={colorGrilla} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: colorTexto, fontSize: 11 }}
                  tickFormatter={(valor) => `$${Number(valor).toLocaleString("es-AR")}`}
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={92}
                  tick={{ fill: colorTexto, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(valor) => formatearPesos(Number(valor))}
                  cursor={{ fill: colorCursor }}
                  contentStyle={{
                    background: colorSuperficie,
                    border: `1px solid ${colorBorde}`,
                    borderRadius: 16,
                    color: colorTexto,
                  }}
                />
                <Bar dataKey="total" name="Cobrado" radius={[0, 8, 8, 0]}>{medios.map((item) => <Cell key={item.nombre} fill={item.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}
    </section>
  );
}
