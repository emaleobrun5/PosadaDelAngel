import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("Falta la variable de entorno DATABASE_URL");
}

// El pool se reutiliza vía globalThis en todos los entornos: en desarrollo
// porque el hot reload reevalúa este módulo en cada cambio, y en producción
// porque cada instancia serverless atiende muchas peticiones seguidas.
const global_ = globalThis as unknown as { poolPosada?: Pool };

const pool =
  global_.poolPosada ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // En serverless cada instancia levanta su propio pool y todas comparten el
    // límite de conexiones de la base, así que conviene abrir pocas por
    // instancia y soltar rápido las ociosas. El pooling de verdad lo hace
    // Supavisor: DATABASE_URL apunta al transaction pooler de Supabase (6543).
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

global_.poolPosada = pool;

export const db = drizzle(pool, { schema });
