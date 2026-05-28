'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { InkiMascot } from './mascot';
import type { Level, Lang, Chapter, Style, Starter, Sample, T } from '@/lib/data';
import { WRITING_FORMATS } from '@/lib/data';
import { getSnapshots, saveSnapshot, deleteSnapshot, type Snapshot } from '@/lib/snapshots';
import { getDrafts, createDraft, deleteDraft, type Draft } from '@/lib/drafts';

interface CheckIssue {
  severity: 'warning' | 'error';
  field: string;
  issue: string;
  suggestion: string;
}

interface GuideData {
  contradictions: Array<{ severity: string; issue: string; suggestion: string }>;
  analysis: { summary: string; momentum: string; gaps: string[] } | null;
  suggestions: Array<{ type: string; label: string; text: string; starter?: string }>;
}

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
  chapterId?: string;
  allChapterBodies?: string[];
  writingFormat?: string;
  onFormatPick?: () => void;
  tone?: string;
  length?: string;
  onToneChange?: (v: string) => void;
  onLengthChange?: (v: string) => void;
}

export function EditorScreen({ t, lang, level, chapter, sample, styles, starters, onTransform, onFocus, onAnalyze, onStyleClick, onSave, onBodyChange, chapterId, allChapterBodies, writingFormat = 'novel_literary', onFormatPick, tone = 'neutral', length = 'keep', onToneChange, onLengthChange }: EditorScreenProps) {
  const formatData = WRITING_FORMATS.find(f => f.id === writingFormat);
  const [title, setTitle] = useState(chapter.title);
  const [body, setBody] = useState(sample.raw);
  const [styleQuery, setStyleQuery] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AI Consistency Check
  const [checkIssues, setCheckIssues] = useState<CheckIssue[]>([]);
  const [checking, setChecking] = useState(false);
  const [showCheckPanel, setShowCheckPanel] = useState(false);

  // Snapshots
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [showSnapPanel, setShowSnapPanel] = useState(false);
  const prevWordCount = useRef(0);

  // Alternative Drafts
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showDraftMenu, setShowDraftMenu] = useState(false);

  // Guide panel
  const [showGuidePanel, setShowGuidePanel] = useState(false);
  const [guideTab, setGuideTab] = useState<'analysis' | 'contradictions' | 'suggestions'>('analysis');
  const [guideData, setGuideData] = useState<GuideData | null>(null);
  const [guiding, setGuiding] = useState(false);

  // Auto-write
  const [autoWriting, setAutoWriting] = useState(false);
  const autoWriteAbort = useRef<AbortController | null>(null);
  const isAutoWritingRef = useRef(false);

  // Canvas pan/zoom
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const tfRef = useRef({ x: 0, y: 0, scale: 1 });
  const [scaleLabel, setScaleLabel] = useState(100);
  const isPanning = useRef(false);
  const spaceHeld = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const applyTf = useCallback(() => {
    if (!canvasRef.current) return;
    const { x, y, scale } = tfRef.current;
    canvasRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    setScaleLabel(Math.round(scale * 100));
  }, []);

  const centerCanvas = useCallback(() => {
    if (!stageRef.current) return;
    const stageW = stageRef.current.offsetWidth;
    tfRef.current = {
      x: Math.max(40, (stageW - 680) / 2),
      y: 60,
      scale: 1,
    };
    applyTf();
  }, [applyTf]);

  const resetCanvas = useCallback(() => {
    centerCanvas();
  }, [centerCanvas]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const { x, y, scale } = tfRef.current;
        const delta = e.deltaY * -0.004;
        const newScale = Math.min(3, Math.max(0.25, scale + delta));
        const ratio = newScale / scale;
        tfRef.current = { x: cx - ratio * (cx - x), y: cy - ratio * (cy - y), scale: newScale };
      } else {
        tfRef.current.x -= e.deltaX;
        tfRef.current.y -= e.deltaY;
      }
      applyTf();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyTf]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault(); spaceHeld.current = true;
        if (stageRef.current) stageRef.current.style.cursor = 'grab';
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '0') { e.preventDefault(); resetCanvas(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        const s = Math.min(3, tfRef.current.scale + 0.1);
        tfRef.current.scale = s; applyTf();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        const s = Math.max(0.25, tfRef.current.scale - 0.1);
        tfRef.current.scale = s; applyTf();
      }
      if (e.key === 'Escape' && isAutoWritingRef.current) { stopAutoWrite(); }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeld.current = false;
        if (stageRef.current) stageRef.current.style.cursor = '';
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [applyTf, resetCanvas]);

  useEffect(() => {
    centerCanvas();
    window.addEventListener('resize', centerCanvas);
    return () => window.removeEventListener('resize', centerCanvas);
  }, [centerCanvas]);

  const onStageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const tgt = e.target as HTMLElement;
    const onBg = tgt === stageRef.current || tgt === canvasRef.current;
    if (onBg || spaceHeld.current || e.button === 1) {
      e.preventDefault();
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      if (stageRef.current) stageRef.current.style.cursor = 'grabbing';
    }
  };
  const onStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning.current) return;
    tfRef.current.x += e.clientX - lastMouse.current.x;
    tfRef.current.y += e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    applyTf();
  };
  const onStageMouseUp = () => {
    isPanning.current = false;
    if (stageRef.current) stageRef.current.style.cursor = spaceHeld.current ? 'grab' : '';
  };

  useEffect(() => {
    setTitle(chapter.title);
    setBody(sample.raw);
    if (chapterId) {
      setSnaps(getSnapshots(chapterId));
      setDrafts(getDrafts(chapterId));
    }
    prevWordCount.current = sample.raw.trim().split(/\s+/).filter(Boolean).length;
    setCheckIssues([]);
    setShowCheckPanel(false);
  }, [chapter.id, sample.raw, chapterId]);

  const fetchSuggestion = useCallback(async (text: string) => {
    if (text.trim().length < 15) return;
    setSuggesting(true);
    try {
      const res = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang, format: writingFormat }),
      });
      const data = await res.json();
      if (data.completion) setSuggestion(data.completion);
    } catch {}
    setSuggesting(false);
  }, [lang]);

  const handleBodyChange = (val: string) => {
    setBody(val);
    onBodyChange?.(val);
    if (!isAutoWritingRef.current) {
      setSuggestion('');
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (val.trim().length >= 15) {
        suggestTimer.current = setTimeout(() => fetchSuggestion(val), 1200);
      }
    }
    if (onSave) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => onSave(val), 1500);
    }
    // Auto-snapshot every 500 words
    if (chapterId) {
      const wc = val.trim().split(/\s+/).filter(Boolean).length;
      if (wc > 0 && Math.floor(wc / 500) > Math.floor(prevWordCount.current / 500)) {
        const snap = saveSnapshot(chapterId, val, 'auto');
        setSnaps(prev => [snap, ...prev]);
      }
      prevWordCount.current = wc;
    }
  };

  const acceptSuggestion = () => {
    if (!suggestion) return;
    const sep = body && !body.endsWith(' ') && !body.endsWith('\n') ? ' ' : '';
    handleBodyChange(body + sep + suggestion);
    setSuggestion('');
  };

  const runCheck = useCallback(async () => {
    if (!body.trim()) return;
    setChecking(true);
    setShowCheckPanel(true);
    setShowSnapPanel(false);
    setShowDraftMenu(false);
    try {
      const bibleRaw = localStorage.getItem('cowriter-bible');
      const bible = bibleRaw ? JSON.parse(bibleRaw) : {};
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: body, bible, lang, format: writingFormat }),
      });
      const data = await res.json();
      setCheckIssues(data.issues || []);
    } catch { setCheckIssues([]); }
    setChecking(false);
  }, [body, lang]);

  const takeSnapshot = useCallback(() => {
    if (!chapterId || !body.trim()) return;
    const snap = saveSnapshot(chapterId, body, 'manual');
    setSnaps(prev => [snap, ...prev]);
    setShowSnapPanel(true);
    setShowCheckPanel(false);
    setShowDraftMenu(false);
  }, [chapterId, body]);

  const forkDraft = useCallback(() => {
    if (!chapterId || !body.trim()) return;
    const label = lang === 'kr' ? `대안 초안 ${drafts.length + 1}` : `Alt Draft ${drafts.length + 1}`;
    const draft = createDraft(chapterId, label, body);
    setDrafts(prev => [...prev, draft]);
    setShowDraftMenu(true);
    setShowCheckPanel(false);
    setShowSnapPanel(false);
  }, [chapterId, body, drafts.length, lang]);

  const openGuide = useCallback(async () => {
    if (!body.trim()) return;
    setGuiding(true);
    setShowGuidePanel(true);
    setShowCheckPanel(false);
    setShowSnapPanel(false);
    setShowDraftMenu(false);
    setGuideTab('analysis');
    try {
      const bibleRaw = typeof window !== 'undefined' ? localStorage.getItem('cowriter-bible') : null;
      const bible = bibleRaw ? JSON.parse(bibleRaw) : {};
      const allText = allChapterBodies?.join('\n\n') || body;
      const res = await fetch('/api/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: body, allText, bible, lang, format: writingFormat }),
      });
      const data = await res.json();
      setGuideData(data);
    } catch { setGuideData(null); }
    setGuiding(false);
  }, [body, lang, allChapterBodies]);

  const startAutoWrite = useCallback(async () => {
    if (!body.trim() || autoWriting) return;
    const controller = new AbortController();
    autoWriteAbort.current = controller;
    setAutoWriting(true);
    isAutoWritingRef.current = true;
    setSuggestion('');
    try {
      const bibleRaw = typeof window !== 'undefined' ? localStorage.getItem('cowriter-bible') : null;
      const bible = bibleRaw ? JSON.parse(bibleRaw) : {};
      const allText = allChapterBodies?.join('\n\n') || body;
      const res = await fetch('/api/autowrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: body, allText, bible, lang, format: writingFormat }),
        signal: controller.signal,
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let current = body;
      let first = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done || controller.signal.aborted) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          if (first) { current += current.endsWith('\n') ? '\n' : '\n\n'; first = false; }
          current += chunk;
          setBody(current);
          onBodyChange?.(current);
        }
      }
      if (onSave) onSave(current);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') console.error('Autowrite error:', err);
    } finally {
      setAutoWriting(false);
      isAutoWritingRef.current = false;
      autoWriteAbort.current = null;
    }
  }, [body, lang, allChapterBodies, autoWriting, onBodyChange, onSave]);

  const stopAutoWrite = useCallback(() => {
    autoWriteAbort.current?.abort();
  }, []);

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
        {/* Writing format badge */}
        <button onClick={onFormatPick}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px 3px 8px', fontSize: 12, fontWeight: 600, background: formatData ? formatData.swatch + '18' : 'var(--surface-2)', border: `1px solid ${formatData ? formatData.swatch + '44' : 'var(--border)'}`, borderRadius: 999, cursor: 'pointer', color: formatData?.swatch || 'var(--ink-2)', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
          <span style={{ fontSize: 14 }}>{formatData?.icon || '📖'}</span>
          {formatData?.[lang].name || (lang === 'kr' ? '형식 선택' : 'Format')}
        </button>
        <div className="crumb">
          <span>{t.nav_drafts}</span>
          <span>›</span>
          <b>{lang === 'kr' ? `챕터 ${chapter.n}` : `Chapter ${chapter.n}`}</b>
        </div>
        <div className="spacer" />
        <span className="save-pill">{t.ed_save}</span>
        {/* Auto-write */}
        {autoWriting ? (
          <button onClick={stopAutoWrite}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', fontSize: 12, fontWeight: 600, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }} />
            {lang === 'kr' ? '⏹ 중단 (Esc)' : '⏹ Stop (Esc)'}
          </button>
        ) : (
          <button className="icon-btn" onClick={startAutoWrite}
            title={lang === 'kr' ? 'AI 자동 작성' : 'AI auto-write'}
            aria-label="auto-write"
            style={{ fontSize: 15 }}>✍</button>
        )}
        {/* Guide */}
        <button className="icon-btn" onClick={openGuide}
          title={lang === 'kr' ? '서사 가이드 · 개연성 분석' : 'Narrative guide · Story analysis'}
          aria-label="guide"
          style={{ position: 'relative', fontSize: 15 }}>
          🧭
          {guideData && (guideData.contradictions.length > 0) && (
            <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 14, height: 14, borderRadius: 7, background: '#ef4444', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {guideData.contradictions.length}
            </span>
          )}
        </button>
        {/* AI Check */}
        <button className="icon-btn" onClick={runCheck}
          title={lang === 'kr' ? 'AI 일관성 검사' : 'AI consistency check'}
          aria-label="check"
          style={{ position: 'relative' }}>
          ⚡
          {checkIssues.length > 0 && (
            <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 14, height: 14, borderRadius: 7, background: checkIssues.some(i => i.severity === 'error') ? '#ef4444' : '#f59e0b', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {checkIssues.length}
            </span>
          )}
        </button>
        {/* Snapshot */}
        <button className="icon-btn" onClick={takeSnapshot}
          title={lang === 'kr' ? `스냅샷 저장 (${snaps.length}개)` : `Save snapshot (${snaps.length})`}
          aria-label="snapshot"
          style={{ position: 'relative' }}
          onContextMenu={(e) => { e.preventDefault(); setShowSnapPanel(v => !v); setShowCheckPanel(false); setShowDraftMenu(false); }}>
          ⏱
          {snaps.length > 0 && (
            <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 14, height: 14, borderRadius: 7, background: 'var(--accent)', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {snaps.length}
            </span>
          )}
        </button>
        {/* Alt Drafts */}
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={forkDraft}
            title={lang === 'kr' ? '대안 초안 저장' : 'Fork as alt draft'}
            aria-label="fork draft"
            onContextMenu={(e) => { e.preventDefault(); if (drafts.length > 0) { setShowDraftMenu(v => !v); setShowCheckPanel(false); setShowSnapPanel(false); } }}>
            ⎇
            {drafts.length > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 14, height: 14, borderRadius: 7, background: 'var(--accent)', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {drafts.length}
              </span>
            )}
          </button>
          {showDraftMenu && drafts.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 300, minWidth: 240, padding: '6px 0' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '6px 12px 4px', fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {lang === 'kr' ? '대안 초안' : 'Alternative Drafts'}
              </div>
              {drafts.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', gap: 8, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{d.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{d.wordCount.toLocaleString()} {lang === 'kr' ? '단어' : 'words'} · {new Date(d.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => { if (confirm(lang === 'kr' ? '현재 내용을 이 초안으로 교체할까요?' : 'Replace current content with this draft?')) { handleBodyChange(d.body); setShowDraftMenu(false); } }}
                    style={{ padding: '3px 8px', fontSize: 11, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', color: 'var(--ink-2)' }}>
                    {lang === 'kr' ? '복원' : 'Restore'}
                  </button>
                  <button onClick={() => { deleteDraft(chapterId!, d.id); setDrafts(prev => prev.filter(x => x.id !== d.id)); }}
                    style={{ padding: '3px 6px', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-4)' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="icon-btn" onClick={onAnalyze} title={t.ed_analysis} aria-label="analysis">⌖</button>
        <button className="icon-btn" onClick={onFocus} title={t.ed_focus} aria-label="focus">◐</button>
        <button className="btn btn-primary" onClick={onTransform}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>✦</span>
          {t.ed_transform}
        </button>
      </div>

      <div className={`editor-shell editor-shell-${level}`}>
        {/* Canvas stage */}
        <div ref={stageRef} className="manuscript-stage"
             onMouseDown={onStageMouseDown}
             onMouseMove={onStageMouseMove}
             onMouseUp={onStageMouseUp}
             onMouseLeave={onStageMouseUp}>
          <div ref={canvasRef} className="manuscript-canvas">
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
          </div>{/* /manuscript-canvas */}

          {/* Zoom controls */}
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 10, userSelect: 'none' }}>
            <button onClick={() => { tfRef.current.scale = Math.max(0.25, tfRef.current.scale - 0.1); applyTf(); }}
              style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', minWidth: 36, textAlign: 'center' }}>{scaleLabel}%</span>
            <button onClick={() => { tfRef.current.scale = Math.min(3, tfRef.current.scale + 0.1); applyTf(); }}
              style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
            <button onClick={resetCanvas} title={lang === 'kr' ? '원래 크기로' : 'Reset zoom (⌘0)'}
              style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--ink-3)' }}>↺</button>
          </div>
        </div>{/* /manuscript-stage */}

        {/* AI Check panel */}
        {showCheckPanel && (
          <div style={{ position: 'fixed', top: 52, right: 0, width: 300, height: 'calc(100vh - 52px)', background: 'var(--surface-1)', borderLeft: '1px solid var(--border)', zIndex: 150, overflowY: 'auto', padding: 16, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}
               onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>⚡ {lang === 'kr' ? 'AI 일관성 검사' : 'AI Consistency'}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{lang === 'kr' ? 'Story Bible과 비교' : 'vs. Story Bible'}</div>
              </div>
              <button onClick={() => setShowCheckPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--ink-3)' }}>✕</button>
            </div>
            {checking ? (
              <div style={{ color: 'var(--ink-3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0' }}>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>◐</span>
                {lang === 'kr' ? '검사 중…' : 'Checking…'}
              </div>
            ) : checkIssues.length === 0 ? (
              <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                {lang === 'kr' ? 'Story Bible과 일치합니다.' : 'No inconsistencies found.'}
                {!localStorage.getItem('cowriter-bible') && (
                  <div style={{ fontSize: 11, marginTop: 8, color: 'var(--ink-4)' }}>{lang === 'kr' ? 'Story Bible을 먼저 작성하세요.' : 'Set up your Story Bible first.'}</div>
                )}
              </div>
            ) : (
              checkIssues.map((issue, i) => (
                <div key={i} style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: issue.severity === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${issue.severity === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: issue.severity === 'error' ? '#dc2626' : '#d97706', marginBottom: 4 }}>
                    {issue.severity === 'error' ? '⚠ 오류' : '△ 주의'} · {issue.field}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>{issue.issue}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.4 }}>💡 {issue.suggestion}</div>
                </div>
              ))
            )}
            <button onClick={runCheck} style={{ marginTop: 8, width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--ink-2)' }}>
              {lang === 'kr' ? '다시 검사' : 'Re-check'}
            </button>
          </div>
        )}

        {/* Guide panel */}
        {showGuidePanel && (
          <div style={{ position: 'fixed', top: 52, right: 0, width: 320, height: 'calc(100vh - 52px)', background: 'var(--surface-1)', borderLeft: '1px solid var(--border)', zIndex: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>🧭 {lang === 'kr' ? '서사 가이드' : 'Narrative Guide'}</div>
                <button onClick={() => setShowGuidePanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--ink-3)' }}>✕</button>
              </div>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                {([['analysis', lang === 'kr' ? '분석' : 'Analysis', '📍'],
                   ['contradictions', lang === 'kr' ? '모순' : 'Issues', '⚠'],
                   ['suggestions', lang === 'kr' ? '제안' : 'Ideas', '💡']] as [typeof guideTab, string, string][]).map(([id, label, icon]) => (
                  <button key={id} onClick={() => setGuideTab(id)}
                    style={{ flex: 1, padding: '5px 4px', fontSize: 11, fontWeight: guideTab === id ? 700 : 400, background: guideTab === id ? 'var(--accent)' : 'var(--surface-2)', color: guideTab === id ? '#fff' : 'var(--ink-3)', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    {icon} {label}
                    {id === 'contradictions' && guideData && guideData.contradictions.length > 0 && (
                      <span style={{ background: guideTab === id ? 'rgba(255,255,255,0.3)' : '#ef4444', color: '#fff', borderRadius: 999, padding: '0 4px', fontSize: 9, fontWeight: 700 }}>{guideData.contradictions.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {guiding ? (
                <div style={{ color: 'var(--ink-3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, padding: '24px 0' }}>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>◐</span>
                  {lang === 'kr' ? '전체 스토리 분석 중…' : 'Analyzing full story…'}
                </div>
              ) : !guideData ? (
                <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
                  {lang === 'kr' ? '아직 분석 결과가 없습니다.' : 'No analysis yet.'}
                </div>
              ) : (
                <>
                  {/* Analysis tab */}
                  {guideTab === 'analysis' && guideData.analysis && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'kr' ? '지금까지의 이야기' : 'Story so far'}</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{guideData.analysis.summary}</div>
                      </div>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'kr' ? '현재 서사 흐름' : 'Current momentum'}</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{guideData.analysis.momentum}</div>
                      </div>
                      {guideData.analysis.gaps.length > 0 && (
                        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'kr' ? '발전이 필요한 부분' : 'Needs development'}</div>
                          {guideData.analysis.gaps.map((gap, i) => (
                            <div key={i} style={{ fontSize: 13, lineHeight: 1.5, marginBottom: i < guideData.analysis!.gaps.length - 1 ? 8 : 0, display: 'flex', gap: 6 }}>
                              <span style={{ color: '#d97706', flexShrink: 0 }}>→</span> {gap}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contradictions tab */}
                  {guideTab === 'contradictions' && (
                    guideData.contradictions.length === 0 ? (
                      <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                        {lang === 'kr' ? '모순이나 개연성 문제가 없습니다.' : 'No contradictions or logic issues found.'}
                      </div>
                    ) : (
                      guideData.contradictions.map((c, i) => (
                        <div key={i} style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: c.severity === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${c.severity === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: c.severity === 'error' ? '#dc2626' : '#d97706', marginBottom: 5 }}>
                            {c.severity === 'error' ? '⚠ 오류' : '△ 주의'}
                          </div>
                          <div style={{ fontSize: 13, lineHeight: 1.5 }}>{c.issue}</div>
                          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.4, borderTop: '1px solid var(--border)', paddingTop: 8 }}>💡 {c.suggestion}</div>
                        </div>
                      ))
                    )
                  )}

                  {/* Suggestions tab */}
                  {guideTab === 'suggestions' && (
                    guideData.suggestions.length === 0 ? (
                      <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
                        {lang === 'kr' ? '제안이 없습니다.' : 'No suggestions.'}
                      </div>
                    ) : (
                      guideData.suggestions.map((s, i) => {
                        const typeColors: Record<string, string> = { plot: '#6366f1', character: '#ec4899', tension: '#ef4444', world: '#10b981' };
                        const typeColor = typeColors[s.type] || 'var(--accent)';
                        return (
                          <div key={i} style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: typeColor + '22', color: typeColor }}>
                                {s.type}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
                            </div>
                            <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: s.starter ? 10 : 0 }}>{s.text}</div>
                            {s.starter && (
                              <button onClick={() => handleBodyChange(body + (body.endsWith('\n') ? '\n' : '\n\n') + s.starter)}
                                style={{ width: '100%', marginTop: 8, padding: '7px 10px', fontSize: 12, background: typeColor, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, textAlign: 'left', lineHeight: 1.4 }}>
                                ↳ {s.starter}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <button onClick={openGuide} style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--ink-2)' }}>
                {lang === 'kr' ? '다시 분석' : 'Re-analyze'}
              </button>
            </div>
          </div>
        )}

        {/* Snapshot panel */}
        {showSnapPanel && (
          <div style={{ position: 'fixed', bottom: 0, left: 240, right: 0, height: 300, background: 'var(--surface-1)', borderTop: '1px solid var(--border)', zIndex: 150, overflowY: 'auto', padding: 16, boxShadow: '0 -4px 24px rgba(0,0,0,0.1)' }}
               onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>⏱ {lang === 'kr' ? '버전 이력' : 'Version History'}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{lang === 'kr' ? '우클릭→목록 열기 / 클릭→새 스냅샷' : 'Right-click=list / Click=new snapshot'}</div>
              </div>
              <button onClick={() => setShowSnapPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--ink-3)' }}>✕</button>
            </div>
            {snaps.length === 0 ? (
              <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{lang === 'kr' ? '아직 스냅샷이 없습니다.' : 'No snapshots yet.'}</div>
            ) : (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                {snaps.map(s => (
                  <div key={s.id} style={{ minWidth: 180, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: s.label === 'auto' ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.15)', color: s.label === 'auto' ? '#6366f1' : '#16a34a' }}>
                        {s.label === 'auto' ? (lang === 'kr' ? '자동' : 'auto') : (lang === 'kr' ? '수동' : 'manual')}
                      </span>
                      <button onClick={() => { deleteSnapshot(chapterId!, s.id); setSnaps(prev => prev.filter(x => x.id !== s.id)); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-4)', padding: 2 }}>✕</button>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>
                      {new Date(s.createdAt).toLocaleDateString()} {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <br />{s.wordCount.toLocaleString()} {lang === 'kr' ? '단어' : 'words'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                      {s.body.slice(0, 80)}…
                    </div>
                    <button onClick={() => { if (confirm(lang === 'kr' ? '이 버전으로 복원할까요?' : 'Restore this version?')) { handleBodyChange(s.body); setShowSnapPanel(false); } }}
                      style={{ width: '100%', padding: '5px 0', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      {lang === 'kr' ? '이 버전으로 복원' : 'Restore'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
