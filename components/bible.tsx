'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { InkiMascot } from './mascot';
import type { Lang, T } from '@/lib/data';
import { GENRES, THEMES, PREMISE } from '@/lib/data';

interface StoryBibleScreenProps {
  t: T;
  lang: Lang;
  onClose: () => void;
  onJumpToChapter?: (id: string) => void;
}

/* ── Character ── */
interface CharDraft {
  id: string; name: string; role: string; oneLine: string;
  age: string; traits: string; voice: string; wants: string; fears: string; arc: string;
  keywords: string;
}
function emptyChar(lang: Lang): CharDraft {
  return { id: `c-${Date.now()}`, name: lang === 'kr' ? '새 캐릭터' : 'New character',
    role: 'supporting', oneLine: '', age: '', traits: '', voice: '', wants: '', fears: '', arc: '', keywords: '' };
}
const ROLE_OPTIONS = [
  { id: 'protagonist', kr: '주인공', en: 'Protagonist' },
  { id: 'mirror',      kr: '거울',   en: 'Mirror' },
  { id: 'antagonist',  kr: '적대자', en: 'Antagonist' },
  { id: 'supporting',  kr: '조력자', en: 'Supporting' },
  { id: 'symbol',      kr: '상징',   en: 'Symbol' },
];

/* ── World ── */
interface Place { id: string; name: string; note: string; keywords?: string; }
interface Obj    { id: string; name: string; note: string; keywords?: string; }

/* ── Story Structure Templates ── */
interface TemplateBeat { title: string; desc: string; ch: string; }
interface StoryTemplate { id: string; kr: string; en: string; beats: TemplateBeat[]; }
const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: '3act', kr: '3막 구조', en: '3-Act Structure',
    beats: [
      { title: '발단 (세계 소개)', desc: '주인공의 일상 세계와 내면 결핍을 보여준다.', ch: '1' },
      { title: '촉발 사건', desc: '주인공의 세계를 뒤흔드는 사건이 발생한다.', ch: '2' },
      { title: '1막 전환 (결단)', desc: '주인공이 새로운 세계로 발을 내딛는 결단을 내린다.', ch: '3' },
      { title: '2막 상승 (시련)', desc: '장애물과 갈등이 쌓이고 캐릭터가 시험받는다.', ch: '5' },
      { title: '중간점 (전환)', desc: '이야기의 절반, 결정적 변화나 계시가 일어난다.', ch: '7' },
      { title: '모든 것을 잃다', desc: '최대 위기. 모든 것이 무너지는 것처럼 보인다.', ch: '9' },
      { title: '3막 전환 (돌파)', desc: '주인공이 내면의 결핍을 극복하고 반격에 나선다.', ch: '10' },
      { title: '클라이맥스', desc: '최후의 대결. 주인공의 변화가 완성된다.', ch: '11' },
      { title: '결말 (새로운 세계)', desc: '변화된 주인공의 새 일상을 보여준다.', ch: '12' },
    ],
  },
  {
    id: 'savethecat', kr: 'Save the Cat', en: 'Save the Cat',
    beats: [
      { title: '오프닝 이미지', desc: '이야기의 분위기와 주인공의 현재 상태를 압축한 한 장면.', ch: '1' },
      { title: '주제 제시', desc: '이야기가 무엇에 관한 것인지 암시하는 대화나 장면.', ch: '1' },
      { title: '촉발 사건 (카탈리스트)', desc: '주인공의 평범한 세계를 뒤흔드는 사건.', ch: '2' },
      { title: '결단/2막 진입', desc: '주인공이 새로운 세계로 넘어가기로 결심한다.', ch: '3' },
      { title: '재미와 게임 (Fun & Games)', desc: '이야기의 약속을 실현하는 핵심 장면들. 트레일러 장면들.', ch: '4' },
      { title: '중간점 (Midpoint)', desc: '거짓된 승리 또는 거짓된 패배. 판돈이 올라간다.', ch: '6' },
      { title: '모든 것을 잃다 (All Is Lost)', desc: '최악의 순간. 캐릭터가 가장 낮은 곳에 떨어진다.', ch: '9' },
      { title: '피날레', desc: '주인공이 진정으로 변화해 문제를 해결한다.', ch: '11' },
      { title: '마지막 이미지', desc: '오프닝 이미지와 대비되는, 변화를 증명하는 장면.', ch: '12' },
    ],
  },
  {
    id: 'heros', kr: '영웅의 여정', en: "Hero's Journey",
    beats: [
      { title: '일상 세계', desc: '영웅의 평범한 삶. 아직 모험이 시작되지 않은 세계.', ch: '1' },
      { title: '모험의 부름', desc: '영웅에게 변화를 요구하는 사건이나 도전이 나타난다.', ch: '1' },
      { title: '부름의 거부', desc: '영웅이 두려움이나 의무감으로 부름을 거부한다.', ch: '2' },
      { title: '멘토와의 만남', desc: '영웅에게 조언과 도움을 주는 멘토가 등장한다.', ch: '2' },
      { title: '첫 번째 관문 통과', desc: '영웅이 특별한 세계로 발을 내딛는다.', ch: '3' },
      { title: '시험, 동료, 적', desc: '새로운 세계에서 규칙을 배우고 동료와 적을 만난다.', ch: '5' },
      { title: '가장 깊은 동굴', desc: '가장 위험한 장소로 접근한다. 최대 위기 직전.', ch: '7' },
      { title: '시련 (Ordeal)', desc: '죽음과 부활의 순간. 가장 큰 위기와 변화.', ch: '8' },
      { title: '귀환의 길', desc: '영웅이 일상 세계로 돌아가려 한다. 추격전이 일어날 수도.', ch: '10' },
      { title: '부활 (Resurrection)', desc: '마지막 시험. 영웅은 완전히 변화해 승리한다.', ch: '11' },
      { title: '영약을 갖고 귀환', desc: '영웅이 세계를 변화시킬 뭔가를 갖고 돌아온다.', ch: '12' },
    ],
  },
];

/* ── Interview message ── */
interface InterviewMsg { role: 'user' | 'assistant'; content: string; }

/* ── Timeline ── */
interface Beat { id: string; title: string; desc: string; ch: string; }
function emptyBeat(): Beat {
  return { id: `b-${Date.now()}`, title: '', desc: '', ch: '1' };
}

/* ── Shared ── */
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const FieldInput = ({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) => (
  <div className="char-field">
    <div className="char-field-label">{label}</div>
    {multiline
      ? <textarea className="frame-row-input" style={{ width: '100%', minHeight: 52, resize: 'vertical' }}
                  value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} />
      : <input className="frame-row-input" style={{ width: '100%' }}
               value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}
  </div>
);

const DeleteBtn = ({ onClick, lang }: { onClick: () => void; lang: Lang }) => (
  <button onClick={onClick}
    style={{ padding: '3px 10px', fontSize: 12, color: 'var(--negative,#c0392b)', background: 'transparent',
             border: '1px solid var(--negative,#c0392b)', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
    {lang === 'kr' ? '삭제' : 'Delete'}
  </button>
);

export function StoryBibleScreen({ t, lang, onClose, onJumpToChapter }: StoryBibleScreenProps) {
  const [tab, setTab] = useState('premise');

  /* premise */
  const [premise, setPremise] = useState(PREMISE[lang]);
  const toggleTheme = (th: string) =>
    setPremise(p => ({ ...p, themes: p.themes.includes(th)
      ? p.themes.filter(x => x !== th) : [...p.themes, th].slice(0, 6) }));
  const curGenre = GENRES.find(g => g.id === premise.genre) || GENRES[0];

  /* characters */
  const [chars, setChars] = useState<CharDraft[]>([]);
  const [selChar, setSelChar] = useState<string | null>(null);
  const curChar = chars.find(c => c.id === selChar) ?? null;
  const addChar = () => { const c = emptyChar(lang); setChars(p => [...p, c]); setSelChar(c.id); };
  const patchChar = (patch: Partial<CharDraft>) =>
    selChar && setChars(p => p.map(c => c.id === selChar ? { ...c, ...patch } : c));
  const delChar = (id: string) => {
    const next = chars.filter(c => c.id !== id);
    setChars(next); setSelChar(next[0]?.id ?? null);
  };

  /* world */
  const [backstory, setBackstory] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [objects, setObjects] = useState<Obj[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const addPlace  = () => setPlaces(p => [...p, { id: uid(), name: '', note: '' }]);
  const addObj    = () => setObjects(p => [...p, { id: uid(), name: '', note: '' }]);
  const addRule   = () => setRules(p => [...p, '']);

  /* timeline */
  const [beats, setBeats] = useState<Beat[]>([]);
  const addBeat  = () => setBeats(p => [...p, emptyBeat()]);

  /* interview */
  const [showInterview, setShowInterview] = useState(false);
  const [interviewMsgs, setInterviewMsgs] = useState<InterviewMsg[]>([]);
  const [interviewInput, setInterviewInput] = useState('');
  const [interviewLoading, setInterviewLoading] = useState(false);
  const interviewAbort = useRef<AbortController | null>(null);
  const interviewEndRef = useRef<HTMLDivElement>(null);

  const openInterview = (char: CharDraft) => {
    setInterviewMsgs([{
      role: 'assistant',
      content: lang === 'kr'
        ? `안녕하세요. 저는 ${char.name}입니다. 무엇이 궁금하신가요?`
        : `Hello. I'm ${char.name}. What would you like to know?`,
    }]);
    setInterviewInput('');
    setShowInterview(true);
  };

  const sendInterviewMsg = useCallback(async () => {
    if (!interviewInput.trim() || !curChar || interviewLoading) return;
    const userMsg: InterviewMsg = { role: 'user', content: interviewInput };
    const nextMsgs = [...interviewMsgs, userMsg];
    setInterviewMsgs(nextMsgs);
    setInterviewInput('');
    setInterviewLoading(true);
    const controller = new AbortController();
    interviewAbort.current = controller;
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: curChar, messages: nextMsgs, lang }),
        signal: controller.signal,
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let content = '';
      setInterviewMsgs(prev => [...prev, { role: 'assistant', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done || controller.signal.aborted) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          content += chunk;
          setInterviewMsgs(prev => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content };
            return next;
          });
        }
      }
    } catch {}
    setInterviewLoading(false);
  }, [interviewInput, interviewMsgs, curChar, lang, interviewLoading]);

  useEffect(() => {
    interviewEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interviewMsgs]);

  /* apply story structure template */
  const applyTemplate = (tpl: StoryTemplate) => {
    if (beats.length > 0 && !confirm(lang === 'kr' ? '기존 비트를 모두 지우고 템플릿을 적용할까요?' : 'Replace all beats with this template?')) return;
    setBeats(tpl.beats.map(b => ({ ...b, id: `b-${Date.now()}-${Math.random().toString(36).slice(2)}` })));
  };

  // Load saved Bible data from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cowriter-bible');
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.characters?.length) setChars(saved.characters);
      if (saved.rules?.length) setRules(saved.rules);
      if (saved.backstory) setBackstory(saved.backstory);
      if (saved.places?.length) setPlaces(saved.places);
      if (saved.objects?.length) setObjects(saved.objects);
      if (saved.beats?.length) setBeats(saved.beats);
      if (saved.premise) setPremise(p => ({ ...p, ...saved.premise }));
    } catch {}
  }, []);

  // Persist Bible data for AI consistency checks
  useEffect(() => {
    try {
      localStorage.setItem('cowriter-bible', JSON.stringify({
        characters: chars, rules, backstory, places, objects, beats, premise,
      }));
    } catch {}
  }, [chars, rules, backstory, places, objects, beats, premise]);
  const patchBeat = (id: string, patch: Partial<Beat>) =>
    setBeats(p => p.map(b => b.id === id ? { ...b, ...patch } : b));
  const delBeat  = (id: string) => setBeats(p => p.filter(b => b.id !== id));

  return (
    <>
      <div className="topbar">
        <div className="crumb"><b>{t.bible_title}</b></div>
        <div className="spacer" />
        <button className="btn btn-ghost" onClick={onClose}>← {lang === 'kr' ? '에디터로' : 'Back'}</button>
      </div>

      <div className="bible-body">
        <header className="bible-hero">
          <div>
            <h1 className="bible-h1">{t.bible_title}</h1>
            <div className="bible-sub">{t.bible_sub}</div>
          </div>
          <InkiMascot size={56} mood="smile" pulse />
        </header>

        <nav className="bible-tabs" role="tablist">
          {([['premise', t.tab_premise, '◐'], ['chars', t.tab_chars, '✦'],
             ['world', t.tab_world, '✺'], ['timeline', t.tab_timeline, '▤']] as [string,string,string][])
            .map(([id, label, icon]) => (
            <button key={id} className="bible-tab" data-on={tab === id ? '1' : '0'}
                    onClick={() => setTab(id)} role="tab" aria-selected={tab === id}>
              <span className="bible-tab-icon">{icon}</span><span>{label}</span>
            </button>
          ))}
        </nav>

        {/* ── PREMISE ── */}
        {tab === 'premise' && (
          <div className="bible-grid bible-grid-premise fade-in">
            <section className="card bible-card">
              <div className="bible-card-label">{t.pr_genre}</div>
              <div className="genre-grid">
                {GENRES.map(g => (
                  <button key={g.id} className="genre-card"
                          data-on={premise.genre === g.id ? '1' : '0'}
                          onClick={() => setPremise(p => ({ ...p, genre: g.id }))}
                          style={{ '--swatch': g.swatch } as React.CSSProperties}>
                    <span className="genre-icon" style={{ background: g.swatch + '22', color: g.swatch }}>{g.icon}</span>
                    <div className="genre-name">{g[lang].name}</div>
                    <div className="genre-desc">{g[lang].desc}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="card bible-card bible-logline-card">
              <div className="bible-card-label">{t.pr_logline}</div>
              <textarea className="bible-logline" value={premise.logline} rows={3} spellCheck={false}
                        onChange={e => setPremise(p => ({ ...p, logline: e.target.value }))} />
              <div className="bible-logline-foot">
                <InkiMascot size={28} mood="wink" />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {lang === 'kr' ? `${curGenre[lang].name}의 결. 한 문장이 나침반이에요.`
                                 : `${curGenre[lang].name} grain. One sentence is your compass.`}
                </span>
              </div>
            </section>

            <section className="card bible-card">
              <div className="bible-card-label">{t.pr_themes}</div>
              <div className="theme-chips">
                {THEMES[lang].map(th => (
                  <button key={th} className="theme-chip"
                          data-on={premise.themes.includes(th) ? '1' : '0'}
                          onClick={() => toggleTheme(th)}>{th}</button>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-4)' }}>
                {t.pr_themes_pick} · {premise.themes.length}/6
              </div>
            </section>

            <section className="card bible-card">
              <div className="bible-card-label">{lang === 'kr' ? '시점·시제·배경' : 'Frame'}</div>
              <div className="frame-rows">
                {([['pov', t.pr_pov], ['tense', t.pr_tense], ['setting', t.pr_setting]] as [keyof typeof premise, string][])
                  .map(([key, label]) => (
                  <div key={key} className="frame-row">
                    <span className="frame-row-l">{label}</span>
                    <input className="frame-row-input" value={String(premise[key])}
                           onChange={e => setPremise(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <div className="frame-row">
                  <span className="frame-row-l">{t.pr_tone}</span>
                  <div className="rail-seg" style={{ flex: 1 }}>
                    {([['serene', lang === 'kr' ? '잔잔함' : 'Serene'],
                       ['intense', lang === 'kr' ? '강렬함' : 'Intense'],
                       ['playful', lang === 'kr' ? '발랄함' : 'Playful']] as [string,string][]).map(([v, l]) => (
                      <button key={v} data-on={premise.tone === v ? '1' : '0'}
                              onClick={() => setPremise(p => ({ ...p, tone: v }))}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── CHARACTERS ── */}
        {tab === 'chars' && (
          <div className="bible-chars fade-in">
            <aside className="char-list">
              {chars.map(c => (
                <button key={c.id} className="char-row" data-on={selChar === c.id ? '1' : '0'}
                        onClick={() => setSelChar(c.id)}>
                  <div className="char-row-portrait" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {(c.name || '?')[0]}
                  </div>
                  <div className="char-row-meta">
                    <div className="char-row-name">{c.name}</div>
                    <div className="char-row-role">{ROLE_OPTIONS.find(r => r.id === c.role)?.[lang] || c.role}</div>
                  </div>
                </button>
              ))}
              <button className="char-row char-row-add" onClick={addChar}>
                <span className="char-row-portrait char-row-add-icon">+</span>
                <span>{t.ch_add}</span>
              </button>
            </aside>

            {curChar ? (
              <section className="char-detail card">
                <div className="char-detail-head">
                  <div className="char-detail-portrait" style={{ width: 80, height: 80, borderRadius: 14, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                    {(curChar.name || '?')[0]}
                  </div>
                  <div className="char-detail-meta" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select className="frame-row-input" style={{ flex: 1 }}
                              value={curChar.role} onChange={e => patchChar({ role: e.target.value })}>
                        {ROLE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r[lang]}</option>)}
                      </select>
                      <DeleteBtn lang={lang} onClick={() => {
                        if (confirm(lang === 'kr' ? `${curChar.name}을(를) 삭제할까요?` : `Delete ${curChar.name}?`))
                          delChar(curChar.id);
                      }} />
                    </div>
                    <input className="char-detail-name" value={curChar.name}
                           onChange={e => patchChar({ name: e.target.value })}
                           placeholder={lang === 'kr' ? '이름' : 'Name'} />
                    <input className="frame-row-input" value={curChar.oneLine}
                           onChange={e => patchChar({ oneLine: e.target.value })}
                           placeholder={lang === 'kr' ? '한 줄 설명' : 'One-line description'}
                           style={{ marginTop: 4, width: '100%' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <input className="frame-row-input" style={{ width: 72 }}
                             value={curChar.age} onChange={e => patchChar({ age: e.target.value })}
                             placeholder={lang === 'kr' ? '나이' : 'Age'} />
                      <input className="frame-row-input" style={{ flex: 1 }}
                             value={curChar.traits} onChange={e => patchChar({ traits: e.target.value })}
                             placeholder={lang === 'kr' ? '성격 키워드 (쉼표로 구분)' : 'Traits (comma-separated)'} />
                    </div>
                  </div>
                </div>
                <div className="char-fields">
                  {([
                    [t.ch_voice, 'voice', lang === 'kr' ? '말투' : 'Voice style'],
                    [t.ch_wants, 'wants', lang === 'kr' ? '원하는 것' : 'What they want'],
                    [t.ch_fears, 'fears', lang === 'kr' ? '두려운 것' : 'What they fear'],
                    [t.ch_arc,   'arc',   lang === 'kr' ? '변화의 곡선' : 'Character arc'],
                  ] as [string, keyof CharDraft, string][]).map(([label, field, ph]) => (
                    <FieldInput key={field} label={label}
                                value={curChar[field] as string}
                                onChange={v => patchChar({ [field]: v })}
                                placeholder={ph} multiline />
                  ))}
                  <FieldInput
                    label={lang === 'kr' ? '📌 Lore 키워드 (자동 주입 트리거)' : '📌 Lore Keywords (trigger words)'}
                    value={curChar.keywords}
                    onChange={v => patchChar({ keywords: v })}
                    placeholder={lang === 'kr' ? '쉼표로 구분: 아리아, 아리, Aria' : 'Comma-separated: Aria, the girl, her'}
                  />
                </div>
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => openInterview(curChar)}
                    style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🎙 {lang === 'kr' ? 'AI 인터뷰' : 'AI Interview'}
                  </button>
                </div>
              </section>
            ) : (
              <section className="char-detail card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--ink-3)' }}>
                <InkiMascot size={56} mood="encouraging" />
                <p style={{ fontSize: 14 }}>{lang === 'kr' ? '+ 캐릭터 추가를 눌러 첫 인물을 만들어봐요.' : 'Press + to create your first character.'}</p>
                <button className="btn btn-primary" onClick={addChar}>{t.ch_add}</button>
              </section>
            )}
          </div>
        )}

        {/* ── WORLD ── */}
        {tab === 'world' && (
          <div className="bible-grid bible-grid-world fade-in">
            <section className="card bible-card">
              <div className="bible-card-label">{t.w_backstory}</div>
              <textarea className="world-backstory" value={backstory} rows={6} spellCheck={false}
                        placeholder={lang === 'kr' ? '이 세계의 배경을 자유롭게 써보세요.' : 'Describe the world backstory freely.'}
                        onChange={e => setBackstory(e.target.value)} />
              <div className="world-backstory-hint">
                <InkiMascot size={26} mood="warm" />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {lang === 'kr' ? '독자에게 보여주지 않지만, 작가에게 길을 알려줘요.' : 'Hidden from readers — but it points your way.'}
                </span>
              </div>
            </section>

            <section className="card bible-card">
              <div className="bible-card-label">{t.w_places}</div>
              <div className="world-list">
                {places.map(p => (
                  <div key={p.id} className="world-row" style={{ alignItems: 'flex-start', gap: 8 }}>
                    <div className="world-row-img" style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>◌</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <input className="frame-row-input" value={p.name}
                             onChange={e => setPlaces(prev => prev.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))}
                             placeholder={lang === 'kr' ? '장소 이름' : 'Place name'} />
                      <input className="frame-row-input" value={p.note}
                             onChange={e => setPlaces(prev => prev.map(x => x.id === p.id ? { ...x, note: e.target.value } : x))}
                             placeholder={lang === 'kr' ? '한 줄 메모' : 'Short note'} />
                      <input className="frame-row-input" value={p.keywords || ''}
                             onChange={e => setPlaces(prev => prev.map(x => x.id === p.id ? { ...x, keywords: e.target.value } : x))}
                             placeholder={lang === 'kr' ? '📌 Lore 키워드 (쉼표 구분)' : '📌 Lore keywords (comma-sep)'} />
                    </div>
                    <DeleteBtn lang={lang} onClick={() => setPlaces(prev => prev.filter(x => x.id !== p.id))} />
                  </div>
                ))}
                <button className="world-row world-row-add" onClick={addPlace}>
                  <span className="world-row-img world-row-add-icon">+</span>
                  <span style={{ color: 'var(--ink-3)' }}>{lang === 'kr' ? '장소 추가' : 'Add place'}</span>
                </button>
              </div>
            </section>

            <section className="card bible-card">
              <div className="bible-card-label">{t.w_objects}</div>
              <div className="world-objs" style={{ flexDirection: 'column', gap: 8 }}>
                {objects.map(o => (
                  <div key={o.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div className="world-obj-icon" style={{ marginTop: 4 }}>◌</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input className="frame-row-input" style={{ flex: 1 }} value={o.name}
                               onChange={e => setObjects(prev => prev.map(x => x.id === o.id ? { ...x, name: e.target.value } : x))}
                               placeholder={lang === 'kr' ? '소품 이름' : 'Object name'} />
                        <input className="frame-row-input" style={{ flex: 2 }} value={o.note}
                               onChange={e => setObjects(prev => prev.map(x => x.id === o.id ? { ...x, note: e.target.value } : x))}
                               placeholder={lang === 'kr' ? '메모' : 'Note'} />
                      </div>
                      <input className="frame-row-input" value={o.keywords || ''}
                             onChange={e => setObjects(prev => prev.map(x => x.id === o.id ? { ...x, keywords: e.target.value } : x))}
                             placeholder={lang === 'kr' ? '📌 Lore 키워드 (쉼표 구분)' : '📌 Lore keywords (comma-sep)'} />
                    </div>
                    <DeleteBtn lang={lang} onClick={() => setObjects(prev => prev.filter(x => x.id !== o.id))} />
                  </div>
                ))}
                <button className="world-obj world-obj-add" onClick={addObj}>
                  <div className="world-obj-icon">+</div>
                  <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>{lang === 'kr' ? '소품 추가' : 'Add object'}</span>
                </button>
              </div>
            </section>

            <section className="card bible-card bible-rules-card">
              <div className="bible-card-label">{t.w_rules}</div>
              <ul className="world-rules" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rules.map((r, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input className="frame-row-input" style={{ flex: 1 }} value={r}
                           onChange={e => setRules(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                           placeholder={lang === 'kr' ? '세계의 규칙' : 'World rule'} />
                    <DeleteBtn lang={lang} onClick={() => setRules(prev => prev.filter((_, j) => j !== i))} />
                  </li>
                ))}
              </ul>
              <button className="btn btn-ghost" style={{ marginTop: 8, alignSelf: 'flex-start' }} onClick={addRule}>
                + {lang === 'kr' ? '규칙 추가' : 'Add rule'}
              </button>
            </section>
          </div>
        )}

        {/* ── TIMELINE ── */}
        {tab === 'timeline' && (
          <div className="bible-timeline fade-in">
            <section className="card timeline-list" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div className="bible-card-label" style={{ margin: 0 }}>{lang === 'kr' ? '스토리 비트' : 'Story Beats'}</div>
                <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={addBeat}>
                  + {lang === 'kr' ? '비트 추가' : 'Add beat'}
                </button>
              </div>
              {/* Story structure templates */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--ink-4)', alignSelf: 'center', marginRight: 2 }}>
                  {lang === 'kr' ? '템플릿:' : 'Template:'}
                </span>
                {STORY_TEMPLATES.map(tpl => (
                  <button key={tpl.id} onClick={() => applyTemplate(tpl)}
                    style={{ padding: '4px 12px', fontSize: 12, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 999, cursor: 'pointer', color: 'var(--ink-2)', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                    {tpl[lang]}
                  </button>
                ))}
              </div>

              {beats.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '32px 0', color: 'var(--ink-3)' }}>
                  <InkiMascot size={48} mood="encouraging" />
                  <p style={{ fontSize: 14 }}>{lang === 'kr' ? '비트를 추가해서 이야기의 흐름을 잡아봐요.' : 'Add beats to map out your story.'}</p>
                  <button className="btn btn-primary" onClick={addBeat}>+ {lang === 'kr' ? '첫 비트 추가' : 'Add first beat'}</button>
                </div>
              ) : (
                <ol className="beat-ol">
                  {beats.map((b, i) => (
                    <li key={b.id}>
                      <div className="beat-li-num">{String(i + 1).padStart(2, '0')}</div>
                      <div className="beat-li-body" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <input className="frame-row-input" style={{ flex: 1, fontWeight: 600 }}
                                 value={b.title} onChange={e => patchBeat(b.id, { title: e.target.value })}
                                 placeholder={lang === 'kr' ? '비트 제목' : 'Beat title'} />
                          <input className="frame-row-input" style={{ width: 80 }}
                                 value={b.ch} onChange={e => patchBeat(b.id, { ch: e.target.value })}
                                 placeholder={lang === 'kr' ? '챕터' : 'Chapter'} />
                          <DeleteBtn lang={lang} onClick={() => delBeat(b.id)} />
                        </div>
                        <textarea className="frame-row-input" style={{ width: '100%', minHeight: 44, resize: 'vertical' }}
                                  value={b.desc} onChange={e => patchBeat(b.id, { desc: e.target.value })}
                                  placeholder={lang === 'kr' ? '이 장면에서 무슨 일이 일어나나요?' : 'What happens in this beat?'}
                                  rows={2} />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Character AI Interview modal */}
      {showInterview && curChar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 24px' }}
             onClick={() => setShowInterview(false)}>
          <div style={{ background: 'var(--surface-1)', borderRadius: 16, boxShadow: '0 -4px 40px rgba(0,0,0,0.2)', width: '100%', maxWidth: 560, height: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                {(curChar.name || '?')[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{curChar.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                  🎙 {lang === 'kr' ? 'AI 인터뷰 · 캐릭터로서 답변합니다' : 'AI Interview · answers in character'}
                </div>
              </div>
              <button onClick={() => { interviewAbort.current?.abort(); setShowInterview(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--ink-3)' }}>✕</button>
            </div>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {interviewMsgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-2)',
                    color: m.role === 'user' ? '#fff' : 'var(--ink-1)',
                    fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  }}>
                    {m.content || (interviewLoading && i === interviewMsgs.length - 1 ? (
                      <span style={{ opacity: 0.6, fontStyle: 'italic' }}>{lang === 'kr' ? '생각 중…' : 'thinking…'}</span>
                    ) : '')}
                  </div>
                </div>
              ))}
              <div ref={interviewEndRef} />
            </div>
            {/* Input */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
              <input
                value={interviewInput}
                onChange={e => setInterviewInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendInterviewMsg(); } }}
                placeholder={lang === 'kr' ? `${curChar.name}에게 질문하세요…` : `Ask ${curChar.name} something…`}
                style={{ flex: 1, padding: '9px 12px', fontSize: 13, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--ink-1)', outline: 'none' }}
                disabled={interviewLoading}
                autoFocus
              />
              <button onClick={sendInterviewMsg} disabled={interviewLoading || !interviewInput.trim()}
                style={{ padding: '9px 16px', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, cursor: interviewLoading ? 'not-allowed' : 'pointer', opacity: interviewLoading ? 0.6 : 1 }}>
                {lang === 'kr' ? '전송' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
