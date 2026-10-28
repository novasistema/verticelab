// Configuración general de Vértice Lab.
// Completá estos datos y se actualizan en toda la web.

export const BRAND = {
  nombre: 'Vértice Lab',
  lema: 'Herramientas que resuelven. Conocimiento que se aplica.',
  // Número de WhatsApp con código de país, sin espacios ni signos. Ej: '5493584000000'
  whatsapp: '',
  email: '',
  instagram: '',
  garantiaDias: 7,
};

export function whatsappLink(mensaje: string): string | null {
  if (!BRAND.whatsapp) return null;
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
