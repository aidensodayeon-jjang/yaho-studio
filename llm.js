/**
 * Shared LLM JSON helper for YAHO STUDIO server endpoints.
 *
 * Primary: OpenAI (paid, no daily cap). Fallback: Gemini 2.5 Flash.
 * The whole reason the opportunity/product features felt broken is that they
 * ran on Gemini's free tier (20 req/day) and 429'd silently — routing them
 * through OpenAI first makes them reliable.
 *
 * OpenAI JSON mode always returns a top-level OBJECT. Callers that need an
 * array should ask the model for `{ "items": [...] }` and unwrap it.
 */

import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

export async function llmGenerateJson({
  system,
  user,
  openaiKey,
  geminiKey,
  model = 'gpt-4o-mini',
  temperature = 0.6,
}) {
  // ---- PRIMARY: OpenAI ----
  if (openaiKey) {
    try {
      const client = new OpenAI({ apiKey: openaiKey });
      const messages = [];
      if (system) messages.push({ role: 'system', content: system });
      messages.push({ role: 'user', content: user });
      const completion = await client.chat.completions.create({
        model,
        temperature,
        response_format: { type: 'json_object' },
        messages,
      });
      const raw = completion.choices?.[0]?.message?.content || '{}';
      return { data: JSON.parse(raw), provider: 'openai' };
    } catch (err) {
      // Fall through to Gemini only if we have a key; otherwise surface error.
      if (!geminiKey) throw err;
      console.log('[LLM] OpenAI failed, falling back to Gemini:', err?.message || err);
    }
  }

  // ---- FALLBACK: Gemini ----
  if (geminiKey) {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const contents = (system ? `${system}\n\n` : '') + user;
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents });
    const raw = res.text || '';
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    return { data: JSON.parse(clean), provider: 'gemini' };
  }

  throw new Error('LLM 키가 설정되어 있지 않습니다. (OPENAI_API_KEY 또는 GEMINI_API_KEY)');
}
