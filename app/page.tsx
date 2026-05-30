'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthScreen, type AuthUser } from '@/components/auth';
import { OnboardingScreen } from '@/components/onboarding';
import { Sidebar, DashboardScreen } from '@/components/sidebar';
import { EditorScreen, StylePicker } from '@/components/editor';
import { DiffView, AnalysisScreen, FocusScreen } from '@/components/result';
import { StoryBibleScreen } from '@/components/bible';
import { FormatPicker } from '@/components/format-picker';
import { ExportModal } from '@/components/export-modal';
import {
  STYLES, STARTERS, SAMPLE, NOTES, CHAPTERS, T,
  type Lang, type Level, type Palette, type Typeset, type Route, type Chapter,
} from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fetchChapters, upsertChapter, createChapter, type ChapterRow } from '@/lib/chapters';

function rowToChapter(row: ChapterRow, lang: Lang): Chapter {
  const now = new Date(row.updated_at);
  const diffMs = Date.now() - now.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const updated = diffDays === 0
    ? (lang === 'kr' ? `오늘 ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}` : `Today ${now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`)
    : diffDays === 1 ? (lang === 'kr' ? '어제' : 'Yesterday')
    : lang === 'kr' ? `${diffDays}일 전` : `${diffDays} days ago`;
  return {
    id: row.id,
    n: row.n,
    title: row.title || (lang === 'kr' ? '제목 없음' : 'Untitled'),
    words: row.words,
    status: row.status,
    updated,
  };
}

export default function CoWriterApp() {
  const [lang, setLang] = useState<Lang>('kr');
  const [level, setLevel] = useState<Level>('growing');
  const [palette, setPalette] = useState<Palette>('twilight');
  const [typeset, setTypeset] = useState<Typeset>('manuscript');
  const [dark, setDark] = useState(false);
  const [route, setRoute] = useState<Route>('auth');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dbChapters, setDbChapters] = useState<ChapterRow[]>([]);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState('literary');
  const [showSettings, setShowSettings] = useState(false);
  const [diffBodyRaw, setDiffBodyRaw] = useState('');
  const [selectedTone, setSelectedTone] = useState('neutral');
  const [selectedLength, setSelectedLength] = useState('keep');
  const [initializing, setInitializing] = useState(true);
  const [writingFormat, setWritingFormat] = useState('novel_literary');
  const [showFormatPicker, setShowFormatPicker] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const liveBodyRef = useRef<string>('');

  const t = T[lang];
  const starters = STARTERS[lang];
  const sample = SAMPLE[lang];
  const notes = NOTES[lang];

  const chapters: Chapter[] = dbChapters.map(r => rowToChapter(r, lang));
  const currentChapter = chapters.find(c => c.id === currentChapterId) || chapters[0];
  const currentRow = dbChapters.find(r => r.id === currentChapterId) || dbChapters[0];

  // sync live body ref when chapter changes (DB value as baseline)
  useEffect(() => {
    liveBodyRef.current = currentRow?.body ?? '';
  }, [currentRow?.id]);

  const loadChapters = useCallback(async (uid: string) => {
    try {
      const rows = await fetchChapters(uid);
      if (rows.length === 0) {
        // 신규 유저 — 첫 챕터 자동 생성
        const first = await createChapter(uid, 1, lang === 'kr' ? '첫 번째 챕터' : 'Chapter One');
        setDbChapters([first]);
        setCurrentChapterId(first.id);
      } else {
        setDbChapters(rows);
        setCurrentChapterId(rows[0].id);
      }
    } catch (e) {
      console.error('챕터 로드 실패', e);
    }
  }, [lang]);

  const handleSignedIn = useCallback(async (u: AuthUser) => {
    setUser(u);
    if (u.guest) {
      const guestRows: import('@/lib/chapters').ChapterRow[] = CHAPTERS[lang].map(c => ({
        id: c.id, user_id: 'guest', n: c.n, title: c.title,
        body: c.n === 1 ? SAMPLE[lang].raw : '',
        words: c.words, status: c.status as 'draft' | 'styled' | 'new',
        updated_at: new Date().toISOString(), created_at: new Date().toISOString(),
      }));
      setDbChapters(guestRows);
      setCurrentChapterId(guestRows[0].id);
      setRoute('onboarding');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id ?? null;
    setUserId(uid);
    if (uid) await loadChapters(uid);
    setRoute('onboarding');
  }, [loadChapters, lang]);

  useEffect(() => {
    const saved = localStorage.getItem('cowriter-format');
    if (saved) setWritingFormat(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('cowriter-format', writingFormat);
  }, [writingFormat]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        setUser({ email: u.email!, name: u.user_metadata?.name || u.email!.split('@')[0] });
        setUserId(u.id);
        await loadChapters(u.id);
        setRoute('dashboard');
      }
      setInitializing(false);
    });
  }, [loadChapters]);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-palette', palette);
    html.setAttribute('data-typeset', typeset);
    html.setAttribute('data-theme', dark ? 'dark' : 'light');
    html.setAttribute('lang', lang === 'kr' ? 'ko' : 'en');
  }, [palette, typeset, dark, lang]);

  const handleSaveBody = useCallback(async (body: string) => {
    if (!currentRow || !userId) return;
    const updated = await upsertChapter({ ...currentRow, body });
    setDbChapters(prev => prev.map(r => r.id === updated.id ? updated : r));
  }, [currentRow, userId]);

  const handleNewChapter = useCallback(async () => {
    const n = dbChapters.length + 1;
    const title = lang === 'kr' ? `챕터 ${n}` : `Chapter ${n}`;
    if (!userId) {
      const guestRow: import('@/lib/chapters').ChapterRow = {
        id: `guest-${n}-${Date.now()}`, user_id: 'guest',
        n, title, body: '', words: 0, status: 'new',
        updated_at: new Date().toISOString(), created_at: new Date().toISOString(),
      };
      setDbChapters(prev => [...prev, guestRow]);
      setCurrentChapterId(guestRow.id);
      setRoute('editor');
      return;
    }
    const row = await createChapter(userId, n, title);
    setDbChapters(prev => [...prev, row]);
    setCurrentChapterId(row.id);
    setRoute('editor');
  }, [userId, dbChapters.length, lang]);

  const handleTransform = () => setPickerOpen(true);
  const handleApplyStyle = (id: string) => {
    const body = liveBodyRef.current || currentRow?.body || '';
    if (!body.trim()) {
      alert(lang === 'kr' ? '먼저 내용을 써봐요!' : 'Write something first!');
      return;
    }
    setDiffBodyRaw(body);
    setSelectedStyleId(id);
    setPickerOpen(false);
    setRoute('diff');
  };
  const handleAcceptTransform = (text: string) => {
    if (text) handleSaveBody(text);
    setRoute('editor');
  };

  // DB body를 그대로 사용 (빈 string도 유효 — || 대신 ?? 사용)
  const editorSample = currentRow
    ? { ...sample, raw: currentRow.body ?? '' }
    : sample;

  if (initializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12, color: 'var(--ink-3)' }}>
        <div style={{ fontSize: 28 }}>◐</div>
        <div style={{ fontSize: 13 }}>{lang === 'kr' ? '불러오는 중…' : 'Loading…'}</div>
      </div>
    );
  }

  if (route === 'auth') {
    return <AuthScreen t={t} lang={lang} onSignedIn={handleSignedIn} />;
  }

  if (route === 'onboarding') {
    return (
      <OnboardingScreen
        t={t} lang={lang} level={level} setLevel={setLevel}
        onDone={() => setRoute('dashboard')}
        onSkip={() => setRoute('dashboard')}
      />
    );
  }

  if (route === 'focus') {
    if (!currentChapter) { setRoute('dashboard'); return null; }
    return (
      <FocusScreen
        t={t} lang={lang} chapter={currentChapter} sample={editorSample}
        onExit={() => setRoute('editor')}
        onSave={handleSaveBody}
      />
    );
  }

  return (
    <div className="app" data-level={level === 'kids' ? 'beginner' : level}>
      <Sidebar
        t={t} lang={lang} level={level}
        chapters={chapters} currentChapter={currentChapterId ?? ''}
        setCurrentChapter={setCurrentChapterId}
        route={route} setRoute={setRoute}
        onLevelClick={() => setRoute('onboarding')}
        onNewChapter={handleNewChapter}
        onExport={() => setShowExportModal(true)}
        userName={user?.name}
        userEmail={user?.guest ? (lang === 'kr' ? '게스트 모드' : 'Guest mode') : user?.email}
        onSettings={() => setShowSettings(v => !v)}
      />

      <main className="main">
        {route === 'dashboard' && (
          <DashboardScreen
            t={t} lang={lang} level={level}
            chapters={chapters} starters={starters}
            setCurrentChapter={setCurrentChapterId}
            setRoute={setRoute}
          />
        )}

        {route === 'editor' && currentChapter && (
          <EditorScreen
            t={t} lang={lang} level={level}
            chapter={currentChapter} sample={editorSample}
            styles={STYLES} starters={starters}
            onTransform={handleTransform}
            onFocus={() => setRoute('focus')}
            onAnalyze={() => setRoute('analysis')}
            onStyleClick={(id) => {
              const body = liveBodyRef.current || currentRow?.body || '';
              if (!body.trim()) { alert(lang === 'kr' ? '먼저 내용을 써봐요!' : 'Write something first!'); return; }
              setDiffBodyRaw(body);
              setSelectedStyleId(id);
              setRoute('diff');
            }}
            onSave={handleSaveBody}
            onBodyChange={(body) => { liveBodyRef.current = body; }}
            chapterId={currentChapterId ?? undefined}
            allChapterBodies={dbChapters.map(r => r.body || '').filter(b => b.trim())}
            writingFormat={writingFormat}
            onFormatPick={() => setShowFormatPicker(true)}
            tone={selectedTone} length={selectedLength}
            onToneChange={setSelectedTone} onLengthChange={setSelectedLength}
          />
        )}

        {route === 'diff' && (
          <DiffView
            t={t} lang={lang}
            styleId={selectedStyleId} styles={STYLES}
            sample={{ ...editorSample, raw: diffBodyRaw || editorSample.raw }} notes={notes}
            chapterTitle={currentChapter?.title}
            tone={selectedTone} length={selectedLength} level={level}
            onAccept={handleAcceptTransform}
            onClose={() => setRoute('editor')}
          />
        )}

        {route === 'analysis' && (
          <AnalysisScreen
            t={t} lang={lang} styles={STYLES}
            sample={editorSample}
            chapterTitle={currentChapter?.title}
            chapterTitles={dbChapters.map(r => r.title || (lang === 'kr' ? `챕터 ${r.n}` : `Chapter ${r.n}`))}
            allChapterBodies={dbChapters.map(r => r.body || '')}
            onClose={() => setRoute('editor')}
            onApply={(styleId) => { setSelectedStyleId(styleId || 'literary'); setRoute('diff'); }}
          />
        )}

        {route === 'bible' && (
          <StoryBibleScreen
            t={t} lang={lang}
            onClose={() => setRoute('editor')}
            onJumpToChapter={(id) => { setCurrentChapterId(id); setRoute('editor'); }}
          />
        )}
      </main>

      {showExportModal && (
        <ExportModal
          lang={lang}
          projectTitle={dbChapters[0]?.title || (lang === 'kr' ? '나의 이야기' : 'My Story')}
          chapters={dbChapters.map(r => ({ n: r.n, title: r.title || `Chapter ${r.n}`, body: r.body || '' }))}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showFormatPicker && (
        <FormatPicker
          lang={lang}
          current={writingFormat}
          onApply={setWritingFormat}
          onClose={() => setShowFormatPicker(false)}
        />
      )}

      {pickerOpen && (
        <StylePicker
          t={t} lang={lang} styles={STYLES}
          sample={editorSample} level={level}
          onClose={() => setPickerOpen(false)}
          onApply={handleApplyStyle}
        />
      )}

      {/* Mobile bottom tab bar (shown ≤720px via CSS; sidebar is hidden there) */}
      <nav className="mobile-tabbar">
        <button data-active={route === 'dashboard' ? '1' : '0'} onClick={() => setRoute('dashboard')}>
          <span className="tab-icon">⌂</span>{lang === 'kr' ? '홈' : 'Home'}
        </button>
        <button data-active={route === 'editor' ? '1' : '0'} onClick={() => setRoute('editor')}>
          <span className="tab-icon">✎</span>{lang === 'kr' ? '쓰기' : 'Write'}
        </button>
        {level !== 'kids' && level !== 'beginner' && (
          <button data-active={route === 'analysis' ? '1' : '0'} onClick={() => setRoute('analysis')}>
            <span className="tab-icon">⌖</span>{lang === 'kr' ? '분석' : 'Analysis'}
          </button>
        )}
        <button data-active={route === 'diff' ? '1' : '0'} onClick={handleTransform}>
          <span className="tab-icon">✦</span>{lang === 'kr' ? '변환' : 'Style'}
        </button>
      </nav>

      {/* Floating settings panel */}
      <div className="settings-fab" style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 200 }}>
        <button className="btn btn-ghost"
                style={{ fontSize: 18, padding: '6px 10px', borderRadius: 8 }}
                onClick={() => setShowSettings(v => !v)} aria-label="Settings">⚙</button>
        {showSettings && (
          <div className="card" style={{ position: 'absolute', bottom: 44, right: 0, padding: 16, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-3)', width: 56 }}>Lang</span>
              <div className="rail-seg">
                <button data-on={lang === 'kr' ? '1' : '0'} onClick={() => setLang('kr')}>한국어</button>
                <button data-on={lang === 'en' ? '1' : '0'} onClick={() => setLang('en')}>English</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-3)', width: 56 }}>Theme</span>
              <div className="rail-seg">
                <button data-on={!dark ? '1' : '0'} onClick={() => setDark(false)}>Light</button>
                <button data-on={dark ? '1' : '0'} onClick={() => setDark(true)}>Dark</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-3)', width: 56 }}>Palette</span>
              <div className="rail-seg">
                {(['paper', 'sunset', 'sage', 'twilight'] as Palette[]).map(p => (
                  <button key={p} data-on={palette === p ? '1' : '0'} onClick={() => setPalette(p)}>{p}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-3)', width: 56 }}>Type</span>
              <div className="rail-seg">
                {(['manuscript', 'editorial', 'modern'] as Typeset[]).map(ts => (
                  <button key={ts} data-on={typeset === ts ? '1' : '0'} onClick={() => setTypeset(ts)}>{ts}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
