import OpenAI from 'openai';
import { NextRequest } from 'next/server';

let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

const STYLE_PROMPTS: Record<string, string> = {
  literary:       'Rewrite in a lyrical, observational literary style — rich imagery, layered prose, and a slow, contemplative rhythm.',
  creative:       'Rewrite with playful imagery and unexpected turns — keep it fresh and surprising while retaining the core meaning.',
  minimalist:     'Rewrite in a stark minimalist style — cut to the bone, very few words, generous white space between thoughts.',
  journalistic:   'Rewrite in a clear, factual journalistic style — precise, on the record, no embellishment.',
  academic:       'Rewrite in a formal academic register — precise vocabulary, structured sentences, authoritative tone.',
  poetic:         'Rewrite as lyric prose — use rhythm, consider line breaks, let the breath of each phrase matter.',
  conversational: 'Rewrite as if talking to a close friend — warm, natural, direct, no pretension.',
  noir:           'Rewrite in a hard-boiled noir style — terse, shadowy, world-weary, short punchy sentences.',
  whimsical:      'Rewrite with a light, whimsical fairy-tale quality — curious, gentle, slightly magical.',
  epic:           'Rewrite with grand epic scale — mythic cadence, weight of history, sweeping imagery.',
};

export async function POST(req: NextRequest) {
  try {
    const { text, style, tone, length, lang } = await req.json();

    if (text == null || !style) {
      return new Response(JSON.stringify({ error: 'Missing text or style' }), { status: 400 });
    }
    if (!text.trim()) {
      return new Response('', { status: 200 });
    }

    const styleGuide = STYLE_PROMPTS[style] || STYLE_PROMPTS.literary;
    const toneNote = tone === 'warm' ? ' Lean warmer and more emotionally present.'
                   : tone === 'cool' ? ' Lean cooler and more detached.' : '';
    const lengthNote = length === 'short' ? ' Be more concise than the original.'
                     : length === 'long'  ? ' Expand slightly — more texture and detail.'
                     : ' Keep the length similar to the original.';
    const langNote = lang === 'kr'
      ? ' The text is in Korean — preserve the Korean language in your output.'
      : ' The text is in English — preserve the English language in your output.';

    const stream = await getClient().chat.completions.create({
      model: 'gpt-5-nano',
      max_completion_tokens: 2048,
      stream: true,
      messages: [{
        role: 'user',
        content: `${styleGuide}${toneNote}${lengthNote}${langNote}

Return ONLY the rewritten text — no preamble, no explanation, no quotes.

Original text:
${text}`,
      }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('Transform error:', err);
    return new Response(JSON.stringify({ error: 'Transform failed' }), { status: 500 });
  }
}
