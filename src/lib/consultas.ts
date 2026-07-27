import { count, desc, ilike, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { checkIns, type CheckIn } from "@/db/schema";

export const POR_PAGINA = 50;

/** ILIKE interpreta `%` y `_` como comodines: los escapamos para buscarlos literales. */
function patron(busqueda: string): string {
  return `%${busqueda.replace(/[\\%_]/g, (caracter) => `\\${caracter}`)}%`;
}

export function filtroBusqueda(busqueda: string): SQL | undefined {
  const limpia = busqueda.trim();
  if (!limpia) return undefined;

  const valor = patron(limpia);
  return or(
    ilike(checkIns.nombre, valor),
    ilike(checkIns.apellido, valor),
    ilike(checkIns.email, valor),
    ilike(checkIns.telefono, valor),
    ilike(checkIns.ciudad, valor),
    ilike(checkIns.pais, valor),
  );
}

export async function contarCheckIns(filtro?: SQL): Promise<number> {
  const [fila] = await db.select({ total: count() }).from(checkIns).where(filtro);
  return fila?.total ?? 0;
}

export async function listarCheckIns(
  filtro: SQL | undefined,
  { pagina = 1, porPagina = POR_PAGINA } = {},
): Promise<CheckIn[]> {
  return db
    .select()
    .from(checkIns)
    .where(filtro)
    .orderBy(desc(checkIns.creadoEl))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);
}

/** Todos los registros que coinciden con el filtro, para exportar a CSV. */
export async function listarCheckInsCompleto(
  filtro: SQL | undefined,
): Promise<CheckIn[]> {
  return db
    .select()
    .from(checkIns)
    .where(filtro)
    .orderBy(desc(checkIns.creadoEl));
}

export type Resumen = {
  total: number;
  contactos: number;
  llegadasHoy: number;
  alojadosHoy: number;
};

/** Cifras de cabecera del panel. Siempre sobre el total, sin aplicar la búsqueda. */
export async function obtenerResumen(hoy: string): Promise<Resumen> {
  const [fila] = await db
    .select({
      total: count(),
      contactos: sql<number>`count(distinct ${checkIns.email})`.mapWith(Number),
      llegadasHoy:
        sql<number>`count(*) filter (where ${checkIns.fechaCheckIn} = ${hoy}::date)`.mapWith(
          Number,
        ),
      alojadosHoy:
        sql<number>`coalesce(sum(${checkIns.cantidadHuespedes}) filter (where ${checkIns.fechaCheckIn} <= ${hoy}::date and ${checkIns.fechaCheckOut} > ${hoy}::date), 0)`.mapWith(
          Number,
        ),
    })
    .from(checkIns);

  return (
    fila ?? { total: 0, contactos: 0, llegadasHoy: 0, alojadosHoy: 0 }
  );
}
