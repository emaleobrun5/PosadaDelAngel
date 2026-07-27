import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("Falta la variable de entorno DATABASE_URL");
}

// En desarrollo el hot reload vuelve a evaluar este módulo en cada cambio.
// Guardar el pool en globalThis evita abrir una conexión nueva cada vez.
const global_ = globalThis as unknown as { poolPosada?: Pool };

const pool =
  global_.poolPosada ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

if (process.env.NODE_ENV !== "production") {
  global_.poolPosada = pool;
}

export const db = drizzle(pool, { schema });
