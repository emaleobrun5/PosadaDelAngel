"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Cada cuánto se vuelve a consultar la base mientras el panel está a la vista. */
const INTERVALO_MS = 15_000;

/**
 * Mantiene el panel al día sin que nadie tenga que recargar.
 *
 * `router.refresh()` vuelve a ejecutar el componente de servidor de la página,
 * así que la tabla y las métricas se rehacen con datos frescos conservando la
 * búsqueda y la página actuales.
 *
 * El refresco se pausa cuando la pestaña no está a la vista: el panel suele
 * quedar abierto todo el día en la recepción, y sin esa pausa seguiría
 * consultando la base durante la noche sin que nadie lo esté mirando.
 */
export function ActualizacionEnVivo() {
  const router = useRouter();
  const [aLaVista, setALaVista] = useState(true);

  useEffect(() => {
    const alCambiarVisibilidad = () => {
      const visible = document.visibilityState === "visible";
      setALaVista(visible);
      // Al volver a la pestaña, ponerse al día de una en vez de esperar el ciclo.
      if (visible) router.refresh();
    };

    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () =>
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
  }, [router]);

  useEffect(() => {
    if (!aLaVista) return;

    const intervalo = setInterval(() => router.refresh(), INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [aLaVista, router]);

  return (
    <span
      className="inline-flex items-center gap-2 text-sm text-tinta-suave"
      title={
        aLaVista
          ? `Se actualiza solo cada ${INTERVALO_MS / 1000} segundos`
          : "Se reanuda al volver a esta pestaña"
      }
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${
          aLaVista ? "animate-pulse bg-bosque-claro" : "bg-arena-oscura"
        }`}
      />
      {aLaVista ? "En vivo" : "Pausado"}
    </span>
  );
}
