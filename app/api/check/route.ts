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
    const { text, bible, lang, format } = await req.json();
    const formatCtx = format ? FORMAT_AI_CONTEXT[format] : '';
    if (!text?.trim() || text.trim().length < 30) return NextResponse.json({ issues: [] });

    const lines: string[] = [];
    if (bible?.characters?.length) {
      lines.push('【캐릭터 설정】');
      for (const c of bible.characters) {
        const parts = [c.name, c.role && `(${c.role})`, c.oneLine, c.traits && `성격:${c.traits}`, c.age && `나이:${c.age}`, c.wants && `원함:${c.wants}`, c.fears && `두려움:${c.fears}`].filter(Boolean);
        lines.push('- ' + parts.join(' / '));
      }
    }
    if (bible?.rules?.filter((r: string) => r?.trim()).length) {
      lines.push('【세계관 규칙】');
      for (const r of bible.rules) if (r?.trim()) lines.push('- ' + r);
    }
    if (bible?.backstory?.trim()) lines.push(`【세계 배경】 ${bible.backstory.slice(0, 400)}`);
    if (bible?.beats?.length) {
      lines.push('【타임라인 비트】');
      for (const b of bible.beats) if (b.title) lines.push(`- ch${b.ch} ${b.title}${b.desc ? ': ' + b.desc.slice(0, 80) : ''}`);
    }

    if (lines.length === 0) return NextResponse.json({ issues: [] });

    const response = await getClient().chat.completions.create({
      model: 'gpt-5-nano',
      max_completion_tokens: 700,
      messages: [{
        role: 'user',
        content: `당신은 글쓰기 일관성 검사 AI입니다.${formatCtx ? ` 이 글은 ${formatCtx}` : ''} Story Bible과 챕터 텍스트를 비교해 설정 불일치를 찾아주세요.

Story Bible:
${lines.join('\n')}

챕터 텍스트 (최근 1500자):
${text.slice(-1500)}

불일치나 주의할 점을 JSON 배열로 반환하세요. 형식:
[{"severity":"warning"|"error","field":"character"|"world_rule"|"timeline","issue":"불일치 설명","suggestion":"수정 제안"}]

문제가 없으면 [] 반환. JSON만 반환하세요.`,
      }],
    });

    const raw = response.choices[0]?.message?.content?.trim() || '[]';
    const match = raw.match(/\[[\s\S]*\]/);
    const issues = match ? JSON.parse(match[0]) : [];
    return NextResponse.json({ issues });
  } catch (err) {
    console.error('Check error:', err);
    return NextResponse.json({ issues: [] });
  }
}
