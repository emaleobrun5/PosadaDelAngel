import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const NOMBRE_COOKIE = "posada_sesion";
/** Un turno largo de recepción: la sesión del panel dura 12 horas. */
const DURACION_SEGUNDOS = 12 * 60 * 60;

function leerVariable(nombre: "ADMIN_PASSWORD" | "SESSION_SECRET"): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}`);
  }
  return valor;
}

function firmar(contenido: string): string {
  return createHmac("sha256", leerVariable("SESSION_SECRET"))
    .update(contenido)
    .digest("hex");
}

/** Comparación de strings en tiempo constante. */
function sonIguales(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function passwordEsCorrecta(intento: string): boolean {
  return sonIguales(intento, leerVariable("ADMIN_PASSWORD"));
}

/**
 * La cookie guarda `<vencimiento>.<firma HMAC del vencimiento>`. No hay tabla de
 * sesiones: el servidor puede validarla con sólo el secreto, y cambiar
 * SESSION_SECRET invalida todas las sesiones abiertas.
 */
export async function abrirSesion(): Promise<void> {
  const vence = Date.now() + DURACION_SEGUNDOS * 1000;
  const jar = await cookies();
  jar.set(NOMBRE_COOKIE, `${vence}.${firmar(String(vence))}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}

export async function cerrarSesion(): Promise<void> {
  const jar = await cookies();
  jar.delete(NOMBRE_COOKIE);
}

export async function haySesionAbierta(): Promise<boolean> {
  const jar = await cookies();
  const valor = jar.get(NOMBRE_COOKIE)?.value;
  if (!valor) return false;

  const separador = valor.lastIndexOf(".");
  if (separador < 1) return false;

  const vence = valor.slice(0, separador);
  const firma = valor.slice(separador + 1);
  if (!sonIguales(firma, firmar(vence))) return false;

  return Number(vence) > Date.now();
}
