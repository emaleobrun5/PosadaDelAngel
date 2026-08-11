"use client";

import { useActionState, useCallback, useEffect, useState } from "react";

import { PAISES_FRECUENTES, PAISES_RESTANTES } from "@/lib/paises";

import { registrarCheckIn } from "./acciones";
import { ESTADO_INICIAL, VALORES_VACIOS } from "./estado-check-in";

/** Segundos que queda visible el agradecimiento antes de volver al formulario. */
const SEGUNDOS_HASTA_REINICIO = 12;

const CLASE_CAMPO =
  "w-full rounded-xl border bg-white px-4 py-3.5 text-lg text-tinta outline-none transition placeholder:text-tinta-suave/60 focus:ring-4";
const CLASE_CAMPO_OK =
  "border-arena-oscura focus:border-bosque focus:ring-bosque/10";
const CLASE_CAMPO_ERROR = "border-alerta focus:border-alerta focus:ring-alerta/10";

function Campo({
  etiqueta,
  htmlFor,
  error,
  className = "",
  children,
}: {
  etiqueta: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium tracking-wide text-tinta-suave uppercase"
      >
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-1.5 text-sm font-medium text-alerta"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectorCantidad({ error }: { error?: string }) {
  const [cantidad, setCantidad] = useState(1);

  const ajustar = (delta: number) =>
    setCantidad((actual) => Math.min(20, Math.max(1, actual + delta)));

  return (
    <>
      <input type="hidden" name="cantidadHuespedes" value={cantidad} />
      <div
        className={`flex items-center justify-between rounded-xl border bg-white px-3 py-2 ${
          error ? "border-alerta" : "border-arena-oscura"
        }`}
      >
        <button
          type="button"
          onClick={() => ajustar(-1)}
          disabled={cantidad <= 1}
          aria-label="Quitar un huésped"
          className="h-12 w-12 rounded-lg bg-arena text-2xl leading-none text-bosque transition active:scale-95 disabled:opacity-35"
        >
          −
        </button>
        <span
          aria-live="polite"
          className="font-display text-3xl text-bosque tabular-nums"
        >
          {cantidad}
        </span>
        <button
          type="button"
          onClick={() => ajustar(1)}
          disabled={cantidad >= 20}
          aria-label="Agregar un huésped"
          className="h-12 w-12 rounded-lg bg-arena text-2xl leading-none text-bosque transition active:scale-95 disabled:opacity-35"
        >
          +
        </button>
      </div>
    </>
  );
}

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
  // La fecha de llegada es estado de React porque además define el mínimo de la
  // fecha de salida.
  const [llegada, setLlegada] = useState(hoy);

  const errores = estado.estado === "error" ? estado.errores : {};
  const valores = estado.estado === "error" ? estado.valores : VALORES_VACIOS;
  // Al terminar la acción React resetea el formulario, y ese reseteo borra la
  // opción elegida del <select> sin que React lo note. Como el servidor numera
  // los intentos, usar ese número como `key` remonta el campo después del
  // reseteo y su `defaultValue` vuelve a aplicarse.
  const intento = estado.estado === "error" ? estado.intento : 0;
  const claseDe = (campo: string) =>
    `${CLASE_CAMPO} ${errores[campo] ? CLASE_CAMPO_ERROR : CLASE_CAMPO_OK}`;
  const describe = (campo: string) =>
    errores[campo] ? `${campo}-error` : undefined;

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
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Nombre" htmlFor="nombre" error={errores.nombre}>
          <input
            id="nombre"
            name="nombre"
            type="text"
            defaultValue={valores.nombre ?? ""}
            autoComplete="off"
            aria-describedby={describe("nombre")}
            className={claseDe("nombre")}
            placeholder="María"
          />
        </Campo>

        <Campo etiqueta="Apellido" htmlFor="apellido" error={errores.apellido}>
          <input
            id="apellido"
            name="apellido"
            type="text"
            defaultValue={valores.apellido ?? ""}
            autoComplete="off"
            aria-describedby={describe("apellido")}
            className={claseDe("apellido")}
            placeholder="González"
          />
        </Campo>

        <Campo
          etiqueta="Fecha de nacimiento"
          htmlFor="fechaNacimiento"
          error={errores.fechaNacimiento}
        >
          <input
            id="fechaNacimiento"
            name="fechaNacimiento"
            type="date"
            defaultValue={valores.fechaNacimiento ?? ""}
            max={hoy}
            aria-describedby={describe("fechaNacimiento")}
            className={claseDe("fechaNacimiento")}
          />
        </Campo>

        <Campo
          etiqueta="Cédula o DNI"
          htmlFor="documento"
          error={errores.documento}
        >
          <input
            id="documento"
            name="documento"
            type="text"
            inputMode="numeric"
            defaultValue={valores.documento ?? ""}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={describe("documento")}
            className={claseDe("documento")}
            placeholder="1.234.567-8"
          />
        </Campo>

        <Campo
          etiqueta="Pasaporte"
          htmlFor="pasaporte"
          error={errores.pasaporte}
        >
          <input
            id="pasaporte"
            name="pasaporte"
            type="text"
            defaultValue={valores.pasaporte ?? ""}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={describe("pasaporte")}
            className={claseDe("pasaporte")}
            placeholder="AB123456"
          />
        </Campo>

        <Campo
          etiqueta="Cantidad de huéspedes"
          htmlFor="cantidadHuespedes"
          error={errores.cantidadHuespedes}
        >
          <SelectorCantidad error={errores.cantidadHuespedes} />
        </Campo>

        <Campo
          etiqueta="Fecha de llegada"
          htmlFor="fechaCheckIn"
          error={errores.fechaCheckIn}
        >
          <input
            id="fechaCheckIn"
            name="fechaCheckIn"
            type="date"
            value={llegada}
            onChange={(evento) => setLlegada(evento.target.value)}
            aria-describedby={describe("fechaCheckIn")}
            className={claseDe("fechaCheckIn")}
          />
        </Campo>

        <Campo
          etiqueta="Fecha de salida"
          htmlFor="fechaCheckOut"
          error={errores.fechaCheckOut}
        >
          <input
            id="fechaCheckOut"
            name="fechaCheckOut"
            type="date"
            defaultValue={valores.fechaCheckOut ?? ""}
            min={llegada || hoy}
            aria-describedby={describe("fechaCheckOut")}
            className={claseDe("fechaCheckOut")}
          />
        </Campo>

        <Campo
          etiqueta="Correo electrónico"
          htmlFor="email"
          error={errores.email}
          className="sm:col-span-2"
        >
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            defaultValue={valores.email ?? ""}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={describe("email")}
            className={claseDe("email")}
            placeholder="maria@ejemplo.com"
          />
        </Campo>

        <Campo etiqueta="Teléfono" htmlFor="telefono" error={errores.telefono}>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            inputMode="tel"
            defaultValue={valores.telefono ?? ""}
            autoComplete="off"
            aria-describedby={describe("telefono")}
            className={claseDe("telefono")}
            placeholder="+598 99 123 456"
          />
        </Campo>

        <Campo etiqueta="País" htmlFor="pais" error={errores.pais}>
          <select
            key={intento}
            id="pais"
            name="pais"
            defaultValue={valores.pais ?? ""}
            aria-describedby={describe("pais")}
            className={claseDe("pais")}
          >
            <option value="" disabled>
              Elegí tu país
            </option>
            {PAISES_FRECUENTES.map((pais) => (
              <option key={pais} value={pais}>
                {pais}
              </option>
            ))}
            <option disabled>──────────</option>
            {PAISES_RESTANTES.map((pais) => (
              <option key={pais} value={pais}>
                {pais}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Ciudad" htmlFor="ciudad" error={errores.ciudad}>
          <input
            id="ciudad"
            name="ciudad"
            type="text"
            defaultValue={valores.ciudad ?? ""}
            autoComplete="off"
            aria-describedby={describe("ciudad")}
            className={claseDe("ciudad")}
            placeholder="Montevideo"
          />
        </Campo>
      </div>

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
