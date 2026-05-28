'use client';
import { InkiMascot } from './mascot';
import type { Level, Lang, Route, Chapter, Starter, T } from '@/lib/data';

interface SidebarProps {
  t: T;
  lang: Lang;
  level: Level;
  chapters: Chapter[];
  currentChapter: string;
  setCurrentChapter: (id: string) => void;
  route: Route;
  setRoute: (r: Route) => void;
  onLevelClick: () => void;
  onNewChapter?: () => void;
  onExport?: () => void;
  userName?: string;
  userEmail?: string;
  onSettings?: () => void;
}

export function Sidebar({ t, lang, level, chapters, currentChapter, setCurrentChapter, route, setRoute, onLevelClick, onNewChapter, onExport, userName, userEmail, onSettings }: SidebarProps) {
  const levelLabels: Record<Level, string> = {
    beginner: t.lvl_beginner_name,
    growing:  t.lvl_growing_name,
    pro:      t.lvl_pro_name,
  };
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark"><InkiMascot size={22} mood="warm" /></span>
        <span>{t.brand}</span>
      </div>

      <button className="sidebar-level" onClick={onLevelClick} aria-label="Change level">
        <span className="level-dot" />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div className="level-name">{levelLabels[level]}</div>
          <div className="level-mode">
            {lang === 'kr' ? '클릭해서 모드 변경' : 'Click to change mode'}
          </div>
        </div>
        <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>↻</span>
      </button>

      <nav className="nav">
        <button className="nav-item" data-active={route === 'dashboard' ? '1' : '0'}
                onClick={() => setRoute('dashboard')}>
          <span className="nav-icon">◐</span>
          <span>{lang === 'kr' ? '대시보드' : 'Dashboard'}</span>
        </button>
        <button className="nav-item" data-active={route === 'editor' ? '1' : '0'}
                onClick={() => setRoute('editor')}>
          <span className="nav-icon">✎</span>
          <span>{t.nav_drafts}</span>
          <span className="nav-count">{chapters.filter(c => c.status !== 'new').length}</span>
        </button>
        {level !== 'beginner' && (
          <button className="nav-item" data-active={route === 'bible' ? '1' : '0'}
                  onClick={() => setRoute('bible')}>
            <span className="nav-icon">✺</span>
            <span>{t.nav_bible}</span>
          </button>
        )}
        {level !== 'beginner' && (
          <button className="nav-item" data-active={route === 'analysis' ? '1' : '0'}
                  onClick={() => setRoute('analysis')}>
            <span className="nav-icon">⌖</span>
            <span>{lang === 'kr' ? '분석' : 'Analysis'}</span>
          </button>
        )}
        <button className="nav-item" onClick={onExport}
                title={lang === 'kr' ? '내보내기 (TXT / MD / PDF)' : 'Export (TXT / MD / PDF)'}>
          <span className="nav-icon">📤</span>
          <span>{lang === 'kr' ? '내보내기' : 'Export'}</span>
        </button>
      </nav>

      <div className="sidebar-section">
        <span>{t.nav_works}</span>
        <button title={lang === 'kr' ? '새 챕터' : 'New chapter'} onClick={onNewChapter}>+</button>
      </div>
      <div className="chapter-list">
        {chapters.map((c) => (
          <button key={c.id} className="chapter-item"
                  data-active={currentChapter === c.id && route === 'editor' ? '1' : '0'}
                  onClick={() => { setCurrentChapter(c.id); setRoute('editor'); }}>
            <span className="chapter-num">{String(c.n).padStart(2, '0')}</span>
            <div className="chapter-meta">
              <div className="chapter-title">{c.title}</div>
              <div className="chapter-sub">
                <span className={`chapter-status-dot chapter-status-${c.status}`} />
                <span>{c.words.toLocaleString()} {t.ed_words}</span>
                <span>·</span>
                <span>{c.updated}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="sidebar-foot">
        <div className="avatar">{(userName || (lang === 'kr' ? '나' : 'Me')).slice(0, 2)}</div>
        <div className="who" style={{ flex: 1, minWidth: 0 }}>
          <b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
            {userName || (lang === 'kr' ? '나의 작업실' : 'My writing room')}
          </b>
          <small style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
            {userEmail || (lang === 'kr' ? '저장 동기화됨' : 'Synced')}
          </small>
        </div>
        <button className="icon-btn" style={{ width: 28, height: 28 }} aria-label="settings"
                onClick={onSettings}>⚙</button>
      </div>
    </aside>
  );
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 80, h = 32;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / Math.max(1, max - min)) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg className="stat-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface DashboardScreenProps {
  t: T;
  lang: Lang;
  level: Level;
  chapters: Chapter[];
  setCurrentChapter: (id: string) => void;
  setRoute: (r: Route) => void;
  starters: Starter[];
}

export function DashboardScreen({ t, lang, level, chapters, setCurrentChapter, setRoute, starters }: DashboardScreenProps) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (lang === 'kr') {
      if (h < 11) return '좋은 아침이에요';
      if (h < 17) return '오늘도 좋아요';
      return '편안한 저녁이에요';
    }
    if (h < 11) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <>
      <div className="topbar">
        <div className="crumb"><b>{lang === 'kr' ? '대시보드' : 'Dashboard'}</b></div>
        <div className="spacer" />
        <span className="save-pill">{t.ed_save}</span>
        <button className="btn"
                onClick={() => { if (chapters[0]) { setCurrentChapter(chapters[0].id); setRoute('editor'); } }}>
          {t.dash_continue} →
        </button>
      </div>

      <div className="dash">
        <div className="dash-hello">
          <div>
            <h1>{greeting},</h1>
            <div className="hello-time">
              {lang === 'kr'
                ? '오늘은 어떤 결로 써볼까요?'
                : 'What grain shall we follow today?'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <InkiMascot size={56} mood="smile" pulse />
          </div>
        </div>

        {(() => {
          const totalWords = chapters.reduce((s, c) => s + c.words, 0);
          const styledCount = chapters.filter(c => c.status === 'styled').length;
          const draftCount = chapters.filter(c => c.status === 'draft').length;
          return (
            <div className="dash-stats">
              <div className="stat-card">
                <span className="stat-label">{t.dash_stats_words}</span>
                <span className="stat-value">{totalWords.toLocaleString()}</span>
                <span className="stat-trend">{lang === 'kr' ? `${chapters.filter(c=>c.status!=='new').length}개 챕터` : `across ${chapters.filter(c=>c.status!=='new').length} chapters`}</span>
                <Spark data={chapters.slice(-7).map(c => c.words || 0).concat(Array(7).fill(0)).slice(0, 7)} color="var(--accent)" />
              </div>
              <div className="stat-card">
                <span className="stat-label">{t.dash_stats_streak}</span>
                <span className="stat-value">{draftCount + styledCount}</span>
                <span className="stat-trend">{lang === 'kr' ? '작성된 챕터' : 'chapters written'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">{t.dash_stats_styled}</span>
                <span className="stat-value">{styledCount}</span>
                <span className="stat-trend">{lang === 'kr' ? '스타일 변환됨' : 'styled chapters'}</span>
              </div>
            </div>
          );
        })()}

        <h2 className="dash-h2">
          {t.dash_recent}
          <button className="h2-action"
                  onClick={() => { if (chapters[0]) { setCurrentChapter(chapters[0].id); setRoute('editor'); } }}>
            {lang === 'kr' ? '모두 보기' : 'See all'} →
          </button>
        </h2>
        <div className="chap-grid">
          {chapters.filter(c => c.status !== 'new').map((c) => (
            <button key={c.id} className="chap-card chap-card-with-cover"
                    onClick={() => { setCurrentChapter(c.id); setRoute('editor'); }}>
              <div className="chap-card-inner">
                <div className="chap-top">
                  <span className="chap-n">CHAPTER {String(c.n).padStart(2, '0')}</span>
                  <span className="chap-status" data-s={c.status}>
                    {c.status === 'styled' ? (lang === 'kr' ? '변환됨' : 'Styled')
                     : c.status === 'draft' ? (lang === 'kr' ? '초고' : 'Draft')
                     : c.status}
                  </span>
                </div>
                <div className="chap-title">{c.title}</div>
                <div className="chap-foot">
                  <span>{c.words.toLocaleString()} {t.ed_words}</span>
                  <span>{c.updated}</span>
                </div>
              </div>
            </button>
          ))}
          <button className="chap-card chap-card-new"
                  onClick={() => { const target = chapters.find(c => c.status === 'new') || chapters[0]; if (target) { setCurrentChapter(target.id); setRoute('editor'); } }}>
            <div className="new-plus">+</div>
            <div>{t.dash_new_chapter}</div>
          </button>
        </div>

        <div className="dash-starters-section">
          <h2 className="dash-h2">{t.dash_starters}</h2>
          <div className="starter-grid">
            {starters.slice(0, level === 'beginner' ? 6 : 3).map((s, i) => (
              <button key={i} className="starter-card"
                      onClick={() => { if (chapters[0]) { setCurrentChapter(chapters[0].id); setRoute('editor'); } }}>
                <span className="starter-tag">{s.tag}</span>
                <span className="starter-title">{s.title}</span>
                <span className="starter-body">{s.body}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
