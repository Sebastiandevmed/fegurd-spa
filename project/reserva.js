/* ══════════════════════════════════════════════════
   FEGURD SPA — Formulario de reserva
   Guarda en Supabase + dispara notificación por email
══════════════════════════════════════════════════ */

const CFG = window.FEGURD_CONFIG || {};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const form       = $('#reservaForm');
const submitBtn  = $('#submitBtn');
const successBox = $('#successBox');
const resetBtn   = $('#resetBtn');

/* ══════════════════════════════════════════════════
   VALIDACIÓN
══════════════════════════════════════════════════ */
const validators = {
  nombre: (v) => {
    if (!v || v.trim().length < 2) return 'Ingresa tu nombre completo.';
    if (v.trim().length > 100)     return 'Máximo 100 caracteres.';
    return null;
  },
  correo: (v) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!v || !re.test(v.trim())) return 'Ingresa un correo válido.';
    return null;
  },
  celular: (v) => {
    const digits = (v || '').replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15)
      return 'Ingresa un celular válido (7–15 dígitos).';
    return null;
  }
};

function setError(name, msg) {
  const field = $(`#${name}`)?.closest('.field');
  const errEl = $(`[data-err-for="${name}"]`);
  if (!field || !errEl) return;
  if (msg) {
    field.classList.add('has-error');
    errEl.textContent = msg;
  } else {
    field.classList.remove('has-error');
    errEl.textContent = '';
  }
}

/* Validación en tiempo real */
['nombre', 'correo', 'celular'].forEach(name => {
  const input = $(`#${name}`);
  if (!input) return;
  input.addEventListener('blur', () => {
    const err = validators[name](input.value);
    setError(name, err);
  });
  input.addEventListener('input', () => {
    if (input.closest('.field').classList.contains('has-error')) {
      const err = validators[name](input.value);
      setError(name, err);
    }
  });
});

/* Formateo del celular: "300 000 0000" */
const celInput = $('#celular');
celInput?.addEventListener('input', (e) => {
  let d = e.target.value.replace(/\D/g, '').slice(0, 10);
  if (d.length > 6)      d = `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
  else if (d.length > 3) d = `${d.slice(0,3)} ${d.slice(3)}`;
  e.target.value = d;
});

/* ══════════════════════════════════════════════════
   ENVÍO — Supabase REST + Edge Function
══════════════════════════════════════════════════ */
async function saveToSupabase(payload) {
  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) {
    throw new Error('Supabase no está configurado. Edita FEGURD_CONFIG en reserva.html');
  }

  const url = `${CFG.SUPABASE_URL}/rest/v1/${CFG.TABLE_NAME || 'reservas'}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey':        CFG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CFG.SUPABASE_ANON_KEY}`,
      'Prefer':        'return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Supabase error ${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}

async function triggerEmailNotification(payload) {
  if (!CFG.EDGE_FUNCTION_NAME) return; // opcional
  try {
    const url = `${CFG.SUPABASE_URL}/functions/v1/${CFG.EDGE_FUNCTION_NAME}`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CFG.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // No bloqueamos el éxito si la notificación falla
    console.warn('[Fegurd] No se pudo enviar notificación:', err);
  }
}

/* ══════════════════════════════════════════════════
   SUBMIT
══════════════════════════════════════════════════ */
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    nombre:  $('#nombre').value.trim(),
    correo:  $('#correo').value.trim().toLowerCase(),
    celular: $('#celular').value.trim()
  };

  // Validación final
  let hasError = false;
  Object.keys(validators).forEach(k => {
    const err = validators[k](data[k]);
    setError(k, err);
    if (err) hasError = true;
  });
  if (!$('#consent').checked) {
    alert('Debes aceptar las comunicaciones para continuar.');
    hasError = true;
  }
  if (hasError) {
    form.querySelector('.has-error input')?.focus();
    return;
  }

  // Payload enriquecido
  const payload = {
    nombre:  data.nombre,
    correo:  data.correo,
    celular: `+57 ${data.celular}`,
    origen:  'web',
    created_at: new Date().toISOString(),
    user_agent: navigator.userAgent.slice(0, 200)
  };

  submitBtn.classList.add('is-loading');
  submitBtn.disabled = true;

  try {
    const saved = await saveToSupabase(payload);
    // Disparamos email (no bloqueante)
    triggerEmailNotification(saved[0] || payload);

    // Éxito UI
    form.hidden = true;
    successBox.hidden = false;
    successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (err) {
    console.error('[Fegurd] Error al reservar:', err);
    alert(
      'Hubo un problema al enviar tu reserva.\n\n' +
      'Por favor escríbenos directamente a info@fegurdspa.com o ' +
      'vuelve a intentarlo en un momento.'
    );
  } finally {
    submitBtn.classList.remove('is-loading');
    submitBtn.disabled = false;
  }
});

/* Reset: permitir otra reserva */
resetBtn?.addEventListener('click', () => {
  form.reset();
  form.hidden = false;
  successBox.hidden = true;
  $('#consent').checked = true;
  $('#nombre').focus();
});
