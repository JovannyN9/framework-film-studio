# FRAMEWORK — Film Studio website

Sitio estático: HTML + CSS + JavaScript (React con módulos ES). No necesita build ni `npm install`.

## Correr en local

```bash
npx serve .
```

Abre la dirección que aparece (por ejemplo `http://localhost:3000`).
No abras `index.html` con doble clic: los módulos de JavaScript y el video necesitan un servidor.

## Estructura

```
framework-web/
├── index.html              Página principal (carga CSS, librerías y js/main.js)
├── work/
│   └── index.html          Página /work (carga js/work.js)
├── collaborators/
│   └── index.html          Login y panel de colaboradores (apagado hasta configurar Supabase)
├── supabase/
│   └── schema.sql          Tablas, reglas de seguridad (RLS) y almacenamiento de miniaturas
├── SETUP-SUPABASE.md       Pasos para activar el login y la publicación
├── css/
│   └── styles.css          Todos los estilos (colores y fuentes al inicio, en :root)
├── js/
│   ├── main.js             Entrada de la página principal
│   ├── work.js             Entrada de /work
│   ├── collab.js           Entrada de /collaborators
│   ├── site.js             Rutas entre páginas y transición de cortina
│   ├── config.js           URL y clave pública de Supabase (vacías = sistema apagado)
│   ├── backend.js          Todo el acceso a Supabase (login, proyectos, miniaturas)
│   ├── demoStore.js        Modo demo: login y proyectos guardados en este navegador
│   ├── projects.js         Validación, enlaces de YouTube y miniaturas
│   ├── data.js             Textos del hero, frase de la visión y rutas de video/imágenes
│   ├── lib.js              Utilidades compartidas: easing, loop de scroll, reveal, scroll suave
│   └── components/
│       ├── Nav.js          Menú superior
│       ├── Intro.js        Sección 1: portada con la foto del estudio
│       ├── VideoReel.js    Sección 2: video controlado por scroll + 3 frases
│       ├── Vision.js       "01 / Our Vision" palabra por palabra
│       ├── Work.js         Galería "02 / Selected Work" (cada foto abre su video)
│       ├── FilmModal.js    Reproductor de YouTube a pantalla completa
│       ├── WorkIndex.js    Cuadrícula de proyectos de /work (originales + publicados)
│       ├── Collab.js       Login, lista de proyectos y editor con vista previa
│       ├── Sequence.js     Secuencia de 3 imágenes a pantalla completa
│       ├── Approach.js     "03 / Our Approach"
│       └── Footer.js       Cierre, contacto y back-to-top
└── media/
    ├── hero.mp4            Video de computadora (cada cuadro es keyframe para el scroll)
    ├── hero-mobile.mp4     Video vertical para celular (≤ 767px)
    ├── studio-*.webp/.jpg  Foto de portada en 3 tamaños (WebP + JPG)
    ├── poster*.jpg/.webp   Imagen mientras carga el video
    ├── work-01..03.jpg     Galería
    ├── seq-01..03.jpg      Secuencia: versión vertical (celular)
    └── seq-0*-wide.*       Secuencia: versión horizontal 16:9 (tablet y computadora)
```

## Cambios comunes

- **Textos de la galería o de la secuencia:** los proyectos están en `PROJECTS` dentro de `js/data.js`; la secuencia está en `js/components/Sequence.js` (`SEQ`, `SEQ_COPY`).
- **Agregar un proyecto:** añade un objeto a `PROJECTS` en `js/data.js` (título, imagen en `media/`, ID de YouTube en `yt`). Aparece solo en /work; con `featured: true` también en la portada (se muestran los 3 primeros).
- **Correo y redes:** `js/components/Footer.js`.
- **Colores y tipografías:** variables en `:root` al inicio de `css/styles.css`.

## Colaboradores

**Modo demo (activo ahora):** entra a `/collaborators` con cualquier correo y la contraseña `Cámara Raw`.
Los proyectos se guardan **solo en ese navegador**: sirve para enseñarlo, no para colaboradores reales.
Para borrar los datos de prueba: cierra sesión y borra los datos del sitio en el navegador.

**Modo real:** sigue `SETUP-SUPABASE.md`. Al poner las claves en `js/config.js`, el modo demo se apaga solo.
Para quitar el demo sin Supabase: `DEMO_MODE = false` en `js/config.js`.

## Publicar en Hostinger

Sube todo el contenido de esta carpeta a `public_html` (con `index.html` en la raíz).
