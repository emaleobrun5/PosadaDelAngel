"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { checkIns } from "@/db/schema";
import {
  abrirSesion,
  cerrarSesion,
  haySesionAbierta,
  passwordEsCorrecta,
} from "@/lib/auth";
import { superoElLimite } from "@/lib/limite-envios";
import { agruparErrores, esquemaCheckIn } from "@/lib/validacion";

import type { ValoresFormulario } from "../estado-check-in";
import type { EstadoEdicion } from "./estado-edicion";
import type { EstadoLogin } from "./estado-login";

export async function iniciarSesion(
  _anterior: EstadoLogin,
  datosFormulario: FormData,
): Promise<EstadoLogin> {
  const password = String(datosFormulario.get("password") ?? "");

  if (!password) {
    return { error: "Escribí la contraseña." };
  }

  const cabeceras = await headers();
  const origen =
    cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (superoElLimite(`login:${origen}`)) {
    return {
      error: "Demasiados intentos fallidos. Esperá unos minutos.",
    };
  }

  if (!passwordEsCorrecta(password)) {
    return { error: "Contraseña incorrecta." };
  }

  await abrirSesion();
  redirect("/admin");
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect("/admin/login");
}

const CAMPOS = [
  "nombre",
  "apellido",
  "fechaNacimiento",
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

/**
 * Guarda los cambios que el personal hizo sobre un registro.
 *
 * El `id` llega por `bind` y no por un campo del formulario: una acción de
 * servidor se puede invocar por POST directo, así que cuanto menos venga del
 * cliente, mejor. La sesión se verifica acá adentro por el mismo motivo.
 */
export async function actualizarCheckIn(
  id: string,
  anterior: EstadoEdicion,
  datosFormulario: FormData,
): Promise<EstadoEdicion> {
  if (!(await haySesionAbierta())) {
    redirect("/admin/login");
  }

  const intento = (anterior.estado === "inicial" ? 0 : anterior.intento) + 1;

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
      mensaje: general ?? "Revisá los campos marcados y volvé a guardar.",
    };
  }

  const datos = resultado.data;

  try {
    const actualizados = await db
      .update(checkIns)
      .set({
        nombre: datos.nombre ?? null,
        apellido: datos.apellido ?? null,
        fechaNacimiento: datos.fechaNacimiento ?? null,
        documento: datos.documento ?? null,
        pasaporte: datos.pasaporte ?? null,
        email: datos.email?.toLowerCase() ?? null,
        telefono: datos.telefono ?? null,
        pais: datos.pais ?? null,
        ciudad: datos.ciudad ?? null,
        fechaCheckIn: datos.fechaCheckIn ?? null,
        fechaCheckOut: datos.fechaCheckOut ?? null,
        cantidadHuespedes: datos.cantidadHuespedes ?? null,
      })
      .where(eq(checkIns.id, id))
      .returning({ id: checkIns.id });

    if (actualizados.length === 0) {
      return {
        estado: "error",
        intento,
        errores: {},
        valores,
        mensaje: "El registro ya no existe. Puede que alguien lo haya borrado.",
      };
    }
  } catch (error) {
    console.error("No se pudo actualizar el check-in", error);
    return {
      estado: "error",
      intento,
      errores: {},
      valores,
      mensaje: "No pudimos guardar los cambios. Probá de nuevo.",
    };
  }

  return { estado: "guardado", intento, valores };
}
