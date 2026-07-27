/**
 * Estado del formulario de acceso al panel.
 * Vive fuera de `acciones.ts` porque un archivo `"use server"` sólo puede
 * exportar funciones async.
 */
export type EstadoLogin = { error?: string };

export const ESTADO_LOGIN_INICIAL: EstadoLogin = {};
