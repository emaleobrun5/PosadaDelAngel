"use server";

import { headers } from "next/headers";

import { db } from "@/db";
import { checkIns } from "@/db/schema";
import { superoElLimite } from "@/lib/limite-envios";
import { agruparErrores, esquemaCheckIn } from "@/lib/validacion";

import type { EstadoFormulario, ValoresFormulario } from "./estado-check-in";

const CAMPOS = [
  "nombre",
  "apellido",
  "documento",
  "pasaporte",
  "email",
  "telefono",
  "pais",
  "ciudad",
  "fechaCheckIn",
  "fechaCheckOut",
  "cantidadHuespedes",
] as const;

async function identificarCliente(): Promise<string> {
  const cabeceras = await headers();
  const reenviada = cabeceras.get("x-forwarded-for");
  return (
    reenviada?.split(",")[0]?.trim() || cabeceras.get("x-real-ip") || "local"
  );
}

/** La columna es opcional: lo que no se completó se guarda como NULL. */
function oNulo<T>(valor: T | undefined): T | null {
  return valor ?? null;
}

export async function registrarCheckIn(
  anterior: EstadoFormulario,
  datosFormulario: FormData,
): Promise<EstadoFormulario> {
  const intento = (anterior.estado === "error" ? anterior.intento : 0) + 1;

  const valores = Object.fromEntries(
    CAMPOS.map((campo) => [campo, String(datosFormulario.get(campo) ?? "")]),
  ) as ValoresFormulario;

  const resultado = esquemaCheckIn.safeParse(valores);

  if (!resultado.success) {
    const { errores, general } = agruparErrores(resultado.error);
    return {
      estado: "error",
      intento,
      errores,
      valores,
      mensaje: general ?? "Revisá los campos marcados y volvé a enviar.",
    };
  }

  if (superoElLimite(await identificarCliente())) {
    return {
      estado: "error",
      intento,
      errores: {},
      valores,
      mensaje:
        "Se registraron demasiados ingresos seguidos desde este dispositivo. Esperá unos minutos o avisá en recepción.",
    };
  }

  const datos = resultado.data;

  try {
    await db.insert(checkIns).values({
      nombre: oNulo(datos.nombre),
      apellido: oNulo(datos.apellido),
      documento: oNulo(datos.documento),
      pasaporte: oNulo(datos.pasaporte),
      email: oNulo(datos.email?.toLowerCase()),
      telefono: oNulo(datos.telefono),
      pais: oNulo(datos.pais),
      ciudad: oNulo(datos.ciudad),
      fechaCheckIn: oNulo(datos.fechaCheckIn),
      fechaCheckOut: oNulo(datos.fechaCheckOut),
      cantidadHuespedes: oNulo(datos.cantidadHuespedes),
    });
  } catch (error) {
    console.error("No se pudo guardar el check-in", error);
    return {
      estado: "error",
      intento,
      errores: {},
      valores,
      mensaje:
        "No pudimos guardar el registro. Probá de nuevo o avisá en recepción.",
    };
  }

  return { estado: "ok", nombre: datos.nombre ?? "" };
}
