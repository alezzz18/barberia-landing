/**
 * Datos del negocio. Para adaptar la landing a otra barbería
 * basta con editar este archivo: el HTML se genera a partir de aquí.
 */
const BUSINESS = {
  timezone: 'America/Caracas',
  currency: 'USD',
  slotMinutes: 30,

  // 0 = domingo … 6 = sábado. null = cerrado.
  hours: {
    1: { open: '09:00', close: '19:00' },
    2: { open: '09:00', close: '19:00' },
    3: { open: '09:00', close: '19:00' },
    4: { open: '09:00', close: '19:00' },
    5: { open: '09:00', close: '20:00' },
    6: { open: '09:00', close: '17:00' },
    0: null,
  },

  services: [
    { id: 'corte',   name: 'Corte clásico',        price: 8,  minutes: 30, desc: 'Tijera y máquina, lavado y peinado.' },
    { id: 'fade',    name: 'Fade / degradado',     price: 10, minutes: 45, desc: 'Degradado a piel o bajo, con acabado a navaja.' },
    { id: 'barba',   name: 'Arreglo de barba',     price: 6,  minutes: 30, desc: 'Perfilado, toalla caliente y aceite.' },
    { id: 'combo',   name: 'Corte + barba',        price: 14, minutes: 60, desc: 'El servicio completo, con toalla caliente.', featured: true },
    { id: 'diseno',  name: 'Diseño y perfilado',   price: 4,  minutes: 15, desc: 'Líneas, cejas o diseño a mano alzada.' },
    { id: 'tratam',  name: 'Tratamiento capilar',  price: 12, minutes: 45, desc: 'Limpieza, hidratación y masaje.' },
  ],

  barbers: [
    { id: 'any',   name: 'Sin preferencia' },
    { id: 'luis',  name: 'Luis',   role: 'Fundador · fades y navaja',   years: 12 },
    { id: 'andre', name: 'Andrés', role: 'Barbas y estilos clásicos',   years: 7 },
    { id: 'gabo',  name: 'Gabriel', role: 'Diseños y tendencias',       years: 4 },
  ],

  reviews: [
    { name: 'Carlos M.',  stars: 5, text: 'El mejor fade que me han hecho. Puntuales y muy limpios.' },
    { name: 'José R.',    stars: 5, text: 'Reservé desde el teléfono en un minuto y me atendieron a mi hora.' },
    { name: 'Daniel P.',  stars: 4, text: 'Buen ambiente y el arreglo de barba con toalla caliente vale la pena.' },
  ],
};
