"use server";

import { headers } from "next/headers";

import { db } from "@/db";
import { checkIns } from "@/db/schema";
import { superoElLimite } from "@/lib/limite-envios";
import { erroresPorCampo, esquemaCheckIn } from "@/lib/validacion";

import type { EstadoFormulario, ValoresFormulario } from "./estado-check-in";

const CAMPOS = [
  "nombre",
  "apellido",
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
    return {
      estado: "error",
      intento,
      errores: erroresPorCampo(resultado.error),
      valores,
      mensaje: "Revisá los campos marcados y volvé a enviar.",
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
      ...datos,
      email: datos.email.toLowerCase(),
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

  return { estado: "ok", nombre: datos.nombre };
}
