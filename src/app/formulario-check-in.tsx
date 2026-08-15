"use client";

import { useActionState, useCallback, useEffect, useState } from "react";

import { registrarCheckIn } from "./acciones";
import { CamposHuesped } from "./campos-huesped";
import { ESTADO_INICIAL, type ValoresFormulario } from "./estado-check-in";

/** Segundos que queda visible el agradecimiento antes de volver al formulario. */
const SEGUNDOS_HASTA_REINICIO = 12;

function Agradecimiento({
  nombre,
  onReiniciar,
}: {
  nombre: string;
  onReiniciar: () => void;
}) {
  const [restantes, setRestantes] = useState(SEGUNDOS_HASTA_REINICIO);

  // La vuelta al formulario y la cuenta regresiva van en temporizadores
  // separados: mezclarlas haría que el reinicio del padre se dispare desde el
  // cálculo del nuevo estado, es decir en pleno render.
  useEffect(() => {
    const temporizador = setTimeout(
      onReiniciar,
      SEGUNDOS_HASTA_REINICIO * 1000,
    );
    return () => clearTimeout(temporizador);
  }, [onReiniciar]);

  useEffect(() => {
    const intervalo = setInterval(
      () => setRestantes((valor) => Math.max(0, valor - 1)),
      1000,
    );
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-arena-oscura bg-white px-8 py-16 text-center shadow-sm">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-bosque">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 text-oro-claro"
          aria-hidden="true"
        >
          <path d="m4 12.5 5.5 5.5L20 7" />
        </svg>
      </span>

      <div className="space-y-2">
        <h2 className="font-display text-4xl text-bosque">
          {nombre ? `¡Gracias, ${nombre}!` : "¡Gracias!"}
        </h2>
        <p className="text-lg text-tinta-suave">
          Tu registro quedó guardado. Que disfrutes tu estadía en la posada.
        </p>
      </div>

      <button
        type="button"
        onClick={onReiniciar}
        className="rounded-xl bg-bosque px-8 py-4 text-lg font-medium text-crema transition active:scale-[0.98]"
      >
        Registrar otro huésped
      </button>

      <p className="text-sm text-tinta-suave/70">
        El formulario vuelve solo en {restantes}s
      </p>
    </div>
  );
}

function Panel({ hoy, onReiniciar }: { hoy: string; onReiniciar: () => void }) {
  const [estado, enviar, enviando] = useActionState(
    registrarCheckIn,
    ESTADO_INICIAL,
  );

  // Arranque del kiosco: la llegada es hoy y la estadía se asume de una persona,
  // que es el caso más común. Ambos se pueden cambiar o dejar sin especificar.
  const valoresIniciales: ValoresFormulario = {
    fechaCheckIn: hoy,
    cantidadHuespedes: "1",
  };

  const errores = estado.estado === "error" ? estado.errores : {};
  const valores = estado.estado === "error" ? estado.valores : valoresIniciales;
  const intento = estado.estado === "error" ? estado.intento : 0;

  if (estado.estado === "ok") {
    return <Agradecimiento nombre={estado.nombre} onReiniciar={onReiniciar} />;
  }

  return (
    <form
      action={enviar}
      autoComplete="off"
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

      <button
        type="submit"
        disabled={enviando}
        className="mt-8 w-full rounded-xl bg-bosque px-6 py-5 text-xl font-medium text-crema transition active:scale-[0.99] disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Confirmar registro"}
      </button>
    </form>
  );
}

export function FormularioCheckIn({ hoy }: { hoy: string }) {
  // Remontar el panel con una clave nueva es la forma de dejar el formulario
  // en blanco para el próximo huésped: limpia los campos y el estado de la acción.
  const [clave, setClave] = useState(0);
  // Identidad estable: el temporizador que devuelve al formulario depende de
  // esta función, y si cambiara en cada render se reiniciaría sin parar.
  const reiniciar = useCallback(() => setClave((numero) => numero + 1), []);

  return <Panel key={clave} hoy={hoy} onReiniciar={reiniciar} />;
}
