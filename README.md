# 🎮 KOI Calendar

<div align="center">
  <img src="public/logokoi.svg" alt="KOI Logo" width="120" height="120">
  <h3>Calendario oficial de partidos del equipo KOI</h3>
  <p>Una aplicación web moderna para seguir todos los partidos y competiciones del equipo KOI en tiempo real</p>

[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

## 🌟 Características

- **📅 Calendario en Tiempo Real**: Datos extraídos directamente del Google
  Sheet oficial de KOI
- **🎮 Múltiples Juegos**: Soporte para League of Legends, Valorant, Rocket
  League, y más
- **🌍 Multiidioma**: Disponible en Español, Inglés y Francés
- **📱 Responsive**: Diseño adaptativo para móviles, tablets y escritorio
- **⚡ Rendimiento**: Optimizado con Next.js 15 y Turbopack
- **🔍 SEO Optimizado**: Meta tags, Open Graph, Twitter Cards y datos
  estructurados
- **🎨 UI Moderna**: Interfaz elegante con gradientes y efectos visuales
- **🔗 Enlaces Directos**: Acceso directo a streams de Twitch y YouTube

## 🚀 Demo

[Ver Demo en Vivo](https://koicalendar.nexuslegends.com)

## 🛠️ Tecnologías

- **Framework**: [Next.js 15](https://nextjs.org/) con App Router
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Internacionalización**: [next-intl](https://next-intl-docs.vercel.app/)
- **Iconos**: [Heroicons](https://heroicons.com/)
- **Deployment**: [Vercel](https://vercel.com/)

## 📋 Requisitos Previos

- Node.js 18.0 o superior
- npm, yarn, pnpm o bun

## ⚙️ Instalación

1. **Clona el repositorio**

   ```bash
   git clone https://github.com/drumst0ck/koi-calendar.git
   cd koi-calendar
   ```

2. **Instala las dependencias**

   ```bash
   npm install
   # o
   yarn install
   # o
   pnpm install
   ```

3. **Ejecuta el servidor de desarrollo**

   ```bash
   npm run dev
   # o
   yarn dev
   # o
   pnpm dev
   ```

4. **Abre tu navegador** Visita [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
koi-calendar/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   │   └── matches/       # Endpoint de partidos
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/            # Componentes reutilizables
│   └── LanguageSelector.tsx
├── i18n/                  # Configuración de internacionalización
│   └── request.ts
├── messages/              # Archivos de traducción
│   ├── en.json           # Inglés
│   ├── es.json           # Español
│   └── fr.json           # Francés
├── public/               # Archivos estáticos
│   ├── *.webp           # Imágenes de juegos
│   ├── manifest.json    # PWA Manifest
│   ├── robots.txt       # SEO
│   └── sitemap.xml      # SEO
└── next.config.js       # Configuración de Next.js
```

## 🌐 Internacionalización

La aplicación soporta múltiples idiomas:

- **🇪🇸 Español** (por defecto)
- **🇺🇸 Inglés**
- **🇫🇷 Francés**

### Agregar un Nuevo Idioma

1. Crea un archivo de traducción en `messages/[locale].json`
2. Agrega el locale a `i18n/request.ts`
3. Actualiza el componente `LanguageSelector.tsx`

## 🎮 Juegos Soportados

- League of Legends
- Valorant
- Teamfight Tactics
- Rocket League
- Apex Legends
- Call of Duty: Warzone
- Free Fire
- Pokémon
- FIFA
- Honor of Kings

## 📊 Fuente de Datos

Los datos se extraen en tiempo real del
[Google Sheet oficial de KOI](https://docs.google.com/spreadsheets/u/0/d/1i3ji5iDuACafqPPR0CPGI4ARk6Z2d853KeKcHef2Wto/htmlview?pli=1),
mantenido por [@aike0070](https://x.com/aike0070).

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Este es un proyecto de código abierto.

### Cómo Contribuir

1. **Fork el proyecto**
2. **Crea una rama para tu feature** (`git checkout -b feature/AmazingFeature`)
3. **Commit tus cambios** (`git commit -m 'Add some AmazingFeature'`)
4. **Push a la rama** (`git push origin feature/AmazingFeature`)
5. **Abre un Pull Request**

### Guías de Contribución

- Sigue las convenciones de código existentes
- Escribe mensajes de commit descriptivos
- Agrega tests si es necesario
- Actualiza la documentación si es relevante
- Asegúrate de que el código pase los linters

### Reportar Bugs

Si encuentras un bug, por favor
[abre un issue](https://github.com/drumst0ck/koi-calendar/issues) con:

- Descripción del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si es aplicable
- Información del navegador/dispositivo

## 📝 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Ejecutar ESLint
npm run type-check   # Verificar tipos de TypeScript
```

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio a [Vercel](https://vercel.com/)
2. Configura las variables de entorno si es necesario
3. Deploy automático en cada push a main

### Otros Proveedores

La aplicación es compatible con cualquier proveedor que soporte Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔧 Variables de Entorno

Para que la aplicación funcione correctamente, necesitas configurar la API key
de Google Sheets:

```env
# .env.local
GOOGLE_SHEETS_API_KEY=tu_api_key_de_google_sheets


### Obtener la API Key de Google Sheets

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Sheets
4. Ve a "Credenciales" y crea una nueva API Key
5. Restringe la API Key solo a la API de Google Sheets
6. Copia la API Key y agrégala a tu archivo `.env.local`

## 📈 SEO y Performance

- ✅ Meta tags optimizados
- ✅ Open Graph y Twitter Cards
- ✅ Datos estructurados (JSON-LD)
- ✅ Sitemap.xml
- ✅ Robots.txt
- ✅ PWA ready
- ✅ Optimización de imágenes
- ✅ Core Web Vitals optimizados

## 🐛 Problemas Conocidos

- Los datos dependen de la disponibilidad del Google Sheet
- Algunos streams pueden no estar disponibles en ciertas regiones

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para
más detalles.

## 🙏 Agradecimientos

- **[@aike0070](https://x.com/aike0070)** - Por crear y mantener el Google Sheet
  de datos

## 📞 Contacto

- **Desarrollador**: [drumst0ck](https://github.com/drumst0ck)
- **Proyecto**: [GitHub Repository](https://github.com/drumst0ck/koi-calendar)
- **Issues**: [GitHub Issues](https://github.com/drumst0ck/koi-calendar/issues)

---

<div align="center">
  <p>Hecho con ❤️ para la comunidad de KOI</p>
  <p>© 2025 KOI Calendar. Diseñado para la comunidad de KOI.</p>
</div>
```
