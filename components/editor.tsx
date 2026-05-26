'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { InkiMascot } from './mascot';
import type { Level, Lang, Chapter, Style, Starter, Sample, T } from '@/lib/data';

interface EditorScreenProps {
  t: T;
  lang: Lang;
  level: Level;
  chapter: Chapter;
  sample: Sample;
  styles: Style[];
  starters: Starter[];
  onTransform: () => void;
  onFocus: () => void;
  onAnalyze: () => void;
  onStyleClick: (id: string) => void;
  onSave?: (body: string) => void;
  onBodyChange?: (body: string) => void;
  tone?: string;
  length?: string;
  onToneChange?: (v: string) => void;
  onLengthChange?: (v: string) => void;
}

export function EditorScreen({ t, lang, level, chapter, sample, styles, starters, onTransform, onFocus, onAnalyze, onStyleClick, onSave, onBodyChange, tone = 'neutral', length = 'keep', onToneChange, onLengthChange }: EditorScreenProps) {
  const [title, setTitle] = useState(chapter.title);
  const [body, setBody] = useState(sample.raw);
  const [styleQuery, setStyleQuery] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(chapter.title);
    setBody(sample.raw);
  }, [chapter.id, sample.raw]);

  const fetchSuggestion = useCallback(async (text: string) => {
    if (text.trim().length < 15) return;
    setSuggesting(true);
    try {
      const res = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });
      const data = await res.json();
      if (data.completion) setSuggestion(data.completion);
    } catch {}
    setSuggesting(false);
  }, [lang]);

  const handleBodyChange = (val: string) => {
    setBody(val);
    onBodyChange?.(val);
    setSuggestion('');
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (val.trim().length >= 15) {
      suggestTimer.current = setTimeout(() => fetchSuggestion(val), 1200);
    }
    if (onSave) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => onSave(val), 1500);
    }
  };

  const acceptSuggestion = () => {
    if (!suggestion) return;
    const sep = body && !body.endsWith(' ') && !body.endsWith('\n') ? ' ' : '';
    handleBodyChange(body + sep + suggestion);
    setSuggestion('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      acceptSuggestion();
    } else if (suggestion && e.key !== 'Shift') {
      setSuggestion('');
    }
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;
  const visibleStyles = level === 'beginner'
    ? styles.filter(s => ['literary', 'minimalist', 'conversational'].includes(s.id))
    : styles;
  const filteredStyles = styleQuery
    ? visibleStyles.filter(s => s[lang].name.toLowerCase().includes(styleQuery.toLowerCase()))
    : visibleStyles;

  return (
    <>
      <div className="topbar">
        <div className="crumb">
          <span>{t.nav_drafts}</span>
          <span>›</span>
          <b>{lang === 'kr' ? `챕터 ${chapter.n}` : `Chapter ${chapter.n}`}</b>
        </div>
        <div className="spacer" />
        <span className="save-pill">{t.ed_save}</span>
        <button className="icon-btn" onClick={onAnalyze} title={t.ed_analysis} aria-label="analysis">⌖</button>
        <button className="icon-btn" onClick={onFocus} title={t.ed_focus} aria-label="focus">◐</button>
        <button className="btn btn-primary" onClick={onTransform}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>✦</span>
          {t.ed_transform}
        </button>
      </div>

      <div className={`editor-shell editor-shell-${level}`}>
        <div className="manuscript">
          <input className="manuscript-title" value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 placeholder={lang === 'kr' ? '제목 없음' : 'Untitled'} />
          <div className="manuscript-meta">
            <span>CHAPTER {String(chapter.n).padStart(2, '0')}</span>
            <span>·</span>
            <span>{wordCount.toLocaleString()} {t.ed_words}</span>
            <span>·</span>
            <span>{charCount.toLocaleString()} {t.ed_chars}</span>
          </div>
          <textarea
            className="manuscript-body"
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'kr' ? '한 문장으로 시작해 보세요...' : 'Start with a single sentence...'}
            spellCheck={false}
          />

          {(suggestion || suggesting) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
              {suggesting ? (
                <span style={{ color: 'var(--ink-4)', fontStyle: 'italic' }}>
                  {lang === 'kr' ? 'Inki가 생각 중…' : 'Inki is thinking…'}
                </span>
              ) : (
                <>
                  <span style={{ color: 'var(--ink-3)', fontStyle: 'italic', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {suggestion}
                  </span>
                  <button
                    onClick={acceptSuggestion}
                    style={{ padding: '2px 8px', fontSize: 11, background: 'var(--accent)', color: 'var(--accent-ink, #fff)', border: 'none', borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Tab ↵
                  </button>
                  <button
                    onClick={() => setSuggestion('')}
                    style={{ padding: '2px 6px', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-4)' }}>
                    ✕
                  </button>
                </>
              )}
            </div>
          )}

          {level === 'beginner' && (
            <div className="ed-starters">
              <div className="ed-starters-head">
                <InkiMascot size={32} mood="encouraging" />
                <div>
                  <div className="ed-starters-title">{t.ed_starters_title}</div>
                  <div className="ed-starters-sub">{t.ed_starters_sub}</div>
                </div>
              </div>
              <div className="ed-starters-grid">
                {starters.slice(0, 4).map((s, i) => (
                  <button key={i} className="starter-card"
                          onClick={() => handleBodyChange(body + (body ? '\n\n' : '') + s.body)}>
                    <span className="starter-tag">{s.tag}</span>
                    <span className="starter-title">{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {level !== 'beginner' && (
          <aside className="ed-rail">
            <div className="rail-section">
              <div className="rail-h">
                <span>{lang === 'kr' ? '스타일' : 'Styles'}</span>
                {level === 'pro' && (
                  <input className="rail-search" placeholder={lang === 'kr' ? '검색' : 'Search'}
                         value={styleQuery} onChange={(e) => setStyleQuery(e.target.value)} />
                )}
              </div>
              <div className="rail-styles">
                {filteredStyles.slice(0, level === 'pro' ? 10 : 6).map((s) => (
                  <button key={s.id} className="rail-style"
                          onClick={() => onStyleClick(s.id)}>
                    <span className="rail-style-icon" style={{ background: s.swatch + '22', color: s.swatch }}>
                      {s.icon}
                    </span>
                    <div className="rail-style-meta">
                      <div className="rail-style-name">{s[lang].name}</div>
                      <div className="rail-style-hint">{s[lang].hint}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rail-section">
              <div className="rail-h"><span>{lang === 'kr' ? '빠른 조정' : 'Quick controls'}</span></div>
              <div className="rail-control">
                <div className="rail-control-label">{t.sp_tone}</div>
                <div className="rail-seg">
                  {(['warm', 'neutral', 'cool'] as const).map((v, i) => (
                    <button key={v} data-on={tone === v ? '1' : '0'}
                            onClick={() => onToneChange?.(v)}>
                      {[t.sp_tone_warm, t.sp_tone_neutral, t.sp_tone_cool][i]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rail-control">
                <div className="rail-control-label">{t.sp_length}</div>
                <div className="rail-seg">
                  {(['short', 'keep', 'long'] as const).map((v, i) => (
                    <button key={v} data-on={length === v ? '1' : '0'}
                            onClick={() => onLengthChange?.(v)}>
                      {[t.sp_len_short, t.sp_len_keep, t.sp_len_long][i]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {level === 'pro' && (
              <div className="rail-section">
                <div className="rail-h"><span>{lang === 'kr' ? '문서' : 'Document'}</span></div>
                <div className="rail-stats">
                  {(() => {
                    const sents = body.split(/[.!?。！？]+/).map(s => s.trim()).filter(Boolean);
                    const wc = body.trim() ? body.trim().split(/\s+/).length : 0;
                    const avgSent = sents.length > 0 ? Math.round(wc / sents.length) : 0;
                    const wpm = lang === 'kr' ? 200 : 250;
                    const secs = Math.round((wc / wpm) * 60);
                    const readTime = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
                    const unique = new Set(body.toLowerCase().split(/\s+/).filter(Boolean)).size;
                    const diversity = wc > 0 ? (unique / wc).toFixed(2) : '0.00';
                    return (
                      <>
                        <div className="rail-stat">
                          <span className="rail-stat-label">{lang === 'kr' ? '평균 문장 길이' : 'Avg sentence'}</span>
                          <span className="rail-stat-val">{avgSent}</span>
                        </div>
                        <div className="rail-stat">
                          <span className="rail-stat-label">{lang === 'kr' ? '읽기 시간' : 'Read time'}</span>
                          <span className="rail-stat-val">{readTime}</span>
                        </div>
                        <div className="rail-stat">
                          <span className="rail-stat-label">{lang === 'kr' ? '어휘 다양성' : 'Vocabulary'}</span>
                          <span className="rail-stat-val">{diversity}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </>
  );
}

interface StylePickerProps {
  t: T;
  lang: Lang;
  styles: Style[];
  sample: Sample;
  level: Level;
  onClose: () => void;
  onApply: (id: string) => void;
}

export function StylePicker({ t, lang, styles, sample, level, onClose, onApply }: StylePickerProps) {
  const visible = level === 'beginner'
    ? styles.filter(s => ['literary', 'minimalist', 'conversational'].includes(s.id))
    : styles;
  const [idx, setIdx] = useState(0);
  const [tone, setTone] = useState('neutral');
  const [length, setLength] = useState('keep');
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

  const cur = visible[idx];
  const STRIDE = 180;

  const startDrag = (e: React.PointerEvent) => {
    setDragging(true);
    const startX = e.clientX;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const atLeft = idx === 0 && dx > 0;
      const atRight = idx === visible.length - 1 && dx < 0;
      setDragX((atLeft || atRight) ? dx * 0.3 : dx);
    };
    const up = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      setDragging(false);
      if (Math.abs(dx) > STRIDE * 0.4) {
        const dir = dx > 0 ? -1 : 1;
        setIdx((i) => Math.max(0, Math.min(visible.length - 1, i + dir)));
      }
      setDragX(0);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const previewFor = (styleId: string) => {
    if (styleId === 'literary' && sample.literary) return sample.literary;
    if (styleId === 'minimalist' && sample.minimalist) return sample.minimalist;
    return sample.literary
      ? sample.literary.split('. ').slice(0, 3).join('. ') + '.'
      : sample.raw;
  };

  const step = (delta: number) => {
    setIdx((i) => (i + delta + visible.length) % visible.length);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [visible.length]);

  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-panel fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="sp-head">
          <div>
            <h2 className="sp-title">{t.sp_title}</h2>
            <div className="sp-sub">{t.sp_sub}</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="close">✕</button>
        </div>

        <div className="sp-deck">
          <button className="sp-nav sp-nav-l" onClick={() => step(-1)} aria-label="prev">‹</button>
          <div ref={deckRef}
               className={dragging ? 'sp-deck-track sp-deck-dragging' : 'sp-deck-track'}
               onPointerDown={startDrag}>
            {visible.map((s, i) => {
              const off = i - idx;
              const abs = Math.abs(off);
              if (abs > 2) return null;
              const dragOffPct = (dragX / 320) * 56;
              const baseOff = off * 56;
              const finalOff = baseOff + dragOffPct;
              const dragAbs = Math.abs(off - dragX / STRIDE);
              return (
                <div key={s.id}
                     className="sp-card"
                     data-pos={off}
                     onClick={() => !dragging && setIdx(i)}
                     style={{
                       '--swatch': s.swatch,
                       transform: `translateX(${finalOff}%) scale(${Math.max(0.7, 1 - dragAbs * 0.08)})`,
                       opacity: dragAbs > 1.5 ? 0.25 : dragAbs > 0.5 ? Math.max(0.4, 1 - (dragAbs - 0.5) * 0.6) : 1,
                       zIndex: 10 - Math.round(dragAbs),
                       transition: dragging ? 'none' : 'transform 0.32s cubic-bezier(.2,.7,.3,1), opacity 0.32s, border-color 0.2s',
                       pointerEvents: abs <= 1 ? 'auto' : 'none',
                     } as React.CSSProperties}>
                  <div className="sp-card-head">
                    <span className="sp-card-icon" style={{ background: s.swatch + '22', color: s.swatch }}>
                      {s.icon}
                    </span>
                    <div>
                      <div className="sp-card-name">{s[lang].name}</div>
                      <div className="sp-card-hint">{s[lang].hint}</div>
                    </div>
                  </div>
                  <div className="sp-card-preview">
                    {previewFor(s.id)}
                  </div>
                  <div className="sp-card-badge">{t.sp_preview}</div>
                </div>
              );
            })}
          </div>
          <button className="sp-nav sp-nav-r" onClick={() => step(1)} aria-label="next">›</button>
        </div>

        <div className="sp-dots">
          {visible.map((s, i) => (
            <button key={s.id} className="sp-dot" data-on={i === idx ? '1' : '0'}
                    onClick={() => setIdx(i)} aria-label={s[lang].name} />
          ))}
        </div>

        <div className="sp-controls">
          <div className="sp-ctrl">
            <div className="sp-ctrl-label">{t.sp_tone}</div>
            <div className="rail-seg">
              {([['warm', t.sp_tone_warm], ['neutral', t.sp_tone_neutral], ['cool', t.sp_tone_cool]] as [string, string][]).map(([v, l]) => (
                <button key={v} data-on={tone === v ? '1' : '0'} onClick={() => setTone(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="sp-ctrl">
            <div className="sp-ctrl-label">{t.sp_length}</div>
            <div className="rail-seg">
              {([['short', t.sp_len_short], ['keep', t.sp_len_keep], ['long', t.sp_len_long]] as [string, string][]).map(([v, l]) => (
                <button key={v} data-on={length === v ? '1' : '0'} onClick={() => setLength(v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="sp-foot">
          <div className="sp-foot-tip">
            <InkiMascot size={28} mood="wink" />
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              {lang === 'kr'
                ? `${cur[lang].name} 스타일로 다듬으면 호흡이 ${tone === 'warm' ? '따뜻해져요' : tone === 'cool' ? '서늘해져요' : '균형 잡혀요'}.`
                : `${cur[lang].name} will make the prose ${tone === 'warm' ? 'warmer' : tone === 'cool' ? 'cooler' : 'more balanced'}.`}
            </span>
          </div>
          <button className="btn btn-primary" style={{ padding: '10px 18px' }}
                  onClick={() => onApply(cur.id)}>
            {t.sp_apply} →
          </button>
        </div>
      </div>
    </div>
  );
}
