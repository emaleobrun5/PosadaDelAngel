import type { ValoresFormulario } from "../estado-check-in";

/**
 * Estado del formulario de edición del panel.
 * Vive fuera de `acciones.ts` porque un archivo `"use server"` sólo puede
 * exportar funciones async.
 */
export type EstadoEdicion =
  | { estado: "inicial" }
  | {
      estado: "error";
      /** Se usa como `key` del campo de país; ver `CamposHuesped`. */
      intento: number;
      errores: Record<string, string>;
      valores: ValoresFormulario;
      mensaje?: string;
    }
  | { estado: "guardado"; intento: number; valores: ValoresFormulario };

export const ESTADO_EDICION_INICIAL: EstadoEdicion = { estado: "inicial" };
