import { z } from "zod";

import { PAISES } from "./paises";

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Las fechas viajan y se guardan como texto `YYYY-MM-DD`. Al no convertirlas a
 * `Date` nunca se corren un día por diferencia de zona horaria entre la tablet
 * y el servidor, y como el formato es ISO se pueden comparar como strings.
 */
const fecha = z
  .string()
  .trim()
  .regex(FORMATO_FECHA, "Elegí una fecha válida")
  .refine((valor) => !Number.isNaN(Date.parse(valor)), "Elegí una fecha válida");

const texto = (min: number, max: number, mensaje: string) =>
  z.string().trim().min(min, mensaje).max(max, `Máximo ${max} caracteres`);

export const esquemaCheckIn = z
  .object({
    nombre: texto(2, 60, "Escribí tu nombre"),
    apellido: texto(2, 60, "Escribí tu apellido"),
    email: z.string().trim().pipe(z.email("Revisá el correo electrónico")).pipe(
      z.string().max(120, "Máximo 120 caracteres"),
    ),
    telefono: z
      .string()
      .trim()
      .min(6, "Escribí tu teléfono")
      .max(30, "Máximo 30 caracteres")
      .regex(/^[\d\s()+-]+$/, "El teléfono solo puede tener números y + ( ) -"),
    pais: z
      .string()
      .trim()
      .refine((valor) => PAISES.includes(valor), "Elegí tu país"),
    ciudad: texto(2, 80, "Escribí tu ciudad"),
    fechaCheckIn: fecha,
    fechaCheckOut: fecha,
    cantidadHuespedes: z.coerce
      .number()
      .int("Tiene que ser un número entero")
      .min(1, "Al menos 1 huésped")
      .max(20, "Máximo 20 huéspedes"),
  })
  .refine((datos) => datos.fechaCheckOut > datos.fechaCheckIn, {
    path: ["fechaCheckOut"],
    message: "La salida tiene que ser posterior a la llegada",
  });

export type DatosCheckIn = z.infer<typeof esquemaCheckIn>;

/** Convierte los issues de Zod en un mapa `campo -> primer mensaje`. */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "");
    if (campo && !errores[campo]) {
      errores[campo] = issue.message;
    }
  }
  return errores;
}
