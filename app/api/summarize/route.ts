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
    if (!text?.trim() || text.trim().length < 30) return NextResponse.json({ summary: '' });

    const isKr = lang === 'kr';
    const response = await getClient().chat.completions.create({
      model: 'gpt-5-nano',
      max_completion_tokens: 120,
      messages: [{
        role: 'user',
        content: `${levelGuidance(level, lang)}아래 챕터를 ${isKr ? '한국어' : '영어'} 1-2문장으로 요약하세요. 핵심 사건과 감정만. 설명 없이 요약문만 반환.

${text.slice(0, 3000)}`,
      }],
    });

    const summary = response.choices[0]?.message?.content?.trim() || '';
    return NextResponse.json({ summary });
  } catch (err) {
    console.error('Summarize error:', err);
    return NextResponse.json({ summary: '' });
  }
}
