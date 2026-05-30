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
    if (!text?.trim() || text.trim().length < 20) return NextResponse.json({ issues: [] });

    const isKr = lang === 'kr';
    const response = await getClient().chat.completions.create({
      model: 'gpt-5-nano',
      max_completion_tokens: 800,
      messages: [{
        role: 'user',
        content: `${levelGuidance(level, lang)}당신은 글쓰기 교정 AI입니다. 아래 ${isKr ? '한국어' : '영어'} 텍스트에서 문제 있는 표현을 찾아 JSON 배열로만 반환하세요.

찾아야 할 유형:
- "cliche": 진부하거나 너무 많이 쓰인 표현 (예: "눈물이 주르르", "심장이 쿵쾅", "as cold as ice", "at the end of the day")
- "passive": 수동태 문장 (한국어: -되었다/됐다/당했다가 자연스럽지 않은 경우 / 영어: was/were + past participle)
- "weak": 힘없는 단어 (매우, 정말, 그냥, 약간, very, really, just, quite, a bit)
- "redundant": 중복 표현 (예: "앞으로 나아가다", "free gift", "past history")

텍스트 (최대 2000자):
${text.slice(-2000)}

JSON 형식 (텍스트만 그대로 추출, 문장 전체 아닌 해당 표현만):
[{"type":"cliche"|"passive"|"weak"|"redundant","text":"원문에서 찾은 정확한 표현","suggestion":"대체 표현 제안","reason":"짧은 이유 (${isKr ? '한국어' : '영어'})"}]

문제가 없으면 [] 반환. JSON만 반환.`,
      }],
    });

    const raw = response.choices[0]?.message?.content?.trim() || '[]';
    const match = raw.match(/\[[\s\S]*\]/);
    const issues = match ? JSON.parse(match[0]) : [];
    return NextResponse.json({ issues });
  } catch (err) {
    console.error('Proofread error:', err);
    return NextResponse.json({ issues: [] });
  }
}
