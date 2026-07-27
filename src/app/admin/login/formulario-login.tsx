"use client";

import { useActionState } from "react";

import { iniciarSesion } from "../acciones";
import { ESTADO_LOGIN_INICIAL } from "../estado-login";

export function FormularioLogin() {
  const [estado, enviar, enviando] = useActionState(
    iniciarSesion,
    ESTADO_LOGIN_INICIAL,
  );

  return (
    <form action={enviar} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium tracking-wide text-tinta-suave uppercase"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-describedby={estado.error ? "password-error" : undefined}
          className={`w-full rounded-xl border bg-white px-4 py-3.5 text-lg outline-none transition focus:ring-4 ${
            estado.error
              ? "border-alerta focus:border-alerta focus:ring-alerta/10"
              : "border-arena-oscura focus:border-bosque focus:ring-bosque/10"
          }`}
        />
      </div>

      {estado.error ? (
        <p
          id="password-error"
          role="alert"
          className="text-sm font-medium text-alerta"
        >
          {estado.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-xl bg-bosque px-6 py-4 text-lg font-medium text-crema transition active:scale-[0.99] disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
