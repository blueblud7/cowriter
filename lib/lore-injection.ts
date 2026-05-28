export interface BibleData {
  characters?: Array<{ name: string; role?: string; oneLine?: string; traits?: string; age?: string; wants?: string; fears?: string; keywords?: string }>;
  places?: Array<{ name: string; note?: string; keywords?: string }>;
  objects?: Array<{ name: string; note?: string; keywords?: string }>;
  rules?: string[];
}

function matchKeywords(name: string, keywords: string | undefined, ctx: string): boolean {
  const kw = keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [name];
  return kw.some(k => k && ctx.includes(k.toLowerCase()));
}

export function getTriggeredLore(text: string, bible: BibleData): string {
  if (!bible || !text) return '';
  const ctx = text.slice(-1200).toLowerCase();
  const hits: string[] = [];

  for (const c of bible.characters || []) {
    if (!c.name) continue;
    if (!matchKeywords(c.name, c.keywords, ctx)) continue;
    const parts = [
      c.name + (c.role ? ` (${c.role})` : ''),
      c.oneLine,
      c.traits && `성격: ${c.traits}`,
      c.age && `나이: ${c.age}`,
      c.wants && `원함: ${c.wants}`,
      c.fears && `두려움: ${c.fears}`,
    ].filter(Boolean);
    hits.push(`[인물 ${c.name}] ${parts.join(' · ')}`);
  }

  for (const p of bible.places || []) {
    if (!p.name) continue;
    if (!matchKeywords(p.name, p.keywords, ctx)) continue;
    hits.push(`[장소 ${p.name}]${p.note ? ' ' + p.note : ''}`);
  }

  for (const o of bible.objects || []) {
    if (!o.name) continue;
    if (!matchKeywords(o.name, o.keywords, ctx)) continue;
    hits.push(`[소품 ${o.name}]${o.note ? ' ' + o.note : ''}`);
  }

  for (const r of bible.rules || []) {
    if (r?.trim()) hits.push(`[세계 규칙] ${r}`);
  }

  if (hits.length === 0) return '';
  return `\n📌 자동 주입된 Story Bible 컨텍스트:\n${hits.join('\n')}`;
}

export function countTriggeredLore(text: string, bible: BibleData): number {
  if (!bible || !text) return 0;
  const ctx = text.slice(-1200).toLowerCase();
  let n = 0;
  for (const c of bible.characters || []) { if (c.name && matchKeywords(c.name, c.keywords, ctx)) n++; }
  for (const p of bible.places || []) { if (p.name && matchKeywords(p.name, p.keywords, ctx)) n++; }
  for (const o of bible.objects || []) { if (o.name && matchKeywords(o.name, o.keywords, ctx)) n++; }
  n += (bible.rules || []).filter(r => r?.trim()).length;
  return n;
}
