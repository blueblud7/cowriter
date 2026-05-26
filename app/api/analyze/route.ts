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
    if (!text?.trim()) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

    const isKr = lang === 'kr';
    const prompt = `Analyze the following ${isKr ? 'Korean' : 'English'} creative writing excerpt. Respond with ONLY valid JSON — no markdown, no code fences, no explanation.

{
  "recommendedStyle": "<one of: literary, creative, minimalist, journalistic, poetic, conversational, noir, whimsical, epic>",
  "confidence": <integer 0-100>,
  "why": "<1-2 sentences in ${isKr ? 'Korean' : 'English'} explaining why this style fits>",
  "pace": <integer 0-100>,
  "emotion": <integer 0-100>,
  "voice": <integer 0-100>,
  "paceDesc": "<short ${isKr ? 'Korean' : 'English'} description>",
  "emotionDesc": "<short ${isKr ? 'Korean' : 'English'} description>",
  "voiceDesc": "<short ${isKr ? 'Korean' : 'English'} description>",
  "emotionArc": [<exactly 12 integers 0-100 representing emotional intensity through the text>],
  "radar": [<exactly 6 floats 0.0-1.0 for: lyrical, observational, rhythmic, density, conversational, contrasting>],
  "tonePalette": [
    {"label": "<${isKr ? 'Korean' : 'English'} tone name>", "pct": <integer>, "color": "<one of: #5A6E8A #C8633D #8B6FB8 #6B8E5A #B5527A #3A5F8A #D4915B>"}
  ],
  "suggestions": [
    {"style": "<style name>", "why": "<${isKr ? 'Korean' : 'English'} suggestion>"}
  ]
}

Rules:
- tonePalette must have 2-4 items, pct values must sum to exactly 100
- suggestions must have exactly 3 items
- radar must have exactly 6 floats
- emotionArc must have exactly 12 integers

Text to analyze:
${text.slice(0, 4000)}`;

    const response = await getClient().chat.completions.create({
      model: 'gpt-5-nano',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.choices[0]?.message?.content?.trim() || '{}';
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
