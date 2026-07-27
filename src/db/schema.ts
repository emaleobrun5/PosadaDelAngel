import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Un registro de ingreso cargado por el huésped en la tablet de recepción.
 * Cada estadía genera una fila; un mismo huésped puede tener varias a lo largo
 * del tiempo, y esas repeticiones son justamente la base de datos de clientes.
 *
 * Las fechas de estadía son `date` (sin hora ni zona horaria) para que el día
 * que eligió el huésped sea exactamente el que se guarda y se muestra.
 */
export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: text("nombre").notNull(),
    apellido: text("apellido").notNull(),
    email: text("email").notNull(),
    telefono: text("telefono").notNull(),
    pais: text("pais").notNull(),
    ciudad: text("ciudad").notNull(),
    fechaCheckIn: date("fecha_check_in").notNull(),
    fechaCheckOut: date("fecha_check_out").notNull(),
    cantidadHuespedes: integer("cantidad_huespedes").notNull(),
    creadoEl: timestamp("creado_el", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    index("check_ins_creado_el_idx").on(tabla.creadoEl),
    index("check_ins_email_idx").on(tabla.email),
    index("check_ins_fecha_check_in_idx").on(tabla.fechaCheckIn),
  ],
);

export type CheckIn = typeof checkIns.$inferSelect;
export type NuevoCheckIn = typeof checkIns.$inferInsert;
