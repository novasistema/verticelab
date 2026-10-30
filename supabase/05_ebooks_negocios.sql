-- =====================================================================
-- Vértice Lab · 7 ebooks de negocios
-- Pegar en Supabase → SQL Editor → New query → Run.
-- Requiere haber ejecutado antes 02_ebooks.sql. Se puede ejecutar más de una vez.
-- =====================================================================

insert into public.productos (slug, tipo, nombre, descripcion, precio, moneda, archivo, imagen, orden)
values
  ('proveedores', 'ebook', 'Proveedores sin secretos', 'Cómo encontrar, evaluar y negociar con fabricantes y mayoristas en Argentina: 7 fuentes de búsqueda, checklist anti estafas, cálculo del costo real y 15 plantillas de mensajes. 21 páginas.', 9, 'USD', 'proveedores/Proveedores_sin_secretos_Vertice_Lab.pdf', '/ebooks/proveedores.webp', 6),
  ('metodo-ventas', 'ebook', 'El Método Vértice', 'El sistema de 6 pasos para vender por internet: validar el producto, conocer al cliente, armar la oferta, optimizar el perfil, crear contenido y cerrar ventas por chat. Con plan de 30 días. 18 páginas.', 9, 'USD', 'metodo-ventas/El_Metodo_Vertice_Vertice_Lab.pdf', '/ebooks/metodo-ventas.webp', 7),
  ('meta-ads', 'ebook', 'Anuncios sin quemar plata', 'Meta Ads explicado simple: estructura de campañas, públicos, anuncios que frenan el scroll, presupuesto por fases y las 8 métricas para decidir con números. Con checklist antes de publicar. 16 páginas.', 9, 'USD', 'meta-ads/Anuncios_sin_quemar_plata_Vertice_Lab.pdf', '/ebooks/meta-ads.webp', 8),
  ('tienda-online', 'ebook', 'Tu tienda online en un fin de semana', 'Paso a paso para tener tu tienda propia en Tiendanube o Shopify: plataforma, diseño, fichas de producto, pagos, envíos, obligaciones legales en Argentina y lanzamiento. 16 páginas.', 9, 'USD', 'tienda-online/Tu_tienda_online_en_un_fin_de_semana_Vertice_Lab.pdf', '/ebooks/tienda-online.webp', 9),
  ('precio-justo', 'ebook', 'Precio justo', 'Guía + calculadora en Excel para fijar precios con números: margen vs. markup, costo total, ganancia real por canal, punto de equilibrio, descuentos, cuotas e inflación. 15 páginas.', 9, 'USD', 'precio-justo/Precio_Justo_Vertice_Lab.zip', '/ebooks/precio-justo.webp', 10),
  ('mensajes', 'ebook', 'Mensajes que cierran', '60 plantillas para WhatsApp e Instagram: bienvenida, precio, cierre, objeciones, pago, envío, postventa y recuperación de clientes. Listas para guardar como respuestas rápidas. 23 páginas.', 9, 'USD', 'mensajes/Mensajes_que_cierran_Vertice_Lab.pdf', '/ebooks/mensajes.webp', 11),
  ('ganchos', 'ebook', 'Primeros 3 segundos', '100 frases de apertura para reels, TikTok y anuncios, organizadas en 5 tipos (curiosidad, error, beneficio, prueba e historia), con ejemplos por rubro y fórmula para crear las tuyas. 17 páginas.', 9, 'USD', 'ganchos/Primeros_3_segundos_Vertice_Lab.pdf', '/ebooks/ganchos.webp', 12)
on conflict (slug) do update set
  tipo = excluded.tipo, nombre = excluded.nombre, descripcion = excluded.descripcion,
  precio = excluded.precio, moneda = excluded.moneda, archivo = excluded.archivo,
  imagen = excluded.imagen, orden = excluded.orden;

-- Cuando tengas cada link de Hotmart:
-- update public.productos set link_compra = 'https://pay.hotmart.com/XXXXXX' where slug = 'proveedores';
