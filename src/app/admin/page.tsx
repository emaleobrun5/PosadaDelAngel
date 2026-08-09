import Link from "next/link";
import { redirect } from "next/navigation";

import { haySesionAbierta } from "@/lib/auth";
import {
  POR_PAGINA,
  contarCheckIns,
  filtroBusqueda,
  listarCheckIns,
  obtenerResumen,
} from "@/lib/consultas";
import {
  contarNoches,
  formatearFecha,
  formatearFechaHora,
  hoyEnLaPosada,
} from "@/lib/fechas";

import { salir } from "./acciones";
import { ActualizacionEnVivo } from "./actualizacion-en-vivo";

export const metadata = { title: "Panel interno — Posada del Ángel" };

function Tarjeta({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-xl border border-arena-oscura bg-white px-5 py-4">
      <p className="text-sm text-tinta-suave">{titulo}</p>
      <p className="font-display text-3xl text-bosque tabular-nums">{valor}</p>
    </div>
  );
}

const CELDA = "px-4 py-3 align-top";
const ENCABEZADO =
  "px-4 py-3 text-left text-xs font-semibold tracking-wide text-tinta-suave uppercase";

export default async function PaginaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string }>;
}) {
  if (!(await haySesionAbierta())) {
    redirect("/admin/login");
  }

  const parametros = await searchParams;
  const busqueda = (parametros.q ?? "").slice(0, 80);
  const pagina = Math.max(1, Number(parametros.pagina) || 1);

  const filtro = filtroBusqueda(busqueda);
  const hoy = hoyEnLaPosada();

  const [resumen, total, registros] = await Promise.all([
    obtenerResumen(hoy),
    contarCheckIns(filtro),
    listarCheckIns(filtro, { pagina }),
  ]);

  const ultimaPagina = Math.max(1, Math.ceil(total / POR_PAGINA));
  const enlacePagina = (numero: number) =>
    `/admin?${new URLSearchParams({
      ...(busqueda ? { q: busqueda } : {}),
      ...(numero > 1 ? { pagina: String(numero) } : {}),
    })}`;
  const enlaceExportar = `/admin/exportar${busqueda ? `?q=${encodeURIComponent(busqueda)}` : ""}`;

  return (
    <main className="flex-1 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-medium tracking-[0.3em] text-oro uppercase">
              Posada del Ángel
            </p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h1 className="font-display text-3xl text-bosque">
                Registros de huéspedes
              </h1>
              <ActualizacionEnVivo />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={enlaceExportar}
              prefetch={false}
              className="rounded-lg border border-arena-oscura bg-white px-4 py-2.5 text-sm font-medium text-bosque transition hover:bg-arena"
            >
              Exportar CSV
            </Link>
            <form action={salir}>
              <button
                type="submit"
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-tinta-suave transition hover:text-alerta"
              >
                Salir
              </button>
            </form>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tarjeta titulo="Registros totales" valor={resumen.total} />
          <Tarjeta titulo="Contactos únicos" valor={resumen.contactos} />
          <Tarjeta titulo="Llegadas de hoy" valor={resumen.llegadasHoy} />
          <Tarjeta titulo="Huéspedes alojados hoy" valor={resumen.alojadosHoy} />
        </section>

        <form method="get" action="/admin" className="mb-5 flex gap-3">
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar por nombre, correo, teléfono, ciudad o país…"
            className="w-full max-w-lg rounded-xl border border-arena-oscura bg-white px-4 py-3 outline-none transition focus:border-bosque focus:ring-4 focus:ring-bosque/10"
          />
          <button
            type="submit"
            className="rounded-xl bg-bosque px-6 py-3 font-medium text-crema transition active:scale-[0.99]"
          >
            Buscar
          </button>
          {busqueda ? (
            <Link
              href="/admin"
              className="self-center px-2 text-sm text-tinta-suave underline underline-offset-4"
            >
              Limpiar
            </Link>
          ) : null}
        </form>

        <div className="overflow-x-auto rounded-xl border border-arena-oscura bg-white">
          <table className="w-full min-w-[64rem] border-collapse text-sm">
            <thead className="border-b border-arena-oscura bg-arena/40">
              <tr>
                <th className={ENCABEZADO}>Registrado</th>
                <th className={ENCABEZADO}>Huésped</th>
                <th className={ENCABEZADO}>Contacto</th>
                <th className={ENCABEZADO}>Procedencia</th>
                <th className={ENCABEZADO}>Llegada</th>
                <th className={ENCABEZADO}>Salida</th>
                <th className={ENCABEZADO}>Noches</th>
                <th className={ENCABEZADO}>Huéspedes</th>
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-tinta-suave"
                  >
                    {busqueda
                      ? `Ningún registro coincide con «${busqueda}».`
                      : "Todavía no hay registros. Van a aparecer acá apenas un huésped complete el formulario de recepción."}
                  </td>
                </tr>
              ) : (
                registros.map((registro) => (
                  <tr
                    key={registro.id}
                    className="border-b border-arena-oscura/50 last:border-0 hover:bg-crema"
                  >
                    <td className={`${CELDA} whitespace-nowrap text-tinta-suave`}>
                      {formatearFechaHora(registro.creadoEl)}
                    </td>
                    <td className={`${CELDA} font-medium text-bosque`}>
                      {registro.nombre} {registro.apellido}
                    </td>
                    <td className={CELDA}>
                      <a
                        href={`mailto:${registro.email}`}
                        className="block text-bosque-claro underline underline-offset-2"
                      >
                        {registro.email}
                      </a>
                      <a
                        href={`tel:${registro.telefono.replace(/\s/g, "")}`}
                        className="block text-tinta-suave"
                      >
                        {registro.telefono}
                      </a>
                    </td>
                    <td className={CELDA}>
                      {registro.ciudad}
                      <span className="block text-tinta-suave">
                        {registro.pais}
                      </span>
                    </td>
                    <td className={`${CELDA} whitespace-nowrap`}>
                      {formatearFecha(registro.fechaCheckIn)}
                    </td>
                    <td className={`${CELDA} whitespace-nowrap`}>
                      {formatearFecha(registro.fechaCheckOut)}
                    </td>
                    <td className={`${CELDA} tabular-nums`}>
                      {contarNoches(registro.fechaCheckIn, registro.fechaCheckOut)}
                    </td>
                    <td className={`${CELDA} tabular-nums`}>
                      {registro.cantidadHuespedes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <nav className="mt-5 flex items-center justify-between gap-4 text-sm">
          <p className="text-tinta-suave">
            {total === 0
              ? "Sin resultados"
              : `Mostrando ${(pagina - 1) * POR_PAGINA + 1}–${Math.min(
                  pagina * POR_PAGINA,
                  total,
                )} de ${total}`}
          </p>

          {ultimaPagina > 1 ? (
            <div className="flex items-center gap-2">
              {pagina > 1 ? (
                <Link
                  href={enlacePagina(pagina - 1)}
                  className="rounded-lg border border-arena-oscura bg-white px-3 py-2 text-bosque"
                >
                  Anterior
                </Link>
              ) : null}
              <span className="text-tinta-suave">
                Página {pagina} de {ultimaPagina}
              </span>
              {pagina < ultimaPagina ? (
                <Link
                  href={enlacePagina(pagina + 1)}
                  className="rounded-lg border border-arena-oscura bg-white px-3 py-2 text-bosque"
                >
                  Siguiente
                </Link>
              ) : null}
            </div>
          ) : null}
        </nav>
      </div>
    </main>
  );
}
