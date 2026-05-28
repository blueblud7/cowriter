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
    const { text, allText, bible, lang, format, loreContext } = await req.json();
    const formatCtx = format ? FORMAT_AI_CONTEXT[format] : '';
    if (!text?.trim() || text.trim().length < 20) {
      return NextResponse.json({ contradictions: [], analysis: null, suggestions: [] });
    }

    const bibleLines: string[] = [];
    if (bible?.characters?.length) {
      bibleLines.push('캐릭터:');
      for (const c of bible.characters) {
        const parts = [c.name, c.role && `(${c.role})`, c.traits && `성격:${c.traits}`, c.age && `나이:${c.age}`, c.wants && `원함:${c.wants}`, c.fears && `두려움:${c.fears}`].filter(Boolean);
        bibleLines.push('- ' + parts.join(' '));
      }
    }
    if (bible?.rules?.filter((r: string) => r?.trim()).length) {
      bibleLines.push('세계관 규칙: ' + bible.rules.filter((r: string) => r?.trim()).join(' / '));
    }
    if (bible?.backstory?.trim()) {
      bibleLines.push('배경: ' + bible.backstory.slice(0, 300));
    }

    // Previous chapters context (exclude current text)
    const prevContext = allText ? allText.replace(text, '').trim().slice(-2000) : '';
    const isKr = lang === 'kr';

    const response = await getClient().chat.completions.create({
      model: 'gpt-5-nano',
      max_completion_tokens: 1400,
      messages: [{
        role: 'user',
        content: `당신은 숙련된 글쓰기 편집자입니다.${formatCtx ? ` 지금 분석할 글은 ${formatCtx}` : ''} 아래 내용을 깊이 분석하고 JSON으로만 응답해주세요.

${prevContext ? `【이전 챕터 맥락】\n${prevContext}\n` : ''}${bibleLines.length ? `【Story Bible】\n${bibleLines.join('\n')}\n` : ''}${loreContext ? `${loreContext}\n` : ''}【현재 챕터】
${text.slice(-2000)}

아래 JSON 형식으로 분석해주세요 (모든 텍스트는 ${isKr ? '한국어' : '영어'}로):
{
  "contradictions": [
    {"severity":"warning"|"error","issue":"구체적인 모순/개연성 문제","suggestion":"수정 제안"}
  ],
  "analysis": {
    "summary":"지금까지 이야기 1-2문장 요약",
    "momentum":"현재 서사 흐름과 감정적 긴장감 상태",
    "gaps":["발전/보완이 필요한 부분1","발전이 필요한 부분2"]
  },
  "suggestions": [
    {"type":"plot"|"character"|"tension"|"world","label":"제안 제목 (5단어 이내)","text":"구체적 방향 제안 (2-3문장)","starter":"이렇게 시작해보세요: 첫 문장 예시"}
  ]
}

contradictions: 실제 문제만. suggestions: 3-4개. JSON만 반환하세요.`,
      }],
    });

    const raw = response.choices[0]?.message?.content?.trim() || '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    const data = match ? JSON.parse(match[0]) : {};
    return NextResponse.json({
      contradictions: data.contradictions || [],
      analysis: data.analysis || null,
      suggestions: data.suggestions || [],
    });
  } catch (err) {
    console.error('Guide error:', err);
    return NextResponse.json({ contradictions: [], analysis: null, suggestions: [] });
  }
}
