# DURO XXL · Festival Companion

Webapp personal para DURO XXL, 10–11 de octubre de 2026, Montmeló. Diseñada para móvil con estética industrial, fondo monocromo y colores por escenario: lima, cian y violeta.

## Ejecutar el proyecto

Requiere Node.js 24 o posterior y pnpm.

```sh
npm install -g pnpm
pnpm install
pnpm dev
```

Abre la dirección que muestre Vite. Para comprobar y generar la versión de producción:

```sh
pnpm test
pnpm build
pnpm preview
```

## Las tres vistas

- **Inicio:** cuenta atrás antes del festival; actuaciones actuales, barras de tiempo transcurrido y minutos restantes durante el directo; siguientes actuaciones y próximo favorito. Contempla la pausa entre jornadas y el final del festival.
- **Favoritos:** los 17 favoritos precargados, separados por día, con estado temporal y todos los solapes entre escenarios, incluidos los parciales. Cada coincidencia indica la duración del tramo compartido. No hay selección manual.

- **Lineup:** las 55 actuaciones, separadas por día y escenario, con filtro de escenario y favoritos identificados. El domingo, Black Hangar se identifica también como Laster.

La versión 0.2.0 añade JAZZY, KRUELTY, TOXIC MACHINERY y DJ SISU b2b XAVISTYLE. ANDRÉS CAMPO b2b FUTURE.666 conserva su actuación con la etiqueta «A escucharlo al Bershka🎀»: no es favorito, no aparece en la agenda de favoritos ni en sus solapes y no crea una categoría nueva.

Los botones de próximas actuaciones abren el día y escenario correspondientes en Lineup y destacan la actuación.

## Datos y reloj

El dataset maestro está en `src/data/festival.ts`. Transcribe el horario corregido aportado por el usuario; no se ha contrastado con la organización. Para cambiar horarios, edita las entradas `[inicio, fin, artista]` del escenario correspondiente. Para cambiar la agenda, edita `favoriteArtists`. El Pyro Show es un evento separado que empieza el domingo a las **21:15**, según la confirmación del usuario. Aparece en Lineup y como aviso en Inicio desde 30 minutos antes, con cuenta atrás, y durante el minuto de inicio. No se asigna una hora de fin ni un escenario, porque no se han indicado.

Todos los horarios son de **Europe/Madrid**. Las fechas del festival llevan explícitamente el offset CEST `+02:00`, por lo que funcionan aunque el teléfono esté en otra zona horaria. Las actuaciones tienen intervalos `[inicio, fin)`: a las 19:00 termina una y empieza la siguiente. El reloj se actualiza cada segundo y se sincroniza al volver a la pestaña. Depende de que la fecha y hora del dispositivo sean correctas; no necesita backend.

## Probar otros momentos

Por defecto siempre se usa la hora real. El parámetro opcional `at` inicia un reloj simulado que continúa avanzando y muestra una banda visible de vista previa:

- Sábado, 18:47: `http://localhost:5173/?at=2026-10-10T18:47:00%2B02:00`
- Domingo, 17:00: `http://localhost:5173/?at=2026-10-11T17:00:00%2B02:00`
- Entre jornadas: `http://localhost:5173/?at=2026-10-10T23:00:00%2B02:00`
- Festival terminado: `http://localhost:5173/?at=2026-10-11T23:00:00%2B02:00`

La banda permite volver a la hora real. Las tres vistas usan hashes (`#inicio`, `#favoritos`, `#lineup`), admiten recarga directa y los botones de atrás/adelante del navegador.

## GitHub y Vercel

El código está en [lucasjimenezjob/duro-xxl-web-lucas](https://github.com/lucasjimenezjob/duro-xxl-web-lucas), conectado a la rama `main` de esta carpeta. Incluye `pnpm-lock.yaml`, `.gitignore` y `vercel.json`. La app todavía está pendiente de publicar en Vercel.

Al importar el repositorio en Vercel:

- Framework: **Vite**.
- Comando de instalación: `pnpm install --frozen-lockfile`.
- Comando de build: `pnpm build`.
- Carpeta de salida: `dist`.
- Node.js: 24.x recomendado.
- No requiere variables de entorno, base de datos ni claves API.

Referencia: [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite).

La aplicación es personal y tiene `noindex`, pero no incluye autenticación: quien conozca la URL podrá abrirla. Para limitar el acceso, configura la protección del despliegue en Vercel cuando la publiques.

## Estructura

```text
src/
  App.tsx             Vistas, navegación y reloj
  styles.css          Diseño responsive y accesibilidad
  data/festival.ts    Horario, escenarios, favoritos y evento especial
  lib/time.ts         Estados, progreso, próximos y conflictos
tests/time.test.ts    Pruebas de datos y límites horarios
public/images/        Fondo del festival
```

Tecnologías: React, TypeScript, Vite, Lucide. Las fuentes se sirven localmente, sin peticiones a Google Fonts. No hay analítica ni llamadas a servicios externos en la app.

La portada `public/images/group-cover.webp` es la imagen del grupo aportada por el usuario, comprimida en WebP para reducir la descarga en móvil. Conserva la composición completa, el logotipo impreso y la dedicatoria, sin añadir otro logotipo encima. La fecha, el reloj y el estado del festival aparecen en una franja independiente debajo de la foto.
