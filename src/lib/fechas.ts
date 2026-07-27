export const ZONA_HORARIA = "America/Montevideo";

/** Fecha de hoy en la posada, en formato `YYYY-MM-DD`. */
export function hoyEnLaPosada(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** `2026-07-27` → `27/07/2026`. */
export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

/** `27/07/2026 13:04`, en el mismo formato que el resto de las fechas. */
export function formatearFechaHora(momento: Date): string {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: ZONA_HORARIA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(momento)
    .replace(",", "");
}

/** Noches entre dos fechas `YYYY-MM-DD`. */
export function contarNoches(desde: string, hasta: string): number {
  const unDia = 24 * 60 * 60 * 1000;
  const diferencia = Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`);
  return Math.max(0, Math.round(diferencia / unDia));
}
