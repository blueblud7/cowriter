import OpenAI from 'openai';
import { NextRequest } from 'next/server';
import { FORMAT_AI_CONTEXT } from '@/lib/data';

let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function POST(req: NextRequest) {
  try {
    const { text, allText, bible, lang, format } = await req.json();
    const formatCtx = format ? FORMAT_AI_CONTEXT[format] : '';
    if (!text?.trim()) return new Response('', { status: 200 });

    const bibleLines: string[] = [];
    if (bible?.characters?.length) {
      for (const c of bible.characters) {
        const parts = [c.name, c.role && `(${c.role})`, c.traits && `성격:${c.traits}`, c.age && `나이:${c.age}`].filter(Boolean);
        bibleLines.push('- ' + parts.join(' '));
      }
    }
    if (bible?.rules?.filter((r: string) => r?.trim()).length) {
      bibleLines.push('규칙: ' + bible.rules.filter((r: string) => r?.trim()).join(' / '));
    }

    const prevContext = allText ? allText.replace(text, '').trim().slice(-1500) : '';
    const isKr = lang === 'kr';

    const stream = await getClient().chat.completions.create({
      model: 'gpt-5-nano',
      max_completion_tokens: 700,
      stream: true,
      messages: [{
        role: 'user',
        content: `당신은 재능 있는 ${isKr ? '한국어' : '영어'} 작가입니다.${formatCtx ? ` 지금 ${formatCtx}` : ''} 지금까지의 내용을 완벽히 이해하고 이어서 써주세요.

${prevContext ? `【이전 챕터 맥락】\n${prevContext}\n\n` : ''}${bibleLines.length ? `【캐릭터/설정】\n${bibleLines.join('\n')}\n\n` : ''}【현재 챕터 - 여기서 이어서 씀】
${text.slice(-1500)}

지시:
- 위 내용의 다음 2-3 단락을 이어서 써주세요
- 같은 문체, 어조, 시점 완벽히 유지
- 모든 캐릭터 설정과 이전 사건에 완전히 일치
- 소설 텍스트만, 설명/도입부/요약 없이 바로 이어쓰기`,
      }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const t = chunk.choices[0]?.delta?.content || '';
            if (t) controller.enqueue(encoder.encode(t));
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
    console.error('Autowrite error:', err);
    return new Response('', { status: 500 });
  }
}
