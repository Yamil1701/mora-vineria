export type CsvCell = string | number | boolean | null | undefined;

export interface CsvColumn<Row> {
  header: string;
  value: (row: Row) => CsvCell;
}

const CSV_DELIMITER = ";";
const CSV_LINE_BREAK = "\r\n";

function normalizarCelda(valor: CsvCell): string {
  if (valor === null || valor === undefined) return "";

  return String(valor);
}

export function escaparCeldaCsv(valor: CsvCell): string {
  const texto = normalizarCelda(valor);
  const requiereComillas = /["\n\r;]/.test(texto);
  const textoEscapado = texto.replaceAll('"', '""');

  return requiereComillas ? `"${textoEscapado}"` : textoEscapado;
}

export function crearCsv<Row>(columnas: Array<CsvColumn<Row>>, filas: Row[]): string {
  const encabezado = columnas.map((columna) => escaparCeldaCsv(columna.header)).join(CSV_DELIMITER);
  const cuerpo = filas.map((fila) =>
    columnas.map((columna) => escaparCeldaCsv(columna.value(fila))).join(CSV_DELIMITER),
  );

  return [encabezado, ...cuerpo].join(CSV_LINE_BREAK);
}

export function crearNombreArchivoCsv(tipo: string, fecha: Date = new Date()): string {
  const fechaArchivo = fecha.toISOString().slice(0, 10);

  return `mora-vineria-${tipo}-${fechaArchivo}.csv`;
}
