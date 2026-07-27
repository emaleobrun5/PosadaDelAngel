/**
 * Freno simple contra envíos automatizados al formulario público.
 * Es una ventana deslizante en memoria: alcanza para que nadie llene la base
 * desde afuera, pero no reemplaza a un WAF si algún día la URL se hace pública.
 */
const MAXIMO_POR_VENTANA = 10;
const VENTANA_MS = 10 * 60 * 1000;

const global_ = globalThis as unknown as {
  enviosPosada?: Map<string, number[]>;
};

const envios = (global_.enviosPosada ??= new Map<string, number[]>());

export function superoElLimite(clave: string): boolean {
  const ahora = Date.now();
  const recientes = (envios.get(clave) ?? []).filter(
    (momento) => ahora - momento < VENTANA_MS,
  );

  if (recientes.length >= MAXIMO_POR_VENTANA) {
    envios.set(clave, recientes);
    return true;
  }

  recientes.push(ahora);
  envios.set(clave, recientes);

  // Limpieza oportunista para que el Map no crezca sin control.
  if (envios.size > 5_000) {
    for (const [otraClave, momentos] of envios) {
      if (momentos.every((momento) => ahora - momento >= VENTANA_MS)) {
        envios.delete(otraClave);
      }
    }
  }

  return false;
}
