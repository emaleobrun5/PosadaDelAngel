"use client";

import { useState } from "react";

import { PAISES_FRECUENTES, PAISES_RESTANTES } from "@/lib/paises";

import type { ValoresFormulario } from "./estado-check-in";

const CLASE_CAMPO =
  "w-full rounded-xl border bg-white px-4 py-3.5 text-lg text-tinta outline-none transition placeholder:text-tinta-suave/60 focus:ring-4";
const CLASE_CAMPO_OK =
  "border-arena-oscura focus:border-bosque focus:ring-bosque/10";
const CLASE_CAMPO_ERROR =
  "border-alerta focus:border-alerta focus:ring-alerta/10";

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

/**
 * Contador táctil. El cero significa "sin especificar" y se manda como cadena
 * vacía: la cantidad también es opcional, y un registro viejo que no la tenga
 * no debe ganar un 1 solo por haberlo abierto para editar.
 */
function SelectorCantidad({
  error,
  inicial,
}: {
  error?: string;
  inicial: number;
}) {
  const [cantidad, setCantidad] = useState(inicial);

  const ajustar = (delta: number) =>
    setCantidad((actual) => Math.min(20, Math.max(0, actual + delta)));

  return (
    <>
      <input
        type="hidden"
        name="cantidadHuespedes"
        value={cantidad === 0 ? "" : cantidad}
      />
      <div
        className={`flex items-center justify-between rounded-xl border bg-white px-3 py-2 ${
          error ? "border-alerta" : "border-arena-oscura"
        }`}
      >
        <button
          type="button"
          onClick={() => ajustar(-1)}
          disabled={cantidad <= 0}
          aria-label="Quitar un huésped"
          className="h-12 w-12 rounded-lg bg-arena text-2xl leading-none text-bosque transition active:scale-95 disabled:opacity-35"
        >
          −
        </button>
        <span
          aria-live="polite"
          className="font-display text-3xl text-bosque tabular-nums"
        >
          {cantidad === 0 ? "—" : cantidad}
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

/**
 * Los campos del huésped, compartidos por el kiosco de recepción y la pantalla
 * de edición del panel. Están acá una sola vez para que agregar un dato nuevo
 * no implique acordarse de tocar los dos formularios.
 *
 * `valores` trae los valores iniciales de cada campo: en el kiosco son los que
 * el huésped acaba de enviar (o los de arranque), y en la edición los del
 * registro guardado.
 */
export function CamposHuesped({
  valores,
  errores,
  claveSelect,
  hoy,
}: {
  valores: ValoresFormulario;
  errores: Record<string, string>;
  /**
   * Al terminar una acción React resetea el formulario, y ese reseteo borra la
   * opción elegida del `<select>` sin que React lo note. Cambiar esta clave lo
   * remonta después del reseteo para que su `defaultValue` vuelva a aplicarse.
   */
  claveSelect: number;
  hoy: string;
}) {
  // La fecha de llegada es estado porque además define el mínimo de la salida.
  const [llegada, setLlegada] = useState(valores.fechaCheckIn ?? "");

  const claseDe = (campo: string) =>
    `${CLASE_CAMPO} ${errores[campo] ? CLASE_CAMPO_ERROR : CLASE_CAMPO_OK}`;
  const describe = (campo: string) =>
    errores[campo] ? `${campo}-error` : undefined;

  return (
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

      <Campo etiqueta="Pasaporte" htmlFor="pasaporte" error={errores.pasaporte}>
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
        <SelectorCantidad
          error={errores.cantidadHuespedes}
          inicial={Number(valores.cantidadHuespedes) || 0}
        />
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
          min={llegada || undefined}
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
          key={claveSelect}
          id="pais"
          name="pais"
          defaultValue={valores.pais ?? ""}
          aria-describedby={describe("pais")}
          className={claseDe("pais")}
        >
          <option value="">Sin especificar</option>
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
  );
}
