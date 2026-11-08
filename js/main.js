(() => {
  'use strict';

  const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const $ = (sel) => document.querySelector(sel);

  /* ---------- Utilidades de horas ---------- */
  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const formatTime = (minutes) => {
    const h24 = Math.floor(minutes / 60);
    const m = String(minutes % 60).padStart(2, '0');
    const suffix = h24 < 12 ? 'a. m.' : 'p. m.';
    const h12 = h24 % 12 || 12;
    return `${h12}:${m} ${suffix}`;
  };

  const formatPrice = (value) => `$${value}`;

  const toISODate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseISODate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  /** Día y minuto actuales en la zona horaria del negocio. */
  const nowInBusinessTZ = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS.timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
  };

  /* ---------- Render de contenido ---------- */
  function renderServices() {
    const list = $('#servicesList');
    list.innerHTML = BUSINESS.services.map((s) => `
      <article class="service reveal${s.featured ? ' is-featured' : ''}">
        ${s.featured ? '<span class="tag">Más pedido</span>' : ''}
        <div class="service-top">
          <h3>${s.name}</h3>
          <span class="price">${formatPrice(s.price)}</span>
        </div>
        <p>${s.desc}</p>
        <div class="service-bottom">
          <span class="duration"><svg class="icon"><use href="#i-clock"/></svg>${s.minutes} min</span>
          <a href="#reservar" class="link" data-service="${s.id}">Reservar →</a>
        </div>
      </article>`).join('');

    // "Reservar →" deja el servicio elegido en el formulario
    list.addEventListener('click', (e) => {
      const link = e.target.closest('[data-service]');
      if (!link) return;
      $('#service').value = link.dataset.service;
      $('#service').dispatchEvent(new Event('change'));
    });
  }

  function renderTeam() {
    $('#teamList').innerHTML = BUSINESS.barbers
      .filter((b) => b.id !== 'any')
      .map((b) => `
        <article class="member reveal">
          <div class="avatar" aria-hidden="true">${b.name.charAt(0)}</div>
          <h3>${b.name}</h3>
          <p>${b.role}</p>
          <span class="years">${b.years} años de experiencia</span>
        </article>`).join('');
  }

  function renderReviews() {
    const star = '<svg class="icon"><use href="#i-star"/></svg>';
    $('#reviewsList').innerHTML = BUSINESS.reviews.map((r) => `
      <figure class="review reveal">
        <div class="stars" aria-label="${r.stars} de 5 estrellas">${star.repeat(r.stars)}</div>
        <blockquote>“${r.text}”</blockquote>
        <figcaption>${r.name}</figcaption>
      </figure>`).join('');
  }

  function renderHours() {
    const today = nowInBusinessTZ().day;
    $('#hoursTable tbody').innerHTML = WEEK_ORDER.map((day) => {
      const h = BUSINESS.hours[day];
      const value = h ? `${formatTime(toMinutes(h.open))} – ${formatTime(toMinutes(h.close))}` : 'Cerrado';
      return `<tr class="${day === today ? 'is-today' : ''}${h ? '' : ' is-closed'}">
        <th scope="row">${DAY_NAMES[day]}${day === today ? ' <span class="today">hoy</span>' : ''}</th>
        <td>${value}</td>
      </tr>`;
    }).join('');
  }

  /* ---------- "Abierto ahora" ---------- */
  function renderOpenStatus() {
    const el = $('#openStatus');
    const { day, minutes } = nowInBusinessTZ();
    const today = BUSINESS.hours[day];

    if (today && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
      el.classList.add('is-open');
      el.querySelector('.open-text').textContent = `Abierto ahora · cierra a las ${formatTime(toMinutes(today.close))}`;
      return;
    }

    // Buscar la próxima apertura (hoy más tarde o en los días siguientes)
    for (let offset = 0; offset < 7; offset++) {
      const d = (day + offset) % 7;
      const h = BUSINESS.hours[d];
      if (!h) continue;
      if (offset === 0 && minutes >= toMinutes(h.open)) continue;
      const when = offset === 0 ? 'hoy' : offset === 1 ? 'mañana' : `el ${DAY_NAMES[d].toLowerCase()}`;
      el.classList.remove('is-open');
      el.querySelector('.open-text').textContent = `Cerrado · abre ${when} a las ${formatTime(toMinutes(h.open))}`;
      return;
    }
  }

  /* ---------- Reservas ---------- */
  const form = $('#bookingForm');
  const fields = {
    name: $('#name'),
    phone: $('#phone'),
    service: $('#service'),
    barber: $('#barber'),
    date: $('#date'),
    time: $('#time'),
  };

  const getService = () => BUSINESS.services.find((s) => s.id === fields.service.value);

  /**
   * Simula horas ya ocupadas de forma estable (misma fecha y barbero
   * → mismas horas ocupadas), para que la demo se sienta real.
   */
  const isTaken = (dateISO, barberId, minutes) => {
    const key = `${dateISO}|${barberId}|${minutes}`;
    let hash = 0;
    for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return hash % 4 === 0;
  };

  function setError(name, message) {
    const p = form.querySelector(`.error[data-for="${name}"]`);
    if (p) p.textContent = message || '';
    fields[name].setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function fillSelects() {
    fields.service.innerHTML = '<option value="">Elige un servicio</option>' +
      BUSINESS.services.map((s) => `<option value="${s.id}">${s.name} · ${formatPrice(s.price)}</option>`).join('');
    fields.barber.innerHTML = BUSINESS.barbers
      .map((b) => `<option value="${b.id}">${b.name}</option>`).join('');

    const today = new Date();
    const max = new Date();
    max.setDate(today.getDate() + 30);
    fields.date.min = toISODate(today);
    fields.date.max = toISODate(max);
  }

  function updateTimeSlots() {
    const time = fields.time;
    time.innerHTML = '';
    time.disabled = true;
    setError('date', '');

    if (!fields.date.value) {
      time.innerHTML = '<option value="">Primero elige una fecha</option>';
      return;
    }

    const date = parseISODate(fields.date.value);
    const hours = BUSINESS.hours[date.getDay()];
    if (!hours) {
      setError('date', `Los ${DAY_NAMES[date.getDay()].toLowerCase()}s estamos cerrados. Elige otro día.`);
      time.innerHTML = '<option value="">Día cerrado</option>';
      return;
    }

    const duration = getService()?.minutes ?? BUSINESS.slotMinutes;
    const isToday = fields.date.value === toISODate(new Date());
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const slots = [];
    for (let m = toMinutes(hours.open); m + duration <= toMinutes(hours.close); m += BUSINESS.slotMinutes) {
      if (isToday && m <= nowMinutes + 30) continue; // al menos 30 min de anticipación
      slots.push({ minutes: m, taken: isTaken(fields.date.value, fields.barber.value, m) });
    }

    if (!slots.some((s) => !s.taken)) {
      time.innerHTML = '<option value="">No quedan horas este día</option>';
      return;
    }

    time.innerHTML = '<option value="">Elige una hora</option>' + slots.map((s) =>
      `<option value="${s.minutes}"${s.taken ? ' disabled' : ''}>${formatTime(s.minutes)}${s.taken ? ' · ocupado' : ''}</option>`
    ).join('');
    time.disabled = false;
  }

  function updateSummary() {
    const service = getService();
    $('#summaryTotal').textContent = service ? `${formatPrice(service.price)} · ${service.minutes} min` : '—';
  }

  function validate() {
    let ok = true;
    const check = (name, condition, message) => {
      setError(name, condition ? '' : message);
      if (!condition) ok = false;
    };
    const digits = fields.phone.value.replace(/\D/g, '');

    check('name', fields.name.value.trim().length >= 2, 'Escribe tu nombre.');
    check('phone', digits.length >= 10 && digits.length <= 12, 'Escribe un teléfono válido, por ejemplo 0412-000-0000.');
    check('service', !!fields.service.value, 'Elige un servicio.');
    if (!fields.date.value) check('date', false, 'Elige una fecha.');
    else if (!BUSINESS.hours[parseISODate(fields.date.value).getDay()]) ok = false;
    check('time', !!fields.time.value, 'Elige una hora disponible.');
    return ok;
  }

  function initBooking() {
    fillSelects();
    fields.service.addEventListener('change', () => { updateSummary(); updateTimeSlots(); setError('service', ''); });
    fields.barber.addEventListener('change', updateTimeSlots);
    fields.date.addEventListener('change', updateTimeSlots);
    fields.time.addEventListener('change', () => setError('time', ''));
    fields.name.addEventListener('input', () => setError('name', ''));
    fields.phone.addEventListener('input', () => setError('phone', ''));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) {
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }

      const service = getService();
      const barber = BUSINESS.barbers.find((b) => b.id === fields.barber.value);
      const date = parseISODate(fields.date.value)
        .toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
      const withBarber = barber.id === 'any' ? '' : ` con ${barber.name}`;

      $('#modalText').textContent =
        `Gracias, ${fields.name.value.trim()}. Te esperamos el ${date} a las ` +
        `${formatTime(Number(fields.time.value))} para ${service.name.toLowerCase()}${withBarber}.`;

      const modal = $('#confirmModal');
      if (typeof modal.showModal === 'function') modal.showModal();
      else alert($('#modalText').textContent);

      form.reset();
      updateSummary();
      updateTimeSlots();
    });
  }

  /* ---------- Navegación y animaciones ---------- */
  function initNav() {
    const header = $('#header');
    const nav = $('#nav');
    const btn = $('#menuBtn');

    const setMenu = (open) => {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    btn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Inicio ---------- */
  renderServices();
  renderTeam();
  renderReviews();
  renderHours();
  renderOpenStatus();
  setInterval(renderOpenStatus, 60_000);
  initBooking();
  initNav();
  initReveal(); // al final: incluye los elementos generados arriba
})();
