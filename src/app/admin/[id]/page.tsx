import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { haySesionAbierta } from "@/lib/auth";
import { obtenerCheckIn } from "@/lib/consultas";
import { formatearFechaHora, hoyEnLaPosada } from "@/lib/fechas";

import type { ValoresFormulario } from "../../estado-check-in";
import { FormularioEdicion } from "./formulario-edicion";

export const metadata = { title: "Editar registro — Posada del Ángel" };

/** El id de un registro es un UUID; cualquier otra cosa es un 404 directo. */
const FORMATO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PaginaEdicion({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; pagina?: string }>;
}) {
  if (!(await haySesionAbierta())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  if (!FORMATO_UUID.test(id)) {
    notFound();
  }

  const registro = await obtenerCheckIn(id);
  if (!registro) {
    notFound();
  }

  // Se reconstruye el enlace de vuelta a partir de los parámetros conocidos, en
  // vez de aceptar una URL entera: así nadie puede usarlo para mandar a alguien
  // fuera del panel.
  const consulta = await searchParams;
  const parametros = new URLSearchParams({
    ...(consulta.q ? { q: consulta.q.slice(0, 80) } : {}),
    ...(consulta.pagina ? { pagina: String(Number(consulta.pagina) || 1) } : {}),
  }).toString();
  const volverA = `/admin${parametros ? `?${parametros}` : ""}`;

  const valores: ValoresFormulario = {
    nombre: registro.nombre ?? "",
    apellido: registro.apellido ?? "",
    fechaNacimiento: registro.fechaNacimiento ?? "",
    documento: registro.documento ?? "",
    pasaporte: registro.pasaporte ?? "",
    email: registro.email ?? "",
    telefono: registro.telefono ?? "",
    pais: registro.pais ?? "",
    ciudad: registro.ciudad ?? "",
    fechaCheckIn: registro.fechaCheckIn ?? "",
    fechaCheckOut: registro.fechaCheckOut ?? "",
    cantidadHuespedes: registro.cantidadHuespedes?.toString() ?? "",
  };

  const nombreCompleto =
    [registro.nombre, registro.apellido].filter(Boolean).join(" ") ||
    "Registro sin nombre";

  return (
    <main className="flex-1 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href={volverA}
          className="text-sm text-tinta-suave underline underline-offset-4"
        >
          ← Volver al panel
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="font-display text-3xl text-bosque">
            {nombreCompleto}
          </h1>
          <p className="mt-1 text-tinta-suave">
            Registrado el {formatearFechaHora(registro.creadoEl)}
          </p>
        </header>

        <FormularioEdicion
          id={registro.id}
          valoresGuardados={valores}
          hoy={hoyEnLaPosada()}
          volverA={volverA}
        />
      </div>
    </main>
  );
}
