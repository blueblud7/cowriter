import type { Lang, Level } from './data';

/**
 * Level-aware guidance injected at the FRONT of every AI prompt.
 *
 * The app's AI features were all written for adult/literary writers. To melt a
 * child-friendly mode into the same pipeline, each route prepends this preamble
 * based on the writer's `level`:
 *  - 'kids'     → simple words, short sentences, warm coaching, strict safety
 *  - 'beginner' → plain, encouraging, gentle (no hard safety lock)
 *  - 'growing' / 'pro' → no preamble (unchanged behavior)
 *
 * Returns '' for growing/pro so existing output is untouched.
 */
export function levelGuidance(level: Level | undefined, lang: Lang): string {
  const isKr = lang === 'kr';

  if (level === 'kids') {
    return isKr
      ? `[독자/작가는 어린이입니다 — 반드시 지킬 것]
- 아주 쉽고 친근한 낱말만 쓰세요. 어려운 한자어·추상어는 피합니다.
- 문장은 짧고 단순하게. 한 문장에 한 가지 생각만 담으세요.
- 따뜻하고 신나는 말투로, 옆에서 도와주는 다정한 친구처럼 말하세요.
- 가르치려 들거나 혼내지 말고, 칭찬을 먼저 많이 하세요. 틀린 점도 "이렇게 하면 더 멋져!"처럼 부드럽게.
- 아이의 원래 표현과 순수함을 지우지 마세요. 통째로 어른스럽게 바꾸지 마세요.
[안전 규칙] 폭력·잔인함·성적 내용·욕설·무서운 공포·위험한 행동·차별/혐오를 절대 만들지 마세요. 아이 글에 그런 내용이 있어도 그 방향으로 발전시키지 말고 따뜻하고 안전한 방향으로 부드럽게 돌려주세요. 개인정보(이름 전체·주소·학교·전화번호)를 더 넣자고 제안하지 마세요.

`
      : `[The reader/writer is a child — you MUST follow this]
- Use only very easy, friendly words. Avoid hard, abstract vocabulary.
- Keep sentences short and simple — one idea per sentence.
- Be warm and cheerful, like a kind friend helping out.
- Never lecture or scold. Praise first and often. Frame fixes gently, like "This would be even cooler if...".
- Keep the child's own voice and innocence. Do not rewrite it to sound like an adult.
[Safety] Never produce violence, cruelty, sexual content, profanity, scary horror, dangerous acts, or hateful/discriminatory content. If the child's text drifts that way, gently steer back to something warm and safe. Do not suggest adding personal info (full names, address, school, phone).

`;
  }

  if (level === 'beginner') {
    return isKr
      ? `[작가는 글쓰기를 막 시작한 사람입니다]
- 쉽고 명료한 낱말과 짧은 문장을 쓰세요. 부담스러운 전문 용어는 피합니다.
- 격려하는 다정한 어조로, 잘한 점을 먼저 짚어 주세요.

`
      : `[The writer is just starting out]
- Use plain, clear words and short sentences. Avoid intimidating jargon.
- Keep an encouraging, kind tone and point out what works first.

`;
  }

  return '';
}
