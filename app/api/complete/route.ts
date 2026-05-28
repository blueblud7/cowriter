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
    if (!text?.trim() || text.trim().length < 10) return NextResponse.json({ completion: '' });

    const isKr = lang === 'kr';
    const formatCtx = format ? FORMAT_AI_CONTEXT[format] : '';
    const response = await getClient().chat.completions.create({
      model: 'gpt-5-nano',
      max_completion_tokens: 80,
      messages: [{
        role: 'user',
        content: `당신은 창작 글쓰기 보조 AI입니다.${formatCtx ? ` 지금 ${formatCtx}` : ''}\n\n아래 ${isKr ? '한국어' : '영어'} 텍스트에 이어지는 딱 한 문장을 써주세요. 문체와 분위기에 완벽히 맞아야 합니다. 문장만 반환하세요 (따옴표, 설명, 줄바꿈 없이).\n\n텍스트:\n${text.slice(-400)}`,
      }],
    });

    const completion = response.choices[0]?.message?.content?.trim() || '';
    return NextResponse.json({ completion });
  } catch (err) {
    console.error('Complete error:', err);
    return NextResponse.json({ completion: '' });
  }
}
