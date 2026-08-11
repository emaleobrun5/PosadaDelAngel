import { z } from "zod";

import { hoyEnLaPosada } from "./fechas";
import { PAISES } from "./paises";

/** Nadie que se registre en la posada nació antes de esto. */
const NACIMIENTO_MAS_ANTIGUO = "1900-01-01";

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Con cualquiera de estos alcanza para saber a quién corresponde el registro. */
const CAMPOS_IDENTIFICATORIOS = [
  "nombre",
  "apellido",
  "documento",
  "pasaporte",
  "email",
  "telefono",
] as const;

/**
 * Un campo que el huésped dejó en blanco llega como cadena vacía. Convertirlo
 * en `undefined` hace que el resto del esquema lo trate como "no completado"
 * en lugar de como un valor inválido.
 */
function vaciarSiEstaEnBlanco(valor: unknown): unknown {
  if (typeof valor !== "string") return valor ?? undefined;
  const limpio = valor.trim();
  return limpio === "" ? undefined : limpio;
}

/** Todos los datos del huésped son opcionales, pero si vienen tienen que ser válidos. */
function opcional<T extends z.ZodType>(esquema: T) {
  return z.preprocess(vaciarSiEstaEnBlanco, esquema.optional());
}

/**
 * Las fechas viajan y se guardan como texto `YYYY-MM-DD`. Al no convertirlas a
 * `Date` nunca se corren un día por diferencia de zona horaria entre la tablet
 * y el servidor, y como el formato es ISO se pueden comparar como strings.
 */
const fecha = z
  .string()
  .regex(FORMATO_FECHA, "Elegí una fecha válida")
  .refine((valor) => !Number.isNaN(Date.parse(valor)), "Elegí una fecha válida");

export const esquemaCheckIn = z
  .object({
    nombre: opcional(z.string().max(60, "Máximo 60 caracteres")),
    apellido: opcional(z.string().max(60, "Máximo 60 caracteres")),
    fechaNacimiento: opcional(
      fecha
        .refine(
          (valor) => valor <= hoyEnLaPosada(),
          "La fecha de nacimiento no puede ser futura",
        )
        .refine(
          (valor) => valor >= NACIMIENTO_MAS_ANTIGUO,
          "Revisá la fecha de nacimiento",
        ),
    ),
    documento: opcional(
      z
        .string()
        .max(30, "Máximo 30 caracteres")
        .regex(
          /^[\dA-Za-z.\s-]+$/,
          "El documento solo puede tener números, letras, puntos y guiones",
        ),
    ),
    pasaporte: opcional(
      z
        .string()
        .max(30, "Máximo 30 caracteres")
        .regex(
          /^[\dA-Za-z\s-]+$/,
          "El pasaporte solo puede tener letras, números y guiones",
        ),
    ),
    email: opcional(
      z
        .email("Revisá el correo electrónico")
        .max(120, "Máximo 120 caracteres"),
    ),
    telefono: opcional(
      z
        .string()
        .max(30, "Máximo 30 caracteres")
        .regex(/^[\d\s()+-]+$/, "El teléfono solo puede tener números y + ( ) -"),
    ),
    pais: opcional(
      z
        .string()
        .refine((valor) => PAISES.includes(valor), "Elegí un país de la lista"),
    ),
    ciudad: opcional(z.string().max(80, "Máximo 80 caracteres")),
    fechaCheckIn: opcional(fecha),
    fechaCheckOut: opcional(fecha),
    cantidadHuespedes: opcional(
      z.coerce
        .number()
        .int("Tiene que ser un número entero")
        .min(1, "Al menos 1 huésped")
        .max(20, "Máximo 20 huéspedes"),
    ),
  })
  .refine(
    (datos) =>
      !datos.fechaCheckIn ||
      !datos.fechaCheckOut ||
      datos.fechaCheckOut > datos.fechaCheckIn,
    {
      path: ["fechaCheckOut"],
      message: "La salida tiene que ser posterior a la llegada",
    },
  )
  // Un registro sin ninguna forma de saber quién es el huésped no le sirve a
  // nadie en recepción. No alcanza con exigir "algún dato": la fecha de llegada
  // viene precargada con hoy, así que el formulario nunca está del todo vacío.
  .refine(
    (datos) =>
      CAMPOS_IDENTIFICATORIOS.some((campo) => datos[campo] !== undefined),
    {
      message:
        "Necesitamos al menos un dato para identificarte: nombre, documento, pasaporte, correo o teléfono.",
    },
  );

export type DatosCheckIn = z.infer<typeof esquemaCheckIn>;

/**
 * Separa los errores de Zod entre los que apuntan a un campo (se muestran al
 * lado del campo) y los que valen para todo el formulario.
 */
export function agruparErrores(error: z.ZodError): {
  errores: Record<string, string>;
  general?: string;
} {
  const errores: Record<string, string> = {};
  let general: string | undefined;

  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "");
    if (!campo) {
      general ??= issue.message;
    } else if (!errores[campo]) {
      errores[campo] = issue.message;
    }
  }

  return { errores, general };
}
