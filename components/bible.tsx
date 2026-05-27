'use client';
import { useState, useEffect } from 'react';
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
}
function emptyChar(lang: Lang): CharDraft {
  return { id: `c-${Date.now()}`, name: lang === 'kr' ? '새 캐릭터' : 'New character',
    role: 'supporting', oneLine: '', age: '', traits: '', voice: '', wants: '', fears: '', arc: '' };
}
const ROLE_OPTIONS = [
  { id: 'protagonist', kr: '주인공', en: 'Protagonist' },
  { id: 'mirror',      kr: '거울',   en: 'Mirror' },
  { id: 'antagonist',  kr: '적대자', en: 'Antagonist' },
  { id: 'supporting',  kr: '조력자', en: 'Supporting' },
  { id: 'symbol',      kr: '상징',   en: 'Symbol' },
];

/* ── World ── */
interface Place { id: string; name: string; note: string; }
interface Obj    { id: string; name: string; note: string; }

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
                  <div key={o.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div className="world-obj-icon">◌</div>
                    <input className="frame-row-input" style={{ flex: 1 }} value={o.name}
                           onChange={e => setObjects(prev => prev.map(x => x.id === o.id ? { ...x, name: e.target.value } : x))}
                           placeholder={lang === 'kr' ? '소품 이름' : 'Object name'} />
                    <input className="frame-row-input" style={{ flex: 2 }} value={o.note}
                           onChange={e => setObjects(prev => prev.map(x => x.id === o.id ? { ...x, note: e.target.value } : x))}
                           placeholder={lang === 'kr' ? '메모' : 'Note'} />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="bible-card-label" style={{ margin: 0 }}>{lang === 'kr' ? '스토리 비트' : 'Story Beats'}</div>
                <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={addBeat}>
                  + {lang === 'kr' ? '비트 추가' : 'Add beat'}
                </button>
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
    </>
  );
}
