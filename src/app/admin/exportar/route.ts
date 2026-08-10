import { haySesionAbierta } from "@/lib/auth";
import { filtroBusqueda, listarCheckInsCompleto } from "@/lib/consultas";
import {
  contarNoches,
  formatearFecha,
  formatearFechaHora,
  hoyEnLaPosada,
} from "@/lib/fechas";

const COLUMNAS = [
  "Registrado",
  "Nombre",
  "Apellido",
  "Cédula o DNI",
  "Pasaporte",
  "Email",
  "Teléfono",
  "País",
  "Ciudad",
  "Llegada",
  "Salida",
  "Noches",
  "Huéspedes",
] as const;

/** Los datos son opcionales: lo que falta va como celda vacía, no como texto. */
function oVacio(valor: string | number | null): string | number {
  return valor ?? "";
}

const ARRANQUE_DE_FORMULA = /^[=@\t\r]/;
const ARRANQUE_CON_SIGNO = /^[+-]/;
/** `+598 99 123 456` y similares: sólo dígitos y separadores. */
const PARECE_TELEFONO = /^[+\d][\d\s()+-]*$/;

/**
 * Escapa una celda para CSV. El prefijo con comilla simple evita que Excel
 * interprete el contenido como fórmula, pero se lo salteamos a los teléfonos:
 * empiezan con `+` y sin la excepción quedarían con una comilla a la vista.
 */
function celda(valor: string | number): string {
  const texto = String(valor);
  const riesgoso =
    ARRANQUE_DE_FORMULA.test(texto) ||
    (ARRANQUE_CON_SIGNO.test(texto) && !PARECE_TELEFONO.test(texto));
  const seguro = riesgoso ? `'${texto}` : texto;
  return `"${seguro.replace(/"/g, '""')}"`;
}

export async function GET(request: Request): Promise<Response> {
  if (!(await haySesionAbierta())) {
    return new Response("No autorizado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const busqueda = (searchParams.get("q") ?? "").slice(0, 80);
  const registros = await listarCheckInsCompleto(filtroBusqueda(busqueda));

  const filas = registros.map((registro) =>
    [
      formatearFechaHora(registro.creadoEl),
      oVacio(registro.nombre),
      oVacio(registro.apellido),
      oVacio(registro.documento),
      oVacio(registro.pasaporte),
      oVacio(registro.email),
      oVacio(registro.telefono),
      oVacio(registro.pais),
      oVacio(registro.ciudad),
      registro.fechaCheckIn ? formatearFecha(registro.fechaCheckIn) : "",
      registro.fechaCheckOut ? formatearFecha(registro.fechaCheckOut) : "",
      oVacio(contarNoches(registro.fechaCheckIn, registro.fechaCheckOut)),
      oVacio(registro.cantidadHuespedes),
    ]
      .map(celda)
      .join(";"),
  );

  // El separador `;` y el BOM son lo que hace que Excel en español abra el
  // archivo con las columnas y los acentos correctos de una.
  const csv = `﻿${[COLUMNAS.map(celda).join(";"), ...filas].join("\r\n")}\r\n`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="huespedes-${hoyEnLaPosada()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
