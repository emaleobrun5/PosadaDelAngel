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
 * Todos los datos del huésped son opcionales a propósito: en recepción es
 * preferible quedarse con un registro incompleto que perderlo entero porque
 * alguien no tenía el pasaporte a mano.
 *
 * Las fechas de estadía son `date` (sin hora ni zona horaria) para que el día
 * que eligió el huésped sea exactamente el que se guarda y se muestra.
 */
export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: text("nombre"),
    apellido: text("apellido"),
    fechaNacimiento: date("fecha_nacimiento"),
    /** Cédula uruguaya o DNI, según de dónde venga el huésped. */
    documento: text("documento"),
    pasaporte: text("pasaporte"),
    email: text("email"),
    telefono: text("telefono"),
    pais: text("pais"),
    ciudad: text("ciudad"),
    fechaCheckIn: date("fecha_check_in"),
    fechaCheckOut: date("fecha_check_out"),
    cantidadHuespedes: integer("cantidad_huespedes"),
    creadoEl: timestamp("creado_el", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    index("check_ins_creado_el_idx").on(tabla.creadoEl),
    index("check_ins_email_idx").on(tabla.email),
    index("check_ins_fecha_check_in_idx").on(tabla.fechaCheckIn),
    index("check_ins_documento_idx").on(tabla.documento),
  ],
);

export type CheckIn = typeof checkIns.$inferSelect;
export type NuevoCheckIn = typeof checkIns.$inferInsert;
