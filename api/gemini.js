// Función del servidor (Vercel): /api/gemini
// La clave de Gemini vive solo acá, nunca en el navegador.
// Antes de llamar a Gemini verifica la sesión del usuario y que tenga
// acceso vigente a la app que hace el pedido.

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const MAX_PROMPT = 2000;
const MAX_IMAGE_BASE64 = 6_000_000; // ~4,5 MB de imagen

// Instrucciones de cada app que usa IA. Para sumar una app, agregarla acá.
const APPS_IA = {
  midinero: `Eres un asistente de finanzas personales para la app Mi Dinero de Vértice Lab (Argentina).
Analiza el texto o ticket recibido y responde ÚNICAMENTE con un objeto JSON válido con los campos:
{
  "type": "ingreso" o "gasto",
  "amount": número positivo,
  "categoryId": una de ["comida", "supermercado", "salud", "farmacia", "impuestos", "ocio", "transporte", "vivienda", "salario", "inversiones", "servicios", "otros"],
  "description": resumen breve del concepto,
  "paymentMethod": una de ["efectivo", "tarjeta", "transferencia", "bizum"],
  "notes": detalle adicional opcional
}`,
};

function vigente(a) {
  if (a.estado !== 'activo') return false;
  if (!a.vence_el) return true;
  return new Date(a.vence_el).getTime() > Date.now();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !GEMINI_API_KEY) {
    return res.status(500).json({ error: 'El servidor no está configurado.' });
  }

  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Falta la sesión.' });
  }
  const token = auth.slice(7).trim();

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const app = typeof body.app === 'string' ? body.app : '';
  const instrucciones = APPS_IA[app];
  if (!instrucciones) {
    return res.status(400).json({ error: 'App no válida.' });
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, MAX_PROMPT) : '';
  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
  if (!prompt && !imageBase64) {
    return res.status(400).json({ error: 'Falta el texto o la imagen.' });
  }
  if (imageBase64.length > MAX_IMAGE_BASE64) {
    return res.status(413).json({ error: 'La imagen es demasiado grande.' });
  }

  // Cliente de Supabase que actúa COMO el usuario: las reglas de seguridad
  // (RLS) se aplican con su sesión, así solo ve sus propios accesos.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  }

  const { data: accesos, error: accesosError } = await supabase
    .from('accesos')
    .select('estado, vence_el')
    .eq('user_id', userData.user.id)
    .eq('app_slug', app);

  if (accesosError || !accesos || !accesos.some(vigente)) {
    return res.status(403).json({ error: 'No tenés acceso vigente a esta app.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const contents = [];
    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/(?:jpeg|png|webp));base64,/);
      contents.push({
        inlineData: {
          mimeType: match ? match[1] : 'image/jpeg',
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }
    contents.push({ text: prompt || 'Analiza el ticket adjunto y extrae los datos en JSON.' });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: { systemInstruction: instrucciones, responseMimeType: 'application/json' },
    });

    let data;
    try {
      data = JSON.parse(response.text || '{}');
    } catch {
      data = {};
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error de Gemini:', error);
    return res.status(502).json({ error: 'No pudimos procesar el pedido con IA. Probá de nuevo.' });
  }
}
