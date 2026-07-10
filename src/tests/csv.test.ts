import { describe, expect, it } from "vitest";

import { crearCsv, crearNombreArchivoCsv, escaparCeldaCsv } from "../domain/csv";

describe("escaparCeldaCsv", () => {
  it("escapa comillas y encierra valores con punto y coma", () => {
    expect(escaparCeldaCsv('Vino "Reserva"; 750 ml')).toBe('"Vino ""Reserva""; 750 ml"');
  });

  it("deja vacías las celdas nulas", () => {
    expect(escaparCeldaCsv(null)).toBe("");
    expect(escaparCeldaCsv(undefined)).toBe("");
  });
});

describe("crearCsv", () => {
  it("genera encabezado y filas", () => {
    const csv = crearCsv(
      [
        { header: "nombre", value: (fila: { nombre: string; total: number }) => fila.nombre },
        { header: "total", value: (fila: { nombre: string; total: number }) => fila.total },
      ],
      [{ nombre: "Malbec", total: 8000 }],
    );

    expect(csv).toBe("nombre;total\r\nMalbec;8000");
  });
});

describe("crearNombreArchivoCsv", () => {
  it("crea un nombre estable por tipo y fecha", () => {
    expect(crearNombreArchivoCsv("ventas", new Date("2026-07-09T20:00:00.000Z"))).toBe(
      "mora-vineria-ventas-2026-07-09.csv",
    );
  });
});
