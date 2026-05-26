'use client';
import { useState, useEffect, useRef } from 'react';
import { InkiMascot } from './mascot';
import type { Level, Lang, Chapter, Style, Sample, T } from '@/lib/data';

interface DiffViewProps {
  t: T;
  lang: Lang;
  styleId: string;
  styles: Style[];
  sample: Sample;
  notes: string[];
  onAccept: (text: string) => void;
  onClose: () => void;
}

export function DiffView({ t, lang, styleId, styles, sample, notes, onAccept, onClose }: DiffViewProps) {
  const style = styles.find(s => s.id === styleId) || styles[0];
  const rawLines = sample.raw.split(/(?<=[.!?。!?])\s+/).filter(Boolean);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(0);

  useEffect(() => {
    setLoading(true);
    setAiResult(null);
    fetch('/api/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sample.raw, style: styleId, lang }),
    })
      .then(r => r.json())
      .then(d => { setAiResult(d.result || null); setLoading(false); })
      .catch(() => {
        setAiResult((sample as Record<string, string>)[styleId] || sample.literary || sample.raw);
        setLoading(false);
      });
  }, [sample.raw, styleId, lang]);

  const styledRaw = aiResult ?? ((sample as Record<string, string>)[styleId] || sample.literary || sample.raw);
  const styledLines = styledRaw.split(/(?<=[.!?。!?])\s+/).filter(Boolean);

  return (
    <div className="diff-screen fade-in">
      <div className="topbar">
        <div className="crumb">
          <span>{t.nav_drafts}</span>
          <span>›</span>
          <span>{lang === 'kr' ? '비 오는 강' : 'River in the Rain'}</span>
          <span>›</span>
          <b>{t.diff_title}</b>
        </div>
        <div className="spacer" />
        <div className="diff-style-pill" style={{ '--swatch': style.swatch } as React.CSSProperties}>
          <span className="diff-style-icon" style={{ background: style.swatch + '22', color: style.swatch }}>
            {style.icon}
          </span>
          <span>{style[lang].name}</span>
          {loading && <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 6 }}>{lang === 'kr' ? '변환 중…' : 'Transforming…'}</span>}
        </div>
        <button className="btn btn-ghost" onClick={onClose}>{t.diff_revert}</button>
        <button className="btn btn-primary" disabled={loading} onClick={() => onAccept(styledRaw)}>{t.diff_accept} ✓</button>
      </div>

      <div className="diff-body">
        <div className="diff-cols">
          <div className="diff-col">
            <div className="diff-col-head">
              <span className="diff-col-label">{t.diff_before}</span>
              <span className="diff-col-meta">{rawLines.length} {lang === 'kr' ? '문장' : 'sentences'}</span>
            </div>
            <div className="diff-col-body">
              {rawLines.map((l, i) => (
                <p key={i} className="diff-line diff-line-before" data-dim={hovered === i ? '0' : '1'}>{l}</p>
              ))}
            </div>
          </div>

          <div className="diff-col diff-col-after">
            <div className="diff-col-head">
              <span className="diff-col-label">{t.diff_after}</span>
              <span className="diff-col-meta">{styledLines.length} {lang === 'kr' ? '문장' : 'sentences'}</span>
            </div>
            <div className="diff-col-body">
              {styledLines.map((l, i) => (
                <p key={i}
                   className="diff-line diff-line-after"
                   data-active={hovered === i ? '1' : '0'}
                   onMouseEnter={() => setHovered(i)}
                   onFocus={() => setHovered(i)}
                   tabIndex={0}>
                  <span className="diff-line-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="diff-line-text">{l}</span>
                  <span className="diff-line-actions">
                    <button title={t.diff_accept}>✓</button>
                    <button title={t.diff_revert}>↺</button>
                  </span>
                </p>
              ))}
            </div>
          </div>

          <div className="diff-notes">
            <div className="diff-notes-head">
              <InkiMascot size={32} mood="think" />
              <span>{t.diff_inki}</span>
            </div>
            <div className="diff-notes-body">
              {styledLines.map((_, i) => (
                <div key={i} className="diff-note" data-active={hovered === i ? '1' : '0'}>
                  <div className="diff-note-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="diff-note-text">
                    {notes[i] || (lang === 'kr' ? '리듬을 살짝 다듬었어요.' : 'A small rhythm pass.')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="diff-foot-bar">
          <button className="btn">{t.diff_partial}</button>
          <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>
            {lang === 'kr'
              ? '문장 위에 마우스를 올려보세요. Inki가 왜 그렇게 바꿨는지 알려줘요.'
              : 'Hover any styled sentence — Inki will tell you why it changed.'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface AnalysisScreenProps {
  t: T;
  lang: Lang;
  styles: Style[];
  onClose: () => void;
  onApply: () => void;
}

export function AnalysisScreen({ t, lang, styles, onClose, onApply }: AnalysisScreenProps) {
  const recommended = styles.find(s => s.id === 'literary')!;
  const metrics = [
    { id: 'pace',    label: t.an_pace,    value: 64, color: 'var(--accent)',
      desc: lang === 'kr' ? '느리고 차분한 호흡이에요.' : 'A slow, steady breath.' },
    { id: 'emotion', label: t.an_emotion, value: 48, color: 'var(--ink-2)',
      desc: lang === 'kr' ? '잔잔한 슬픔이 흐르고 있어요.' : 'A quiet melancholy runs through.' },
    { id: 'voice',   label: t.an_voice,   value: 72, color: 'var(--positive)',
      desc: lang === 'kr' ? '1인칭 관찰자의 목소리가 또렷해요.' : 'A clear first-person observer.' },
  ];
  const arcW = 360, arcH = 120;
  const arcPts = [10, 16, 22, 28, 30, 26, 30, 38, 50, 64, 78, 86];
  const arcPath = arcPts.map((v, i) => {
    const x = (i / (arcPts.length - 1)) * arcW;
    const y = arcH - (v / 100) * (arcH - 16) - 8;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  const sentDist = [2, 4, 6, 8, 11, 14, 16, 13, 9, 7, 5, 3, 2, 1, 1];
  const maxBar = Math.max(...sentDist);

  const radar = [
    { axis: lang === 'kr' ? '서정' : 'Lyrical',     v: 0.82 },
    { axis: lang === 'kr' ? '관찰' : 'Observation', v: 0.74 },
    { axis: lang === 'kr' ? '리듬' : 'Rhythm',      v: 0.58 },
    { axis: lang === 'kr' ? '농도' : 'Density',     v: 0.40 },
    { axis: lang === 'kr' ? '구어' : 'Spoken',      v: 0.28 },
    { axis: lang === 'kr' ? '대비' : 'Contrast',    v: 0.52 },
  ];

  const cloud = lang === 'kr' ? [
    { w: '비',  c: 12 }, { w: '강',  c: 11 }, { w: '편지', c: 9 }, { w: '창',  c: 8 },
    { w: '그녀', c: 7 }, { w: '시간', c: 6 }, { w: '약속', c: 6 }, { w: '가로등', c: 5 },
    { w: '봉투', c: 5 }, { w: '거리', c: 4 }, { w: '깜박', c: 4 }, { w: '아침', c: 3 },
    { w: '용기', c: 3 }, { w: '천천히', c: 3 }, { w: '오래', c: 2 },
  ] : [
    { w: 'rain', c: 12 }, { w: 'river', c: 9 }, { w: 'letter', c: 9 }, { w: 'window', c: 8 },
    { w: 'her', c: 7 }, { w: 'time', c: 6 }, { w: 'promise', c: 6 }, { w: 'streetlamp', c: 5 },
    { w: 'envelope', c: 5 }, { w: 'street', c: 4 }, { w: 'flicker', c: 4 }, { w: 'morning', c: 3 },
    { w: 'courage', c: 3 }, { w: 'slowly', c: 3 }, { w: 'long', c: 2 },
  ];
  const cloudMax = Math.max(...cloud.map(x => x.c));

  const tonePalette = [
    { id: 'melancholy', label: lang === 'kr' ? '잔잔한 슬픔' : 'Melancholy', pct: 38, color: '#5A6E8A' },
    { id: 'warmth',     label: lang === 'kr' ? '따뜻함'      : 'Warmth',     pct: 24, color: '#C8633D' },
    { id: 'longing',    label: lang === 'kr' ? '그리움'      : 'Longing',    pct: 22, color: '#8B6FB8' },
    { id: 'stillness',  label: lang === 'kr' ? '고요함'      : 'Stillness',  pct: 16, color: '#6B8E5A' },
  ];

  const radarCX = 110, radarCY = 110, radarR = 80;
  const radarPts = radar.map((r, i) => {
    const ang = (i / radar.length) * Math.PI * 2 - Math.PI / 2;
    const x = radarCX + Math.cos(ang) * radarR * r.v;
    const y = radarCY + Math.sin(ang) * radarR * r.v;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="an-screen fade-in">
      <div className="topbar">
        <div className="crumb"><b>{t.an_title}</b></div>
        <div className="spacer" />
        <button className="btn btn-ghost" onClick={onClose}>← {lang === 'kr' ? '에디터로' : 'Back to editor'}</button>
      </div>

      <div className="an-body">
        <div className="an-hero">
          <InkiMascot size={56} mood="think" pulse />
          <div>
            <h1 className="an-title">{t.an_sub}</h1>
            <div className="an-tag">
              {lang === 'kr'
                ? '비 오는 강 · 1,842 단어 · 13 문장 · 4 문단'
                : 'River in the Rain · 1,842 words · 13 sentences · 4 paragraphs'}
            </div>
          </div>
        </div>

        <div className="an-grid">
          <div className="card an-rec">
            <div className="an-rec-label">{t.an_recommend}</div>
            <div className="an-rec-style">
              <span className="rail-style-icon" style={{ background: recommended.swatch + '22', color: recommended.swatch, fontSize: 24, width: 48, height: 48, borderRadius: 12 }}>
                {recommended.icon}
              </span>
              <div>
                <div className="an-rec-name">{recommended[lang].name}</div>
                <div className="an-rec-hint">{recommended[lang].hint}</div>
              </div>
            </div>
            <p className="an-rec-why">
              {lang === 'kr'
                ? '글의 호흡이 느리고 감정의 결이 섬세해서, 문학적 스타일이 잘 어울려요. 너무 깔끔하게 다듬어버리면 잔잔한 분위기가 사라질 수 있어요.'
                : "Your prose breathes slowly and your emotion is subtle — Literary style fits well. Cutting too aggressively would flatten the mood you've built."}
            </p>
            <div className="an-rec-conf">
              <div className="an-rec-conf-label">
                <span>{lang === 'kr' ? '확신도' : 'Confidence'}</span>
                <b>87%</b>
              </div>
              <div className="an-rec-conf-bar">
                <div className="an-rec-conf-fill" style={{ width: '87%' }} />
              </div>
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={onApply}>
              {t.an_apply_rec} →
            </button>
          </div>

          <div className="card an-arc">
            <div className="an-card-label">{t.an_emotion}</div>
            <svg viewBox={`0 0 ${arcW} ${arcH}`} className="an-arc-svg">
              <defs>
                <linearGradient id="arcFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((y, i) => (
                <line key={i} x1="0" y1={arcH * y} x2={arcW} y2={arcH * y}
                      stroke="var(--line)" strokeDasharray="2 4" />
              ))}
              <path d={`${arcPath} L ${arcW} ${arcH} L 0 ${arcH} Z`} fill="url(#arcFill)" />
              <path d={arcPath} fill="none" stroke="var(--accent)" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
              {arcPts.map((v, i) => {
                const x = (i / (arcPts.length - 1)) * arcW;
                const y = arcH - (v / 100) * (arcH - 16) - 8;
                return <circle key={i} cx={x} cy={y} r="2" fill="var(--accent)" />;
              })}
            </svg>
            <div className="an-arc-axis">
              <span>{lang === 'kr' ? '도입' : 'Opening'}</span>
              <span>{lang === 'kr' ? '전개' : 'Middle'}</span>
              <span>{lang === 'kr' ? '결말' : 'Close'}</span>
            </div>
          </div>

          <div className="card an-radar">
            <div className="an-card-label">{lang === 'kr' ? '목소리 지문' : 'Voice fingerprint'}</div>
            <svg viewBox="0 0 220 220" className="an-radar-svg">
              {[0.25, 0.5, 0.75, 1].map((s, i) => {
                const pts = radar.map((_, j) => {
                  const ang = (j / radar.length) * Math.PI * 2 - Math.PI / 2;
                  const x = radarCX + Math.cos(ang) * radarR * s;
                  const y = radarCY + Math.sin(ang) * radarR * s;
                  return `${x},${y}`;
                }).join(' ');
                return <polygon key={i} points={pts} fill="none" stroke="var(--line)" strokeDasharray={i === 3 ? '0' : '2 3'} />;
              })}
              {radar.map((r, i) => {
                const ang = (i / radar.length) * Math.PI * 2 - Math.PI / 2;
                const x = radarCX + Math.cos(ang) * radarR;
                const y = radarCY + Math.sin(ang) * radarR;
                return <line key={i} x1={radarCX} y1={radarCY} x2={x} y2={y} stroke="var(--line)" />;
              })}
              <polygon points={radarPts} fill="var(--accent)" fillOpacity="0.18"
                       stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
              {radar.map((r, i) => {
                const ang = (i / radar.length) * Math.PI * 2 - Math.PI / 2;
                const x = radarCX + Math.cos(ang) * radarR * r.v;
                const y = radarCY + Math.sin(ang) * radarR * r.v;
                return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />;
              })}
              {radar.map((r, i) => {
                const ang = (i / radar.length) * Math.PI * 2 - Math.PI / 2;
                const lx = radarCX + Math.cos(ang) * (radarR + 18);
                const ly = radarCY + Math.sin(ang) * (radarR + 18);
                return <text key={i} x={lx} y={ly} textAnchor="middle"
                             dominantBaseline="middle" fontSize="10" fill="var(--ink-3)"
                             fontFamily="var(--font-mono)" letterSpacing="0.5">{r.axis}</text>;
              })}
            </svg>
          </div>

          <div className="card an-hist">
            <div className="an-card-label">{lang === 'kr' ? '문장 길이 분포' : 'Sentence length'}</div>
            <div className="an-hist-meta">
              <span>{lang === 'kr' ? '평균' : 'Avg'} <b>14.2</b></span>
              <span>{lang === 'kr' ? '최단' : 'Min'} <b>3</b></span>
              <span>{lang === 'kr' ? '최장' : 'Max'} <b>32</b></span>
            </div>
            <div className="an-hist-bars">
              {sentDist.map((v, i) => (
                <div key={i} className="an-hist-bar" style={{ height: `${(v / maxBar) * 100}%` }}
                     title={`${(i + 1) * 3}-${(i + 2) * 3}w: ${v}`}>
                  <span className="an-hist-bar-fill"
                        style={{ background: i >= 4 && i <= 7 ? 'var(--accent)' : 'var(--ink-4)' }} />
                </div>
              ))}
            </div>
            <div className="an-hist-axis">
              <span>3</span><span>15</span><span>30</span><span>45+</span>
            </div>
          </div>

          <div className="card an-tone">
            <div className="an-card-label">{lang === 'kr' ? '톤 팔레트' : 'Tone palette'}</div>
            <div className="an-tone-bar">
              {tonePalette.map((tp) => (
                <div key={tp.id} className="an-tone-seg"
                     style={{ width: `${tp.pct}%`, background: tp.color }}
                     title={`${tp.label} ${tp.pct}%`} />
              ))}
            </div>
            <ul className="an-tone-list">
              {tonePalette.map((tp) => (
                <li key={tp.id}>
                  <span className="an-tone-swatch" style={{ background: tp.color }} />
                  <span className="an-tone-label">{tp.label}</span>
                  <span className="an-tone-pct">{tp.pct}%</span>
                </li>
              ))}
            </ul>
          </div>

          {metrics.map((m) => (
            <div key={m.id} className="card an-metric">
              <div className="an-card-label">{m.label}</div>
              <div className="an-metric-row">
                <div className="an-metric-val" style={{ color: m.color }}>{m.value}</div>
                <div className="an-metric-bar">
                  <div className="an-metric-bar-fill" style={{ width: `${m.value}%`, background: m.color }} />
                </div>
              </div>
              <p className="an-metric-desc">{m.desc}</p>
            </div>
          ))}

          <div className="card an-cloud">
            <div className="an-card-label">{lang === 'kr' ? '자주 쓴 단어' : 'Frequent words'}</div>
            <div className="an-cloud-body">
              {cloud.map((w, i) => (
                <span key={i} className="an-cloud-word"
                      style={{
                        fontSize: `${12 + (w.c / cloudMax) * 16}px`,
                        opacity: 0.55 + (w.c / cloudMax) * 0.45,
                        color: w.c > cloudMax * 0.7 ? 'var(--accent-ink)' : 'var(--ink-2)',
                        fontWeight: w.c > cloudMax * 0.5 ? 600 : 500,
                      }}>
                  {w.w}<small>{w.c}</small>
                </span>
              ))}
            </div>
          </div>

          <div className="card an-stats">
            <div className="an-card-label">{lang === 'kr' ? '문서 지표' : 'Document'}</div>
            <ul className="an-stats-list">
              {([
                [lang === 'kr' ? '단어 수' : 'Words', '1,842'],
                [lang === 'kr' ? '문장 수' : 'Sentences', '13'],
                [lang === 'kr' ? '문단 수' : 'Paragraphs', '4'],
                [lang === 'kr' ? '읽기 시간' : 'Read time', '9:12'],
                [lang === 'kr' ? '난이도' : 'Reading level', lang === 'kr' ? '중2' : 'Grade 8'],
                [lang === 'kr' ? '어휘 다양성' : 'Vocabulary', '0.62'],
              ] as [string, string][]).map(([label, val]) => (
                <li key={label}><span>{label}</span><b>{val}</b></li>
              ))}
            </ul>
          </div>

          <div className="card an-suggestions">
            <div className="an-card-label">{lang === 'kr' ? '함께 시도해볼 만한 것' : 'Worth trying'}</div>
            <ul className="an-suggest-list">
              {(lang === 'kr' ? [
                ['시적', '문단 중간에 짧은 행갈이를 넣어 호흡을 더 만들 수 있어요.'],
                ['미니멀', '감정을 한 단어로 압축해서 잔향을 시험해 보세요.'],
                ['대화체', '낯선 친구에게 들려주듯 다시 써보면 따뜻해질 수 있어요.'],
              ] : [
                ['Poetic', 'A line break mid-paragraph could open more air.'],
                ['Minimalist', 'Compress the emotion to a single word and feel the echo.'],
                ['Conversational', 'Try retelling it to a close friend; it may warm the tone.'],
              ]).map(([name, why], i) => (
                <li key={i}><b>{name}</b><span>{why}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FocusScreenProps {
  t: T;
  lang: Lang;
  chapter: Chapter;
  sample: Sample;
  onExit: () => void;
  onSave?: (body: string) => void;
}

export function FocusScreen({ t, lang, chapter, sample, onExit, onSave }: FocusScreenProps) {
  const [body, setBody] = useState(sample.raw);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wc = body.trim() ? body.trim().split(/\s+/).length : 0;

  useEffect(() => { setBody(sample.raw); }, [sample.raw]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  const handleChange = (val: string) => {
    setBody(val);
    if (onSave) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => onSave(val), 1500);
    }
  };

  return (
    <div className="focus-frame fade-in">
      <button className="focus-exit" onClick={onExit}>Esc · {t.fc_exit}</button>
      <div className="focus-hint">{t.fc_hint}</div>
      <div className="focus-stage">
        <div className="focus-meta">CHAPTER {String(chapter.n).padStart(2, '0')} · {chapter.title}</div>
        <textarea
          className="focus-body"
          value={body}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus
          spellCheck={false}
        />
        <div className="focus-foot">
          <span>{wc.toLocaleString()} {t.ed_words}</span>
          <span>·</span>
          <span>{body.length.toLocaleString()} {t.ed_chars}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-4)' }}>
            {lang === 'kr' ? '자동 저장됨' : 'Auto-saved'}
          </span>
        </div>
      </div>
    </div>
  );
}
