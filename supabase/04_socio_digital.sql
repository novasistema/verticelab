-- =====================================================================
-- Vértice Lab · Ebook "El Socio Digital"
-- Pegar en Supabase → SQL Editor → New query → Run.
-- Requiere haber ejecutado antes 02_ebooks.sql.
-- =====================================================================

insert into public.productos (slug, tipo, nombre, descripcion, precio, moneda, archivo, imagen, orden)
values (
  'socio-digital',
  'ebook',
  'El Socio Digital',
  '100 prompts listos para copiar en ChatGPT, Claude o Gemini y vender más: redes, anuncios, WhatsApp, objeciones, tienda online y precios. Incluye la Ficha del Negocio y un plan de 7 días. 47 páginas.',
  9,
  'USD',
  'socio-digital/El_Socio_Digital_Vertice_Lab.pdf',
  '/ebooks/socio-digital.webp',
  5
)
on conflict (slug) do update set
  tipo = excluded.tipo,
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  precio = excluded.precio,
  moneda = excluded.moneda,
  archivo = excluded.archivo,
  imagen = excluded.imagen,
  orden = excluded.orden;

-- Cuando tengas el link de pago de Hotmart:
-- update public.productos
--   set link_compra = 'https://pay.hotmart.com/XXXXXX'
--   where slug = 'socio-digital';
