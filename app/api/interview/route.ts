import OpenAI from 'openai';
import { NextRequest } from 'next/server';

let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function POST(req: NextRequest) {
  try {
    const { character, messages, lang } = await req.json();
    if (!character?.name || !messages?.length) return new Response('', { status: 200 });

    const charContext = [
      `이름: ${character.name}`,
      character.role && `역할: ${character.role}`,
      character.oneLine && `한 줄 설명: ${character.oneLine}`,
      character.traits && `성격: ${character.traits}`,
      character.age && `나이: ${character.age}`,
      character.voice && `말투/화법: ${character.voice}`,
      character.wants && `원하는 것: ${character.wants}`,
      character.fears && `두려워하는 것: ${character.fears}`,
      character.arc && `캐릭터 변화: ${character.arc}`,
    ].filter(Boolean).join('\n');

    const isKr = lang === 'kr';

    const stream = await getClient().chat.completions.create({
      model: 'gpt-5-nano',
      max_completion_tokens: 350,
      stream: true,
      messages: [
        {
          role: 'system',
          content: `당신은 소설 속 캐릭터입니다. 아래 설정에 따라 완전히 그 인물로서 대답하세요.

${charContext}

규칙:
- 항상 그 인물의 관점, 말투, 성격으로 대답
- "저는 AI입니다" 같은 말 절대 금지
- 인물의 내면을 자연스럽게 드러내기
- ${isKr ? '한국어로 대답' : 'Answer in English'}
- 짧고 캐릭터답게 (2-4문장)`,
        },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
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
    console.error('Interview error:', err);
    return new Response('', { status: 500 });
  }
}
