# Activar el login de colaboradores (Supabase)

Mientras `js/config.js` esté vacío, el sistema está **apagado**:

- El enlace "Collaborator login" no aparece en el footer.
- En `/collaborators` el login está deshabilitado. Solo funciona el modo demo, que no guarda nada.
- `/work` muestra solo los 3 proyectos originales.

Se tarda unos 15 minutos. Supabase tiene plan gratis.

## 1. Crear el proyecto

1. Entra a <https://supabase.com>, crea una cuenta y luego un **New project**.
2. Guarda la contraseña de la base de datos en un lugar seguro. **No va en el sitio.**

## 2. Crear las tablas y la seguridad

1. Ve a **SQL Editor → New query**.
2. Pega todo el contenido de `supabase/schema.sql` y presiona **Run**.

Esto crea lo siguiente:

- La tabla `projects`. Cualquiera puede leer los proyectos publicados, y cada colaborador solo puede crear, editar o borrar los suyos.
- La lista `collaborators`. Es la lista de personas autorizadas, y solo tú la manejas.
- El bucket `thumbnails` para las miniaturas. Acepta JPG, PNG o WebP de hasta 5 MB, y cada colaborador solo sube a su propia carpeta.

## 3. Cerrar el registro público

**Authentication → Sign In / Providers**: desactiva **"Allow new users to sign up"**.

Así nadie puede crearse una cuenta por su cuenta. Solo entra quien tú agregues.

## 4. Crear al colaborador con la contraseña de prueba

1. Ve a **Authentication → Users → Add user → Create new user**.
2. Llena los campos:
   - **Email:** el correo del colaborador.
   - **Password:** `Cámara Raw`
   - Marca **Auto Confirm User**.
3. Vuelve a **SQL Editor** y corre esto, cambiando el correo:

   ```sql
   insert into public.collaborators (user_id, name)
   select id, 'Nombre' from auth.users where email = 'colaborador@correo.com';
   ```

La contraseña queda guardada **solo en Supabase**, cifrada. No aparece en ningún archivo del sitio. Como es una contraseña de demostración, cámbiala después desde **Users**.

## 5. Conectar el sitio

1. Ve a **Project Settings → API** y copia dos valores:
   - **Project URL**
   - La clave **anon public**
2. Pégalos en `js/config.js`:

   ```js
   export const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```

La clave *anon* está hecha para ser pública: solo permite lo que dejan las reglas del paso 2.
**Nunca pegues la clave `service_role`** ni contraseñas en `js/config.js`.

## 6. Probar en local

```bash
npx serve .
```

1. Abre `/collaborators` e inicia sesión.
2. Crea un proyecto y publícalo.
3. Abre `/work`: aparece después de los 3 originales.
4. Revisa la portada: "Selected Work" sigue igual.

## 7. Subir a Hostinger

Cuando todo funcione en local, sube la carpeta completa a `public_html`, incluyendo `collaborators/`.

No hace falta subir `supabase/` ni este archivo.
