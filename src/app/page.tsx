import { connection } from "next/server";

import { hoyEnLaPosada } from "@/lib/fechas";

import { FormularioCheckIn } from "./formulario-check-in";

export default async function PaginaKiosco() {
  // La tablet queda encendida días enteros: sin esto la página se prerenderiza
  // una sola vez y la fecha de llegada por defecto se congela en la del build.
  await connection();
  const hoy = hoyEnLaPosada();

  return (
    <main className="kiosco flex flex-1 flex-col items-center px-5 py-10 sm:px-8 sm:py-14">
      <div className="w-full max-w-3xl">
        <header className="mb-10 text-center">
          <svg
            viewBox="0 0 64 40"
            fill="none"
            aria-hidden="true"
            className="mx-auto mb-5 h-10 w-16 text-oro"
          >
            <path
              d="M32 6c-4 8-10 12-19 13 9 1 15 5 19 13 4-8 10-12 19-13-9-1-15-5-19-13Z"
              fill="currentColor"
              opacity="0.9"
            />
            <path
              d="M6 19h12M46 19h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <p className="mb-2 text-sm font-medium tracking-[0.3em] text-oro uppercase">
            Posada del Ángel
          </p>
          <h1 className="font-display text-4xl leading-tight text-bosque sm:text-5xl">
            Bienvenido
          </h1>
          <p className="mx-auto mt-3 max-w-md text-lg text-tinta-suave">
            Completá tus datos para registrar tu ingreso. Toma menos de un minuto.
          </p>
        </header>

        <FormularioCheckIn hoy={hoy} />

        <p className="mt-8 text-center text-sm text-tinta-suave/70">
          Usamos estos datos únicamente para gestionar tu estadía.
        </p>
      </div>
    </main>
  );
}
