-- =====================================================================
-- Vértice Lab · Tres ebooks nuevos en el catálogo
-- Pegar en Supabase → SQL Editor → New query → Run.
-- Requiere haber ejecutado antes 02_ebooks.sql.
-- =====================================================================

insert into public.productos (slug, tipo, nombre, descripcion, archivo, imagen, orden)
values
  (
    'tu-plata',
    'ebook',
    'Tu plata en orden',
    'El plan de 30 días para saber a dónde va tu dinero, armar un presupuesto simple, salir de las deudas y empezar tu fondo de emergencia. 18 páginas.',
    'tu-plata/Tu_plata_en_orden.pdf',
    '/ebooks/tu-plata.webp',
    15
  ),
  (
    'huevo',
    'ebook',
    'El poder del huevo',
    '30 recetas ricas, rápidas y económicas para sumar proteína a tu día: desayunos, almuerzos, viandas y postres, con técnicas básicas y plan semanal. 21 páginas.',
    'huevo/El_poder_del_huevo.pdf',
    '/ebooks/huevo.webp',
    40
  ),
  (
    'velas',
    'ebook',
    'Velas aromáticas',
    'Aprendé a hacer velas aromáticas paso a paso, de forma segura: ceras, mechas, aromas, solución de problemas y cómo venderlas. 18 páginas.',
    'velas/Velas_aromaticas.pdf',
    '/ebooks/velas.webp',
    50
  )
on conflict (slug) do update set
  tipo = excluded.tipo,
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  archivo = excluded.archivo,
  imagen = excluded.imagen;
