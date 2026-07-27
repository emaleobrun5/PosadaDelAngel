/**
 * Estado del formulario de recepción.
 * Vive fuera de `acciones.ts` porque un archivo `"use server"` sólo puede
 * exportar funciones async.
 */

/** Lo que el huésped escribió, tal cual llegó al servidor. */
export type ValoresFormulario = Record<string, string>;

export type EstadoFormulario =
  | { estado: "inicial" }
  | {
      estado: "error";
      /**
       * Cuántos envíos fallidos lleva este formulario. Lo lleva el servidor a
       * partir del estado anterior, y el cliente lo usa como `key` del campo
       * de país para remontarlo después del reseteo que hace React.
       */
      intento: number;
      errores: Record<string, string>;
      /**
       * React vacía los campos no controlados cuando termina una acción, así
       * que el servidor devuelve lo enviado para reponerlo por `defaultValue`.
       * Sin esto el huésped tendría que escribir todo de nuevo por un typo.
       */
      valores: ValoresFormulario;
      mensaje?: string;
    }
  | { estado: "ok"; nombre: string };

export const ESTADO_INICIAL: EstadoFormulario = { estado: "inicial" };

export const VALORES_VACIOS: ValoresFormulario = {};
