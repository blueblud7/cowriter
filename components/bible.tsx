'use client';
import { useState } from 'react';
import { InkiMascot } from './mascot';
import type { Lang, T } from '@/lib/data';
import { GENRES, THEMES, WORLD, BEATS, PREMISE } from '@/lib/data';

interface StoryBibleScreenProps {
  t: T;
  lang: Lang;
  onClose: () => void;
  onJumpToChapter?: (id: string) => void;
}

interface CharDraft {
  id: string;
  name: string;
  role: string;
  oneLine: string;
  age: string;
  traits: string;
  voice: string;
  wants: string;
  fears: string;
  arc: string;
}

function emptyChar(lang: Lang): CharDraft {
  return {
    id: `char-${Date.now()}`,
    name: lang === 'kr' ? '새 캐릭터' : 'New character',
    role: 'supporting',
    oneLine: '',
    age: '',
    traits: '',
    voice: '',
    wants: '',
    fears: '',
    arc: '',
  };
}

const ROLE_OPTIONS = [
  { id: 'protagonist', kr: '주인공', en: 'Protagonist' },
  { id: 'mirror',      kr: '거울',   en: 'Mirror' },
  { id: 'antagonist',  kr: '적대자', en: 'Antagonist' },
  { id: 'supporting',  kr: '조력자', en: 'Supporting' },
  { id: 'symbol',      kr: '상징',   en: 'Symbol' },
];

export function StoryBibleScreen({ t, lang, onClose, onJumpToChapter }: StoryBibleScreenProps) {
  const [tab, setTab] = useState('premise');
  const [premise, setPremise] = useState(PREMISE[lang]);
  const [chars, setChars] = useState<CharDraft[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const world = WORLD[lang];
  const beats = BEATS[lang];
  const curGenre = GENRES.find(g => g.id === premise.genre) || GENRES[0];
  const cur = chars.find(c => c.id === selectedId) ?? null;

  const toggleTheme = (theme: string) => {
    setPremise(p => ({
      ...p,
      themes: p.themes.includes(theme)
        ? p.themes.filter(x => x !== theme)
        : [...p.themes, theme].slice(0, 6),
    }));
  };

  const addChar = () => {
    const c = emptyChar(lang);
    setChars(prev => [...prev, c]);
    setSelectedId(c.id);
  };

  const updateChar = (patch: Partial<CharDraft>) => {
    if (!selectedId) return;
    setChars(prev => prev.map(c => c.id === selectedId ? { ...c, ...patch } : c));
  };

  const deleteChar = (id: string) => {
    const next = chars.filter(c => c.id !== id);
    setChars(next);
    setSelectedId(next[0]?.id ?? null);
  };

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
          {([
            ['premise', t.tab_premise, '◐'],
            ['chars',   t.tab_chars,   '✦'],
            ['world',   t.tab_world,   '✺'],
            ['timeline',t.tab_timeline,'▤'],
          ] as [string, string, string][]).map(([id, label, icon]) => (
            <button key={id} className="bible-tab"
                    data-on={tab === id ? '1' : '0'}
                    onClick={() => setTab(id)}
                    role="tab" aria-selected={tab === id}>
              <span className="bible-tab-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {tab === 'premise' && (
          <div className="bible-grid bible-grid-premise fade-in">
            <section className="card bible-card">
              <div className="bible-card-label">{t.pr_genre}</div>
              <div className="genre-grid">
                {GENRES.map((g) => (
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
              <textarea className="bible-logline"
                        value={premise.logline}
                        onChange={(e) => setPremise(p => ({ ...p, logline: e.target.value }))}
                        rows={3} spellCheck={false} />
              <div className="bible-logline-foot">
                <InkiMascot size={28} mood="wink" />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {lang === 'kr'
                    ? `${curGenre[lang].name}의 결이에요. 한 문장이 작품의 나침반이 돼요.`
                    : `${curGenre[lang].name} grain. One sentence is your compass.`}
                </span>
              </div>
            </section>

            <section className="card bible-card">
              <div className="bible-card-label">{t.pr_themes}</div>
              <div className="theme-chips">
                {THEMES[lang].map((th) => (
                  <button key={th} className="theme-chip"
                          data-on={premise.themes.includes(th) ? '1' : '0'}
                          onClick={() => toggleTheme(th)}>
                    {th}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-4)' }}>
                {t.pr_themes_pick} · {premise.themes.length}/6
              </div>
            </section>

            <section className="card bible-card">
              <div className="bible-card-label">{lang === 'kr' ? '시점·시제·배경' : 'Frame'}</div>
              <div className="frame-rows">
                {([
                  [t.pr_pov, 'pov'],
                  [t.pr_tense, 'tense'],
                  [t.pr_setting, 'setting'],
                ] as [string, keyof typeof premise][]).map(([label, key]) => (
                  <div key={key} className="frame-row">
                    <span className="frame-row-l">{label}</span>
                    <input className="frame-row-input"
                           value={String(premise[key])}
                           onChange={(e) => setPremise(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <div className="frame-row">
                  <span className="frame-row-l">{t.pr_tone}</span>
                  <div className="rail-seg" style={{ flex: 1 }}>
                    {([['serene', lang === 'kr' ? '잔잔함' : 'Serene'],
                       ['intense', lang === 'kr' ? '강렬함' : 'Intense'],
                       ['playful', lang === 'kr' ? '발랄함' : 'Playful']] as [string, string][]).map(([v, l]) => (
                      <button key={v} data-on={premise.tone === v ? '1' : '0'}
                              onClick={() => setPremise(p => ({ ...p, tone: v }))}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === 'chars' && (
          <div className="bible-chars fade-in">
            <aside className="char-list">
              {chars.map((c) => (
                <button key={c.id} className="char-row"
                        data-on={selectedId === c.id ? '1' : '0'}
                        onClick={() => setSelectedId(c.id)}>
                  <div className="char-row-portrait" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {(c.name || '?')[0]}
                  </div>
                  <div className="char-row-meta">
                    <div className="char-row-name">{c.name}</div>
                    <div className="char-row-role">
                      {ROLE_OPTIONS.find(r => r.id === c.role)?.[lang] || c.role}
                    </div>
                  </div>
                </button>
              ))}
              <button className="char-row char-row-add" onClick={addChar}>
                <span className="char-row-portrait char-row-add-icon">+</span>
                <span>{t.ch_add}</span>
              </button>
            </aside>

            {cur ? (
              <section className="char-detail card">
                <div className="char-detail-head">
                  <div className="char-detail-portrait" style={{ width: 80, height: 80, borderRadius: 14, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                    {(cur.name || '?')[0]}
                  </div>
                  <div className="char-detail-meta" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <select className="frame-row-input" style={{ flex: 1 }}
                              value={cur.role}
                              onChange={(e) => updateChar({ role: e.target.value })}>
                        {ROLE_OPTIONS.map(r => (
                          <option key={r.id} value={r.id}>{r[lang]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => { if (confirm(lang === 'kr' ? `${cur.name}을(를) 삭제할까요?` : `Delete ${cur.name}?`)) deleteChar(cur.id); }}
                        style={{ padding: '4px 10px', fontSize: 12, color: 'var(--negative, #c0392b)', background: 'transparent', border: '1px solid var(--negative, #c0392b)', borderRadius: 6, cursor: 'pointer' }}>
                        {lang === 'kr' ? '삭제' : 'Delete'}
                      </button>
                    </div>
                    <input className="char-detail-name"
                           value={cur.name}
                           onChange={(e) => updateChar({ name: e.target.value })}
                           placeholder={lang === 'kr' ? '이름' : 'Name'} />
                    <input className="frame-row-input"
                           value={cur.oneLine}
                           onChange={(e) => updateChar({ oneLine: e.target.value })}
                           placeholder={lang === 'kr' ? '한 줄 설명' : 'One-line description'}
                           style={{ marginTop: 4 }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <input className="frame-row-input" style={{ width: 64 }}
                             value={cur.age}
                             onChange={(e) => updateChar({ age: e.target.value })}
                             placeholder={lang === 'kr' ? '나이' : 'Age'} />
                      <input className="frame-row-input" style={{ flex: 1 }}
                             value={cur.traits}
                             onChange={(e) => updateChar({ traits: e.target.value })}
                             placeholder={lang === 'kr' ? '성격 키워드 (쉼표로 구분)' : 'Traits (comma-separated)'} />
                    </div>
                  </div>
                </div>

                <div className="char-fields">
                  {([
                    ['ch_voice', 'voice', lang === 'kr' ? '말투' : 'Voice'],
                    ['ch_wants', 'wants', lang === 'kr' ? '원하는 것' : 'Wants'],
                    ['ch_fears', 'fears', lang === 'kr' ? '두려운 것' : 'Fears'],
                    ['ch_arc',   'arc',   lang === 'kr' ? '변화의 곡선' : 'Arc'],
                  ] as [keyof T, keyof CharDraft, string][]).map(([tKey, field, placeholder]) => (
                    <div key={field} className="char-field">
                      <div className="char-field-label">{t[tKey] as string}</div>
                      <textarea className="frame-row-input"
                                style={{ width: '100%', minHeight: 48, resize: 'vertical' }}
                                value={cur[field] as string}
                                onChange={(e) => updateChar({ [field]: e.target.value })}
                                placeholder={placeholder}
                                rows={2} />
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="char-detail card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--ink-3)' }}>
                <InkiMascot size={56} mood="encouraging" />
                <p style={{ fontSize: 14 }}>
                  {lang === 'kr' ? '+ 캐릭터 추가를 눌러 첫 인물을 만들어봐요.' : 'Press + to create your first character.'}
                </p>
                <button className="btn btn-primary" onClick={addChar}>{t.ch_add}</button>
              </section>
            )}
          </div>
        )}

        {tab === 'world' && (
          <div className="bible-grid bible-grid-world fade-in">
            <section className="card bible-card">
              <div className="bible-card-label">{t.w_backstory}</div>
              <textarea className="world-backstory" defaultValue={world.backstory} rows={6} spellCheck={false} />
              <div className="world-backstory-hint">
                <InkiMascot size={26} mood="warm" />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {lang === 'kr'
                    ? '독자에게 직접 보여주지 않지만, 작가에게 길을 알려주는 부분이에요.'
                    : 'Never shown to the reader directly — but it points your way.'}
                </span>
              </div>
            </section>

            <section className="card bible-card">
              <div className="bible-card-label">{t.w_places}</div>
              <div className="world-list">
                {world.places.map((p) => (
                  <div key={p.id} className="world-row">
                    <div className="world-row-img" style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>◌</div>
                    <div className="world-row-meta"><b>{p.name}</b><span>{p.note}</span></div>
                  </div>
                ))}
                <button className="world-row world-row-add">
                  <span className="world-row-img world-row-add-icon">+</span>
                  <span style={{ color: 'var(--ink-3)' }}>{lang === 'kr' ? '장소 추가' : 'Add place'}</span>
                </button>
              </div>
            </section>

            <section className="card bible-card">
              <div className="bible-card-label">{t.w_objects}</div>
              <div className="world-objs">
                {world.objects.map((o) => (
                  <div key={o.id} className="world-obj">
                    <div className="world-obj-icon">◌</div>
                    <div><b>{o.name}</b><div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{o.note}</div></div>
                  </div>
                ))}
                <button className="world-obj world-obj-add">
                  <div className="world-obj-icon">+</div>
                  <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>{lang === 'kr' ? '소품 추가' : 'Add object'}</span>
                </button>
              </div>
            </section>

            <section className="card bible-card bible-rules-card">
              <div className="bible-card-label">{t.w_rules}</div>
              <ul className="world-rules">
                <li>{lang === 'kr' ? '시간은 비를 통해서만 움직인다.' : 'Time only moves through rain.'}</li>
                <li>{lang === 'kr' ? '강 건너편은 과거다.' : 'The far side of the river is the past.'}</li>
                <li>{lang === 'kr' ? '편지는 한 번만 열 수 있다.' : 'A letter can be opened only once.'}</li>
              </ul>
              <button className="btn btn-ghost" style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                + {lang === 'kr' ? '규칙 추가' : 'Add rule'}
              </button>
            </section>
          </div>
        )}

        {tab === 'timeline' && (
          <div className="bible-timeline fade-in">
            <section className="card timeline-card">
              <div className="bible-card-label">{t.tl_beats}</div>
              <div className="timeline-track">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="timeline-chapter" style={{ left: `${(n - 1) * 25}%`, width: '25%' }}>
                    <div className="timeline-chapter-label">{lang === 'kr' ? `챕터 ${n}` : `Chapter ${n}`}</div>
                  </div>
                ))}
                <div className="timeline-line" />
                {beats.map((b, i) => (
                  <button key={b.id} className="timeline-beat"
                          style={{ left: `${b.pos}%` }}
                          onClick={() => onJumpToChapter && onJumpToChapter(`ch${b.ch}`)}>
                    <span className="timeline-beat-dot" />
                    <span className="timeline-beat-num">{i + 1}</span>
                    <span className="timeline-beat-card">
                      <b>{b.title}</b>
                      <span>{b.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="card timeline-list">
              <div className="bible-card-label">{lang === 'kr' ? '비트 목록' : 'Beats'}</div>
              <ol className="beat-ol">
                {beats.map((b, i) => (
                  <li key={b.id}>
                    <div className="beat-li-num">{String(i + 1).padStart(2, '0')}</div>
                    <div className="beat-li-body">
                      <div className="beat-li-head">
                        <b>{b.title}</b>
                        <span className="beat-li-chip">{lang === 'kr' ? `챕터 ${b.ch}` : `Ch ${b.ch}`}</span>
                      </div>
                      <div className="beat-li-desc">{b.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
