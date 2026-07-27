"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { abrirSesion, cerrarSesion, passwordEsCorrecta } from "@/lib/auth";
import { superoElLimite } from "@/lib/limite-envios";

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
