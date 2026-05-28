import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { FORMAT_AI_CONTEXT } from '@/lib/data';

let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function POST(req: NextRequest) {
  try {
    const { text, lang, format } = await req.json();
    if (!text?.trim()) return NextResponse.json({ versions: {} });

    const formatCtx = format ? FORMAT_AI_CONTEXT[format] : '';
    const isKr = lang === 'kr';

    const response = await getClient().chat.completions.create({
      model: 'gpt-5-nano',
      max_completion_tokens: 1400,
      messages: [{
        role: 'user',
        content: `당신은 감각적 묘사의 전문가입니다.${formatCtx ? ` ${formatCtx}` : ''}

아래 텍스트를 6가지 감각/표현 방식으로 각각 다시 써주세요. 원문과 비슷한 길이를 유지하세요.

원문: "${text.slice(0, 500)}"

JSON으로만 반환 (다른 설명 없이):
{
  "sight": "시각 중심 — 빛, 색상, 형태, 움직임으로 묘사",
  "sound": "청각 중심 — 소리, 리듬, 침묵으로 묘사",
  "smell": "후각 중심 — 냄새, 향기, 악취로 묘사",
  "taste": "미각 중심 — 맛, 질감, 온도로 묘사",
  "touch": "촉각 중심 — 질감, 온도, 압력, 통증으로 묘사",
  "metaphor": "은유/상징 중심 — 직유나 은유를 사용해 묘사"
}

모든 텍스트는 ${isKr ? '한국어' : '영어'}로. JSON만 반환.`,
      }],
    });

    const raw = response.choices[0]?.message?.content?.trim() || '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    const versions = match ? JSON.parse(match[0]) : {};
    return NextResponse.json({ versions });
  } catch (err) {
    console.error('Describe error:', err);
    return NextResponse.json({ versions: {} });
  }
}
