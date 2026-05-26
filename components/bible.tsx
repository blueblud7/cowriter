'use client';
import { useState } from 'react';
import { InkiMascot } from './mascot';
import type { Lang, T } from '@/lib/data';
import { GENRES, THEMES, CHARACTERS, WORLD, BEATS, PREMISE } from '@/lib/data';

interface StoryBibleScreenProps {
  t: T;
  lang: Lang;
  onClose: () => void;
  onJumpToChapter?: (id: string) => void;
}

function CharField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="char-field">
      <div className="char-field-label">{label}</div>
      <div className="char-field-value">{children}</div>
    </div>
  );
}

export function StoryBibleScreen({ t, lang, onClose, onJumpToChapter }: StoryBibleScreenProps) {
  const [tab, setTab] = useState('premise');
  const [premise, setPremise] = useState(PREMISE[lang]);
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[lang][0].id);
  const chars = CHARACTERS[lang];
  const world = WORLD[lang];
  const beats = BEATS[lang];
  const cur = chars.find(c => c.id === selectedChar) || chars[0];
  const curGenre = GENRES.find(g => g.id === premise.genre) || GENRES[0];

  const toggleTheme = (theme: string) => {
    setPremise((p) => ({
      ...p,
      themes: p.themes.includes(theme)
        ? p.themes.filter(x => x !== theme)
        : [...p.themes, theme].slice(0, 6),
    }));
  };

  return (
    <>
      <div className="topbar">
        <div className="crumb"><b>{t.bible_title}</b></div>
        <div className="spacer" />
        <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>
          {lang === 'kr' ? '비 오는 강 · 작품 설정' : 'River in the Rain · bible'}
        </span>
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
            ['chars', t.tab_chars, '✦'],
            ['world', t.tab_world, '✺'],
            ['timeline', t.tab_timeline, '▤'],
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
                    <span className="genre-icon" style={{ background: g.swatch + '22', color: g.swatch }}>
                      {g.icon}
                    </span>
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
                        data-on={selectedChar === c.id ? '1' : '0'}
                        onClick={() => setSelectedChar(c.id)}>
                  <div className="char-row-portrait" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {c.name[0]}
                  </div>
                  <div className="char-row-meta">
                    <div className="char-row-name">{c.name}</div>
                    <div className="char-row-role">{(t as unknown as Record<string, string>)['role_' + c.role] || c.role}</div>
                  </div>
                </button>
              ))}
              <button className="char-row char-row-add">
                <span className="char-row-portrait char-row-add-icon">+</span>
                <span>{t.ch_add}</span>
              </button>
            </aside>

            <section className="char-detail card">
              <div className="char-detail-head">
                <div className="char-detail-portrait" style={{ width: 80, height: 80, borderRadius: 14, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                  {cur.name[0]}
                </div>
                <div className="char-detail-meta">
                  <div className="char-detail-role">{(t as unknown as Record<string, string>)['role_' + cur.role] || cur.role}</div>
                  <input className="char-detail-name" defaultValue={cur.name} key={cur.id} />
                  <p className="char-detail-oneline">{cur.oneLine}</p>
                  <div className="char-detail-pills">
                    {cur.age != null && (
                      <span className="char-pill"><b>{t.ch_age}</b> {cur.age}</span>
                    )}
                    {cur.traits.slice(0, 3).map((tr, i) => (
                      <span key={i} className="char-pill char-pill-trait">{tr}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="char-fields">
                <CharField label={t.ch_voice}>{cur.voice}</CharField>
                <CharField label={t.ch_wants}>{cur.wants}</CharField>
                <CharField label={t.ch_fears}>{cur.fears}</CharField>
                <CharField label={t.ch_arc}>{cur.arc}</CharField>
              </div>

              {cur.relationships.length > 0 && (
                <div className="char-rel">
                  <div className="bible-card-label">{t.ch_rel}</div>
                  <div className="char-rel-list">
                    {cur.relationships.map((r, i) => (
                      <div key={i} className="char-rel-row">
                        <span className="char-rel-arrow">↦</span>
                        <b>{r.with}</b>
                        <span style={{ color: 'var(--ink-3)' }}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="char-traits-full">
                <div className="bible-card-label">{t.ch_traits}</div>
                <div className="theme-chips" style={{ marginTop: 8 }}>
                  {cur.traits.map((tr, i) => (
                    <span key={i} className="theme-chip" data-on="1">{tr}</span>
                  ))}
                  <button className="theme-chip theme-chip-add">+</button>
                </div>
              </div>
            </section>
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
                    <div className="world-row-img" style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      ◌
                    </div>
                    <div className="world-row-meta">
                      <b>{p.name}</b>
                      <span>{p.note}</span>
                    </div>
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
                    <div>
                      <b>{o.name}</b>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{o.note}</div>
                    </div>
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
                  <div key={n} className="timeline-chapter"
                       style={{ left: `${(n - 1) * 25}%`, width: '25%' }}>
                    <div className="timeline-chapter-label">
                      {lang === 'kr' ? `챕터 ${n}` : `Chapter ${n}`}
                    </div>
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
                        <span className="beat-li-chip">
                          {lang === 'kr' ? `챕터 ${b.ch}` : `Ch ${b.ch}`}
                        </span>
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
