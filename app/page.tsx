'use client';
import { useState, useEffect } from 'react';
import { AuthScreen, type AuthUser } from '@/components/auth';
import { OnboardingScreen } from '@/components/onboarding';
import { Sidebar, DashboardScreen } from '@/components/sidebar';
import { EditorScreen, StylePicker } from '@/components/editor';
import { DiffView, AnalysisScreen, FocusScreen } from '@/components/result';
import { StoryBibleScreen } from '@/components/bible';
import {
  STYLES, STARTERS, CHAPTERS, SAMPLE, NOTES, T,
  type Lang, type Level, type Palette, type Typeset, type Route,
} from '@/lib/data';

export default function CoWriterApp() {
  const [lang, setLang] = useState<Lang>('kr');
  const [level, setLevel] = useState<Level>('growing');
  const [palette, setPalette] = useState<Palette>('twilight');
  const [typeset, setTypeset] = useState<Typeset>('manuscript');
  const [dark, setDark] = useState(false);
  const [route, setRoute] = useState<Route>('auth');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentChapter, setCurrentChapter] = useState('ch1');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState('literary');
  const [showSettings, setShowSettings] = useState(false);

  const t = T[lang];
  const chapters = CHAPTERS[lang];
  const starters = STARTERS[lang];
  const sample = SAMPLE[lang];
  const notes = NOTES[lang];
  const chapter = chapters.find(c => c.id === currentChapter) || chapters[0];

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-palette', palette);
    html.setAttribute('data-typeset', typeset);
    html.setAttribute('data-theme', dark ? 'dark' : 'light');
    html.setAttribute('lang', lang === 'kr' ? 'ko' : 'en');
  }, [palette, typeset, dark, lang]);

  const handleTransform = () => setPickerOpen(true);
  const handleApplyStyle = (id: string) => {
    setSelectedStyleId(id);
    setPickerOpen(false);
    setRoute('diff');
  };
  const handleStyleClick = (id: string) => {
    setSelectedStyleId(id);
    setRoute('diff');
  };

  if (route === 'auth') {
    return (
      <AuthScreen
        t={t} lang={lang}
        onSignedIn={(u) => { setUser(u); setRoute('onboarding'); }}
      />
    );
  }

  if (route === 'onboarding') {
    return (
      <OnboardingScreen
        t={t} lang={lang} level={level}
        setLevel={setLevel}
        onDone={() => setRoute('dashboard')}
        onSkip={() => setRoute('dashboard')}
      />
    );
  }

  if (route === 'focus') {
    return (
      <FocusScreen
        t={t} lang={lang} chapter={chapter} sample={sample}
        onExit={() => setRoute('editor')}
      />
    );
  }

  return (
    <div className="app">
      <Sidebar
        t={t} lang={lang} level={level}
        chapters={chapters} currentChapter={currentChapter}
        setCurrentChapter={setCurrentChapter}
        route={route} setRoute={setRoute}
        onLevelClick={() => setRoute('onboarding')}
      />

      <main className="main">
        {route === 'dashboard' && (
          <DashboardScreen
            t={t} lang={lang} level={level}
            chapters={chapters} starters={starters}
            setCurrentChapter={setCurrentChapter}
            setRoute={setRoute}
          />
        )}

        {route === 'editor' && (
          <EditorScreen
            t={t} lang={lang} level={level}
            chapter={chapter} sample={sample}
            styles={STYLES} starters={starters}
            onTransform={handleTransform}
            onFocus={() => setRoute('focus')}
            onAnalyze={() => setRoute('analysis')}
            onStyleClick={handleStyleClick}
          />
        )}

        {route === 'diff' && (
          <DiffView
            t={t} lang={lang}
            styleId={selectedStyleId} styles={STYLES}
            sample={sample} notes={notes}
            onAccept={() => setRoute('editor')}
            onClose={() => setRoute('editor')}
          />
        )}

        {route === 'analysis' && (
          <AnalysisScreen
            t={t} lang={lang} styles={STYLES}
            onClose={() => setRoute('editor')}
            onApply={() => { setSelectedStyleId('literary'); setRoute('diff'); }}
          />
        )}

        {route === 'bible' && (
          <StoryBibleScreen
            t={t} lang={lang}
            onClose={() => setRoute('editor')}
            onJumpToChapter={(id) => { setCurrentChapter(id); setRoute('editor'); }}
          />
        )}
      </main>

      {pickerOpen && (
        <StylePicker
          t={t} lang={lang} styles={STYLES}
          sample={sample} level={level}
          onClose={() => setPickerOpen(false)}
          onApply={handleApplyStyle}
        />
      )}

      {/* Floating settings panel */}
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 200 }}>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 18, padding: '6px 10px', borderRadius: 8 }}
          onClick={() => setShowSettings(v => !v)}
          aria-label="Settings"
        >⚙</button>
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
