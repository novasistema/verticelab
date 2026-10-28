# Vértice Lab

Plataforma de Vértice Lab: web pública, área de clientes y micro apps, todo en un solo proyecto.

| Ruta | Qué es |
| --- | --- |
| `/` | Web pública con el catálogo (lee la tabla `productos`) |
| `/ingresar` | Login de clientes (sin registro público) |
| `/restablecer` | Crear contraseña nueva desde el link del email |
| `/mis-apps` | Panel del cliente: sus apps y ebooks |
| `/apps/<slug>` | Cada micro app, solo con acceso vigente |
| `/api/gemini` | Función del servidor para IA (la clave nunca llega al navegador) |

## Puesta en marcha

1. **Supabase**: pegar `supabase/01_plataforma.sql` en SQL Editor y ejecutarlo.
2. **Supabase → Authentication → URL Configuration**:
   - Site URL: la dirección de la web (por ejemplo `https://verticelab.com.ar`).
   - Redirect URLs: agregar `https://verticelab.com.ar/restablecer` (y la dirección `.vercel.app` mientras no esté el dominio).
3. **Vercel**: crear el proyecto desde este repositorio (Framework: Vite) y cargar las variables de `.env.example`.
   - `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como **Config**.
   - `GEMINI_API_KEY` como **Secret**.

## Dar acceso a un cliente (manual, hasta automatizar el cobro)

1. Supabase → Authentication → Users → Add user (marcar **Auto Confirm User**).
2. SQL Editor:

```sql
insert into public.accesos (user_id, app_slug, estado, vence_el)
select id, 'midinero', 'activo', null   -- null = de por vida; o una fecha: now() + interval '30 days'
from auth.users
where email = 'cliente@email.com';
```

## Sumar una micro app nueva

1. Crear `src/apps/<slug>/App.tsx` que reciba `{ userEmail, onLogout }`.
2. Para guardar datos, usar `appStorage` (de `src/platform/cloudStore.ts`) en lugar de `localStorage`: se guarda solo en la nube, por usuario.
3. Registrarla en `src/apps/registry.ts`.
4. Cargar el producto en la tabla `productos` con el mismo `slug`.

## Sumar un ebook

1. Supabase → Storage → bucket `ebooks` → crear una carpeta con el slug y subir el PDF.
2. Cargar el producto en `productos` con `tipo = 'ebook'` y `archivo = '<slug>/<archivo>.pdf'`.

## Datos de contacto

Completar `src/platform/config.ts` (WhatsApp, email, Instagram).
