import { readBody, fail } from './_shared.js';

export const config = { maxDuration: 60 };

// Erlaubte Stimmen (OpenAI TTS)
const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');
  if (!process.env.OPENAI_API_KEY) {
    return fail(res, 500, 'OPENAI_API_KEY nicht gesetzt. Bitte in Vercel → Settings → Environment Variables hinterlegen.');
  }

  try {
    const body = await readBody(req);
    const { script } = body;
    const voice = VOICES.includes(body.voice) ? body.voice : 'nova';
    if (!script || typeof script !== 'string') return fail(res, 400, 'script required');
    if (script.length > 4000) return fail(res, 400, 'script too long (max 4000 chars)');

    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: script,
        voice,
        response_format: 'mp3',
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return fail(res, 502, 'OpenAI TTS failed: ' + errText.slice(0, 300));
    }

    const arrBuf = await r.arrayBuffer();
    const buf = Buffer.from(arrBuf);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(buf);
  } catch (err) {
    console.error('voice-tts error:', err);
    return fail(res, 500, err.message || 'Internal error');
  }
}
