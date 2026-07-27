import { redirect } from "next/navigation";

import { haySesionAbierta } from "@/lib/auth";

import { FormularioLogin } from "./formulario-login";

export const metadata = { title: "Acceso al panel — Posada del Ángel" };

export default async function PaginaLogin() {
  if (await haySesionAbierta()) {
    redirect("/admin");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <p className="mb-2 text-sm font-medium tracking-[0.3em] text-oro uppercase">
            Posada del Ángel
          </p>
          <h1 className="font-display text-3xl text-bosque">Panel interno</h1>
          <p className="mt-2 text-tinta-suave">
            Acceso exclusivo del personal de la posada.
          </p>
        </header>

        <div className="rounded-2xl border border-arena-oscura bg-white p-6 shadow-sm">
          <FormularioLogin />
        </div>
      </div>
    </main>
  );
}
