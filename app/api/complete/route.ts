import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function POST(req: NextRequest) {
  try {
    const { text, lang } = await req.json();
    if (!text?.trim() || text.trim().length < 10) return NextResponse.json({ completion: '' });

    const isKr = lang === 'kr';
    const response = await getClient().chat.completions.create({
      model: 'gpt-5-nano',
      max_completion_tokens: 80,
      messages: [{
        role: 'user',
        content: `You are a creative writing assistant. Continue the following ${isKr ? 'Korean' : 'English'} text with exactly ONE natural sentence that fits the style and mood. Return ONLY the continuation sentence — no quotes, no explanation, no line breaks.

Text:
${text.slice(-400)}`,
      }],
    });

    const completion = response.choices[0]?.message?.content?.trim() || '';
    return NextResponse.json({ completion });
  } catch (err) {
    console.error('Complete error:', err);
    return NextResponse.json({ completion: '' });
  }
}
