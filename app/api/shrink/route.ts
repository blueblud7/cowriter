import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { levelGuidance } from '@/lib/level-guidance';

let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function POST(req: NextRequest) {
  try {
    const { text, lang, level } = await req.json();
    if (!text?.trim() || text.trim().length < 20) return NextResponse.json({});

    const isKr = lang === 'kr';
    const response = await getClient().chat.completions.create({
      model: 'gpt-5-nano',
      max_completion_tokens: 1200,
      messages: [{
        role: 'user',
        content: `${levelGuidance(level, lang)}아래 텍스트를 4가지 형식으로 압축해주세요.

텍스트:
${text.slice(0, 3000)}

JSON으로만 반환:
{
  "logline": "${isKr ? '한 문장 핵심 요약 (30-40자 이내)' : 'One-sentence summary (under 30 words)'}",
  "blurb": "${isKr ? '뒷표지 소개문 스타일 (100-150자)' : 'Back-cover blurb (100-150 words)'}",
  "synopsis": "${isKr ? '줄거리 요약 (300-400자)' : 'Full synopsis (200-300 words)'}",
  "outline": "${isKr ? '장면/챕터별 개요 (bullet points 형식)' : 'Scene/chapter outline (bullet points)'}"
}

${isKr ? '한국어' : '영어'}로. JSON만 반환.`,
      }],
    });

    const raw = response.choices[0]?.message?.content?.trim() || '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    const data = match ? JSON.parse(match[0]) : {};
    return NextResponse.json(data);
  } catch (err) {
    console.error('Shrink error:', err);
    return NextResponse.json({});
  }
}
