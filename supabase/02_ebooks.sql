-- =====================================================================
-- Vértice Lab · Ebooks en el catálogo
-- Pegar completo en Supabase → SQL Editor → New query → Run.
-- Se puede ejecutar más de una vez sin romper nada.
-- =====================================================================

-- Dos datos nuevos por producto:
--   imagen       → portada que se muestra en la web
--   link_compra  → link de pago (por ejemplo el checkout de Hotmart).
--                  Si está vacío, el botón abre WhatsApp.
alter table public.productos add column if not exists imagen text;
alter table public.productos add column if not exists link_compra text;

insert into public.productos (slug, tipo, nombre, descripcion, archivo, imagen, orden)
values
  (
    'perro-feliz',
    'ebook',
    'Perro feliz, casa en calma',
    'Educá a tu perro sin gritos ni castigos: los 6 comandos esenciales paso a paso, paseo sin tirones, soluciones para saltos, ladridos y mordidas, un capítulo para cachorros y un plan de 21 días. 26 páginas.',
    'perro-feliz/Perro_feliz_casa_en_calma.pdf',
    '/ebooks/perro-feliz.webp',
    20
  ),
  (
    'kokedamas',
    'ebook',
    'El arte de las kokedamas',
    'Aprendé a crear y cuidar esferas vivas de musgo: materiales, sustrato, armado paso a paso, riego y solución de problemas. Incluye un capítulo bonus para venderlas. 22 páginas.',
    'kokedamas/El_arte_de_las_kokedamas.pdf',
    '/ebooks/kokedamas.webp',
    30
  )
on conflict (slug) do update set
  tipo = excluded.tipo,
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  archivo = excluded.archivo,
  imagen = excluded.imagen;

-- Para cargar el precio y el link de Hotmart más adelante:
-- update public.productos
--   set precio = 9900, link_compra = 'https://pay.hotmart.com/XXXXXX'
--   where slug = 'perro-feliz';
