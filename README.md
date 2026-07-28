# Posada del Ángel — Sistema interno de check-in

Registro de huéspedes de la posada. Son dos vistas sobre la misma base de datos:

| Vista | Ruta | Quién la usa |
| --- | --- | --- |
| **Recepción (kiosco)** | `/` | El huésped, en la tablet de recepción siempre encendida |
| **Panel interno** | `/admin` | El personal de la posada, con contraseña |

El huésped completa nombre, apellido, fechas de llegada y salida, correo, teléfono,
cantidad de huéspedes, país y ciudad. Cada envío queda como una fila en la tabla
`check_ins`, y esas filas acumuladas son la base de datos de clientes.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4**
- **PostgreSQL** con **Drizzle ORM**

> Se eligió Drizzle en lugar de Prisma porque **Smart App Control de Windows bloquea
> el binario nativo `schema-engine-windows.exe`** de Prisma en las máquinas de
> desarrollo, y sin él `prisma migrate` no corre. Drizzle es JavaScript puro y no
> depende de binarios sujetos a esa política.

## Puesta en marcha local

Requiere Node.js 20+ y PostgreSQL corriendo.

1. Crear la base y el rol (una sola vez):

```bash
psql -U postgres -c "CREATE ROLE posada LOGIN PASSWORD 'posada_local_pw';"
```

```bash
psql -U postgres -c "CREATE DATABASE posada_del_angel OWNER posada;"
```

2. Copiar `.env.example` a `.env` y completar las tres variables:

| Variable | Para qué sirve |
| --- | --- |
| `DATABASE_URL` | Conexión a PostgreSQL |
| `ADMIN_PASSWORD` | Contraseña única del panel `/admin` |
| `SESSION_SECRET` | Firma la cookie de sesión; cambiarlo cierra todas las sesiones |

Generar un `SESSION_SECRET` nuevo:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. Instalar, migrar y levantar:

```bash
npm install
```

```bash
npm run db:migrate
```

```bash
npm run dev
```

La app queda en `http://localhost:3000` (el kiosco) y `http://localhost:3000/admin`
(el panel).

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | Chequeo de tipos sin emitir |
| `npm run lint` | ESLint |
| `npm run db:generate` | Genera el SQL de migración a partir de `src/db/schema.ts` |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:studio` | Explorador visual de la base |

Para cambiar el esquema: editar `src/db/schema.ts`, correr `db:generate` y después
`db:migrate`. El SQL generado queda versionado en `drizzle/`.

## Cómo está organizado

```
src/
  app/
    page.tsx                    Kiosco de recepción
    formulario-check-in.tsx     Formulario (client component)
    acciones.ts                 Server action que guarda el registro
    estado-check-in.ts          Tipos y estado inicial del formulario
    admin/
      page.tsx                  Tabla de registros, métricas y búsqueda
      acciones.ts               Login y cierre de sesión
      login/                    Pantalla de acceso
      exportar/route.ts         Descarga CSV
  db/
    schema.ts                   Definición de la tabla check_ins
    index.ts                    Cliente de Drizzle
  lib/
    auth.ts                     Sesión por cookie firmada
    validacion.ts               Esquema Zod del formulario
    consultas.ts                Búsqueda, paginado y métricas
    fechas.ts                   Formato de fechas y zona horaria
    paises.ts                   Lista de países
    limite-envios.ts            Freno anti-spam del formulario público
```

## Decisiones que conviene conocer

- **Las fechas de estadía son `date`, no `timestamp`**, y viajan como texto
  `YYYY-MM-DD`. Así el día que elige el huésped es exactamente el que se guarda,
  sin corrimientos por zona horaria entre la tablet y el servidor.
- **La zona horaria de la posada** está fija en `America/Montevideo`
  (`src/lib/fechas.ts`). Es lo que define qué es "hoy" en las métricas del panel.
- **El kiosco se limpia solo.** Después de un registro exitoso muestra el
  agradecimiento 12 segundos y vuelve a un formulario en blanco, para que el
  siguiente huésped no vea los datos del anterior.
- **Si la validación falla, no se pierde lo escrito.** El servidor devuelve los
  valores recibidos y el formulario los repone.
- **La sesión del panel dura 12 horas** y no hay tabla de sesiones: la cookie
  guarda su vencimiento firmado con HMAC.
- **El formulario público tiene un límite** de 10 envíos cada 10 minutos por IP.
  Es una ventana en memoria: si algún día la app se despliega en varias
  instancias, conviene reemplazarlo por algo compartido.

## Producción: Vercel + Supabase

La app se despliega en **Vercel** y la base vive en **Supabase**.

Supabase expone tres cadenas de conexión y **no sirve cualquiera**:

| Uso | Cadena | Puerto |
| --- | --- | --- |
| La app en Vercel | Transaction pooler (Supavisor) | `6543` |
| `npm run db:migrate` | Session pooler | `5432` |
| — | Direct connection | Sólo IPv6, evitarla |

El transaction pooler es el que aguanta que muchas instancias serverless se
conecten a la vez, pero no mantiene estado entre consultas, así que las
migraciones (que son DDL) van por el session pooler. La conexión directa
requiere IPv6, que muchas redes domésticas no tienen.

Correr las migraciones contra producción sin dejar la credencial en ningún
archivo (PowerShell):

```powershell
$env:DATABASE_URL="<session pooler, puerto 5432>"; npm run db:migrate
```

### Checklist

- [ ] Cambiar `ADMIN_PASSWORD` y generar un `SESSION_SECRET` nuevo.
- [ ] Correr las migraciones contra Supabase (session pooler).
- [ ] Cargar las tres variables en Vercel **antes** del primer deploy: el
      arranque valida `DATABASE_URL` y sin ella el build falla.
- [ ] Verificar que `DATABASE_URL` en Vercel use el puerto `6543`.
- [ ] Servir por HTTPS (la cookie de sesión usa `secure` en producción).
- [ ] Dejar la tablet de recepción con el navegador en modo kiosco apuntando a `/`.

Los registros de prueba están sólo en la base local, así que la de producción
arranca vacía. Para limpiar la local: `DELETE FROM check_ins;`
