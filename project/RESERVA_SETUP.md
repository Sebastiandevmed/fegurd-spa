# Fegurd Spa — Formulario de Reserva

Formulario web listo para subir a Hostinger, conectado a Supabase con
notificación por email automática.

---

## 📦 Archivos que debes subir a Hostinger

Sube TODOS estos a la raíz de tu sitio (public_html/):

```
reserva.html        ← la página del formulario
reserva.css         ← estilos
reserva.js          ← lógica + conexión Supabase
assets/img/logo.png ← logo (ya existe)
```

Accesible en: `https://tudominio.com/reserva.html`

---

## 1️⃣ Configurar Supabase (5 minutos)

### a) Crear tabla `reservas`

En Supabase → **SQL Editor** → New query, pega y ejecuta:

```sql
create table public.reservas (
  id bigserial primary key,
  nombre text not null,
  correo text not null,
  celular text not null,
  origen text default 'web',
  user_agent text,
  created_at timestamptz default now()
);

-- Permitir INSERT anónimo (desde el formulario público)
alter table public.reservas enable row level security;

create policy "anon_insert_reservas"
  on public.reservas
  for insert
  to anon
  with check (true);
```

### b) Copiar credenciales

Supabase → **Settings → API** → copia:
- **Project URL**
- **anon public key**

### c) Pegarlas en `reserva.html`

Busca el bloque `FEGURD_CONFIG` y reemplaza:

```js
window.FEGURD_CONFIG = {
  SUPABASE_URL:      'https://xxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...tu-anon-key',
  TABLE_NAME:        'reservas',
  EDGE_FUNCTION_NAME:'notify-reserva'
};
```

---

## 2️⃣ Notificación por email automática (Edge Function)

### a) Crear cuenta en Resend (gratis, 100 emails/día)

https://resend.com → copia tu API key.

### b) Crear Edge Function en Supabase

Supabase → **Edge Functions → Create a new function** → nómbrala
`notify-reserva` y pega este código:

```ts
// supabase/functions/notify-reserva/index.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;
const TO_EMAIL   = Deno.env.get("NOTIFY_TO") || "info@fegurdspa.com";
const FROM_EMAIL = "Fegurd Spa <no-reply@tudominio.com>";

Deno.serve(async (req) => {
  const { nombre, correo, celular } = await req.json();

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;
                background:#1f0f2b;color:#faf3e7;padding:32px;border-radius:16px">
      <h2 style="color:#e4b982;margin:0 0 16px">✦ Nueva reserva — Fegurd Spa</h2>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Correo:</strong> ${correo}</p>
      <p><strong>Celular:</strong> ${celular}</p>
      <p style="color:#c9b9d1;margin-top:24px">
        Contáctalo(a) en menos de 24 h para confirmar.
      </p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to:   TO_EMAIL,
      subject: `Nueva reserva: ${nombre}`,
      html,
    }),
  });

  return new Response(JSON.stringify({ ok: res.ok }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### c) Configurar secretos

Supabase → **Edge Functions → notify-reserva → Secrets**:
- `RESEND_API_KEY` = tu key de Resend
- `NOTIFY_TO` = correo donde quieres recibir avisos (ej. info@fegurdspa.com)

### d) Verificar dominio en Resend (opcional pero recomendado)

Resend → **Domains** → agrega `tudominio.com` y sigue los pasos DNS.
Mientras tanto, puedes usar `onboarding@resend.dev` como `FROM_EMAIL`
para pruebas.

---

## 3️⃣ Subir a Hostinger

1. Entra a **File Manager** en Hostinger
2. Navega a `public_html/`
3. Sube: `reserva.html`, `reserva.css`, `reserva.js` y la carpeta `assets/`
4. Visita `https://tudominio.com/reserva.html` y prueba

---

## ✅ Probar

1. Llena el formulario y envía
2. Supabase → **Table Editor → reservas** → debería aparecer el registro
3. Tu bandeja de entrada → debería llegar el email

---

## 🔒 Seguridad

- La `anon key` es segura de exponer en el frontend (así se diseñó Supabase)
- RLS está activo: solo permite INSERT, no lectura pública
- La notificación por email pasa por la Edge Function (no desde el browser)

---

## 🛟 Si algo falla

- Abre DevTools → Console → busca `[Fegurd]` para ver el error
- Verifica que las 3 credenciales en `reserva.html` estén bien
- Verifica que la política RLS de INSERT esté creada
