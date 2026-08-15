"use client";

import Link from "next/link";
import { useActionState } from "react";

import { CamposHuesped } from "../../campos-huesped";
import type { ValoresFormulario } from "../../estado-check-in";
import { actualizarCheckIn } from "../acciones";
import { ESTADO_EDICION_INICIAL } from "../estado-edicion";

export function FormularioEdicion({
  id,
  valoresGuardados,
  hoy,
  volverA,
}: {
  id: string;
  valoresGuardados: ValoresFormulario;
  hoy: string;
  volverA: string;
}) {
  const [estado, enviar, guardando] = useActionState(
    actualizarCheckIn.bind(null, id),
    ESTADO_EDICION_INICIAL,
  );

  // Tras guardar o fallar, los campos muestran lo último que se envió al
  // servidor; recién al entrar muestran lo que hay en la base.
  const valores =
    estado.estado === "inicial" ? valoresGuardados : estado.valores;
  const errores = estado.estado === "error" ? estado.errores : {};
  const intento = estado.estado === "inicial" ? 0 : estado.intento;

  return (
    <form
      action={enviar}
      noValidate
      className="rounded-2xl border border-arena-oscura bg-white p-6 shadow-sm sm:p-8"
    >
      <CamposHuesped
        valores={valores}
        errores={errores}
        claveSelect={intento}
        hoy={hoy}
      />

      {estado.estado === "error" && estado.mensaje ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-alerta/30 bg-alerta/5 px-4 py-3 text-alerta"
        >
          {estado.mensaje}
        </p>
      ) : null}

      {estado.estado === "guardado" ? (
        <p
          role="status"
          className="mt-6 rounded-xl border border-bosque-claro/30 bg-bosque-claro/5 px-4 py-3 text-bosque"
        >
          Cambios guardados.
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-xl bg-bosque px-8 py-4 text-lg font-medium text-crema transition active:scale-[0.99] disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
        <Link
          href={volverA}
          className="rounded-xl border border-arena-oscura px-6 py-4 text-lg text-tinta-suave transition hover:bg-arena"
        >
          Volver al panel
        </Link>
      </div>
    </form>
  );
}
