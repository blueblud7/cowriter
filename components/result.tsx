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
  chapterTitle?: string;
  tone?: string;
  length?: string;
  onAccept: (text: string) => void;
  onClose: () => void;
}

export function DiffView({ t, lang, styleId, styles, sample, notes, chapterTitle, tone = 'neutral', length = 'keep', onAccept, onClose }: DiffViewProps) {
  const style = styles.find(s => s.id === styleId) || styles[0];
  const rawLines = sample.raw.split(/(?<=[.!?。!?])\s+/).filter(Boolean);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(0);

  const [transformError, setTransformError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setAiResult(null);
    setTransformError(null);
    fetch('/api/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sample.raw, style: styleId, lang, tone, length }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setTransformError(d.error); setLoading(false); return; }
        setAiResult(d.result ?? null);
        setLoading(false);
      })
      .catch(() => {
        setTransformError(lang === 'kr' ? '변환에 실패했어요. 다시 시도해보세요.' : 'Transform failed. Please try again.');
        setLoading(false);
      });
  }, [sample.raw, styleId, lang]);

  const styledRaw = aiResult ?? '';
  const styledLines = styledRaw.split(/(?<=[.!?。!?])\s+/).filter(Boolean);

  return (
    <div className="diff-screen fade-in">
      <div className="topbar">
        <div className="crumb">
          <span>{t.nav_drafts}</span>
          <span>›</span>
          <span>{chapterTitle || (lang === 'kr' ? '현재 챕터' : 'Current chapter')}</span>
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
              {transformError && (
                <p style={{ padding: '16px 12px', fontSize: 13, color: 'var(--negative)', opacity: 0.8 }}>
                  ⚠ {transformError}
                </p>
              )}
              {loading && !transformError && (
                <p style={{ padding: '16px 12px', fontSize: 13, color: 'var(--ink-3)' }}>
                  {lang === 'kr' ? '변환 중…' : 'Transforming…'}
                </p>
              )}
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

interface AnalysisResult {
  recommendedStyle: string;
  confidence: number;
  why: string;
  pace: number;
  emotion: number;
  voice: number;
  paceDesc: string;
  emotionDesc: string;
  voiceDesc: string;
  emotionArc: number[];
  radar: number[];
  tonePalette: Array<{ label: string; pct: number; color: string }>;
  suggestions: Array<{ style: string; why: string }>;
}

function computeStats(text: string, lang: Lang) {
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
  const sentences = text.split(/[.!?。！？]+/).map(s => s.trim()).filter(Boolean);
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const wordCount = words.length;
  const sentCount = sentences.length;
  const paraCount = Math.max(1, paragraphs.length);
  const avgSentLen = sentCount > 0 ? Math.round(wordCount / sentCount) : 0;
  const wpm = lang === 'kr' ? 200 : 250;
  const totalSecs = Math.round((wordCount / wpm) * 60);
  const readTime = `${Math.floor(totalSecs / 60)}:${String(totalSecs % 60).padStart(2, '0')}`;
  const sentLengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const minSent = sentLengths.length ? Math.min(...sentLengths) : 0;
  const maxSent = sentLengths.length ? Math.max(...sentLengths) : 0;
  const sentDist = Array(15).fill(0);
  sentLengths.forEach(l => { sentDist[Math.min(Math.floor(l / 3), 14)]++; });
  const stopKr = new Set(['그', '나', '는', '이', '가', '을', '를', '에', '의', '와', '과', '도', '에서', '로', '으로', '것', '수', '있', '없', '했', '하다', '된', '있다', '없다', '하지만', '그리고', '그래서', '또', '더', '지', '한', '들', '그녀', '그는']);
  const stopEn = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'i', 'it', 'he', 'she', 'they', 'we', 'my', 'his', 'her', 'their', 'this', 'that', 'had', 'have', 'not', 'so', 'as', 'up', 'out', 'if', 'its']);
  const stop = lang === 'kr' ? stopKr : stopEn;
  const freq: Record<string, number> = {};
  words.forEach(w => {
    const clean = w.toLowerCase().replace(/[.,!?;:'"()\[\]{}\-「」『』]/g, '');
    if (clean.length > 1 && !stop.has(clean)) freq[clean] = (freq[clean] || 0) + 1;
  });
  const cloud = Object.entries(freq).sort(([,a],[,b]) => b-a).slice(0, 15).map(([w, c]) => ({ w, c }));
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const vocabDiv = wordCount > 0 ? (uniqueWords / wordCount).toFixed(2) : '0.00';
  return { wordCount, sentCount, paraCount, avgSentLen, readTime, sentDist, cloud, vocabDiv, minSent, maxSent };
}

interface AnalysisScreenProps {
  t: T;
  lang: Lang;
  styles: Style[];
  sample: Sample;
  chapterTitle?: string;
  onClose: () => void;
  onApply: (styleId?: string) => void;
}

export function AnalysisScreen({ t, lang, styles, sample, chapterTitle, onClose, onApply }: AnalysisScreenProps) {
  const [ai, setAi] = useState<AnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const hasText = sample.raw.trim().length > 0;

  useEffect(() => {
    if (!hasText) return;
    setAiLoading(true);
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sample.raw, lang }),
    })
      .then(r => r.json())
      .then(d => { setAi(d); setAiLoading(false); })
      .catch(() => setAiLoading(false));
  }, [sample.raw, lang, hasText]);

  const stats = computeStats(sample.raw, lang);
  const recommended = styles.find(s => s.id === (ai?.recommendedStyle || 'literary')) || styles[0];

  const arcPts = ai?.emotionArc?.length === 12
    ? ai.emotionArc
    : [10, 16, 22, 28, 30, 26, 30, 38, 50, 64, 78, 86];
  const arcW = 360, arcH = 120;
  const arcPath = arcPts.map((v, i) => {
    const x = (i / (arcPts.length - 1)) * arcW;
    const y = arcH - (v / 100) * (arcH - 16) - 8;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  const radarAxes = [
    lang === 'kr' ? '서정' : 'Lyrical',
    lang === 'kr' ? '관찰' : 'Observ.',
    lang === 'kr' ? '리듬' : 'Rhythm',
    lang === 'kr' ? '농도' : 'Density',
    lang === 'kr' ? '구어' : 'Spoken',
    lang === 'kr' ? '대비' : 'Contrast',
  ];
  const radarVals = ai?.radar?.length === 6 ? ai.radar : [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  const radarCX = 110, radarCY = 110, radarR = 80;
  const radarPts = radarVals.map((v, i) => {
    const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return `${(radarCX + Math.cos(ang) * radarR * v).toFixed(1)},${(radarCY + Math.sin(ang) * radarR * v).toFixed(1)}`;
  }).join(' ');

  const tonePalette = ai?.tonePalette?.length
    ? ai.tonePalette
    : [{ label: lang === 'kr' ? '분석 중…' : 'Analyzing…', pct: 100, color: 'var(--surface-2)' }];

  const maxBar = Math.max(...stats.sentDist, 1);
  const cloudMax = stats.cloud.length ? Math.max(...stats.cloud.map(x => x.c)) : 1;

  const metrics = [
    { id: 'pace',    label: t.an_pace,    value: ai?.pace ?? 0,    color: 'var(--accent)',   desc: ai?.paceDesc    || (lang === 'kr' ? '분석 중…' : 'Analyzing…') },
    { id: 'emotion', label: t.an_emotion, value: ai?.emotion ?? 0, color: 'var(--ink-2)',    desc: ai?.emotionDesc || (lang === 'kr' ? '분석 중…' : 'Analyzing…') },
    { id: 'voice',   label: t.an_voice,   value: ai?.voice ?? 0,   color: 'var(--positive)', desc: ai?.voiceDesc   || (lang === 'kr' ? '분석 중…' : 'Analyzing…') },
  ];

  return (
    <div className="an-screen fade-in">
      <div className="topbar">
        <div className="crumb"><b>{t.an_title}</b></div>
        <div className="spacer" />
        {aiLoading && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{lang === 'kr' ? 'AI 분석 중…' : 'AI analyzing…'}</span>}
        <button className="btn btn-ghost" onClick={onClose}>← {lang === 'kr' ? '에디터로' : 'Back to editor'}</button>
      </div>

      {!hasText ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: 'var(--ink-3)' }}>
          <InkiMascot size={56} mood="encouraging" />
          <p style={{ fontSize: 14 }}>{lang === 'kr' ? '글을 먼저 써봐요. 그러면 분석해 드릴게요.' : 'Write something first — then I can analyse it.'}</p>
        </div>
      ) : (
      <div className="an-body">
        <div className="an-hero">
          <InkiMascot size={56} mood={aiLoading ? 'think' : 'smile'} pulse={aiLoading} />
          <div>
            <h1 className="an-title">{t.an_sub}</h1>
            <div className="an-tag">
              {chapterTitle && `${chapterTitle} · `}
              {stats.wordCount.toLocaleString()} {t.ed_words} · {stats.sentCount} {lang === 'kr' ? '문장' : 'sentences'} · {stats.paraCount} {lang === 'kr' ? '문단' : 'paragraphs'}
            </div>
          </div>
        </div>

        <div className="an-grid">
          <div className="card an-rec">
            <div className="an-rec-label">{t.an_recommend}</div>
            {aiLoading ? (
              <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '12px 0' }}>{lang === 'kr' ? '스타일 추천을 분석하고 있어요…' : 'Analysing style recommendation…'}</div>
            ) : (
              <>
                <div className="an-rec-style">
                  <span className="rail-style-icon" style={{ background: recommended.swatch + '22', color: recommended.swatch, fontSize: 24, width: 48, height: 48, borderRadius: 12 }}>
                    {recommended.icon}
                  </span>
                  <div>
                    <div className="an-rec-name">{recommended[lang].name}</div>
                    <div className="an-rec-hint">{recommended[lang].hint}</div>
                  </div>
                </div>
                <p className="an-rec-why">{ai?.why || ''}</p>
                <div className="an-rec-conf">
                  <div className="an-rec-conf-label">
                    <span>{lang === 'kr' ? '확신도' : 'Confidence'}</span>
                    <b>{ai?.confidence ?? 0}%</b>
                  </div>
                  <div className="an-rec-conf-bar">
                    <div className="an-rec-conf-fill" style={{ width: `${ai?.confidence ?? 0}%` }} />
                  </div>
                </div>
              </>
            )}
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={aiLoading} onClick={() => onApply(ai?.recommendedStyle)}>
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
                <line key={i} x1="0" y1={arcH * y} x2={arcW} y2={arcH * y} stroke="var(--line)" strokeDasharray="2 4" />
              ))}
              <path d={`${arcPath} L ${arcW} ${arcH} L 0 ${arcH} Z`} fill="url(#arcFill)" />
              <path d={arcPath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                const pts = radarAxes.map((_, j) => {
                  const ang = (j / 6) * Math.PI * 2 - Math.PI / 2;
                  return `${radarCX + Math.cos(ang) * radarR * s},${radarCY + Math.sin(ang) * radarR * s}`;
                }).join(' ');
                return <polygon key={i} points={pts} fill="none" stroke="var(--line)" strokeDasharray={i === 3 ? '0' : '2 3'} />;
              })}
              {radarAxes.map((_, i) => {
                const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
                return <line key={i} x1={radarCX} y1={radarCY} x2={radarCX + Math.cos(ang) * radarR} y2={radarCY + Math.sin(ang) * radarR} stroke="var(--line)" />;
              })}
              <polygon points={radarPts} fill="var(--accent)" fillOpacity="0.18" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
              {radarVals.map((v, i) => {
                const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
                return <circle key={i} cx={radarCX + Math.cos(ang) * radarR * v} cy={radarCY + Math.sin(ang) * radarR * v} r="3" fill="var(--accent)" />;
              })}
              {radarAxes.map((axis, i) => {
                const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
                return <text key={i} x={radarCX + Math.cos(ang) * (radarR + 18)} y={radarCY + Math.sin(ang) * (radarR + 18)} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--ink-3)" fontFamily="var(--font-mono)" letterSpacing="0.5">{axis}</text>;
              })}
            </svg>
          </div>

          <div className="card an-hist">
            <div className="an-card-label">{lang === 'kr' ? '문장 길이 분포' : 'Sentence length'}</div>
            <div className="an-hist-meta">
              <span>{lang === 'kr' ? '평균' : 'Avg'} <b>{stats.avgSentLen}</b></span>
              <span>{lang === 'kr' ? '최단' : 'Min'} <b>{stats.minSent}</b></span>
              <span>{lang === 'kr' ? '최장' : 'Max'} <b>{stats.maxSent}</b></span>
            </div>
            <div className="an-hist-bars">
              {stats.sentDist.map((v, i) => (
                <div key={i} className="an-hist-bar" style={{ height: `${(v / maxBar) * 100}%` }} title={`${(i + 1) * 3}-${(i + 2) * 3}w: ${v}`}>
                  <span className="an-hist-bar-fill" style={{ background: i >= 4 && i <= 7 ? 'var(--accent)' : 'var(--ink-4)' }} />
                </div>
              ))}
            </div>
            <div className="an-hist-axis"><span>3</span><span>15</span><span>30</span><span>45+</span></div>
          </div>

          <div className="card an-tone">
            <div className="an-card-label">{lang === 'kr' ? '톤 팔레트' : 'Tone palette'}</div>
            <div className="an-tone-bar">
              {tonePalette.map((tp, i) => (
                <div key={i} className="an-tone-seg" style={{ width: `${tp.pct}%`, background: tp.color }} title={`${tp.label} ${tp.pct}%`} />
              ))}
            </div>
            <ul className="an-tone-list">
              {tonePalette.map((tp, i) => (
                <li key={i}>
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

          {stats.cloud.length > 0 && (
            <div className="card an-cloud">
              <div className="an-card-label">{lang === 'kr' ? '자주 쓴 단어' : 'Frequent words'}</div>
              <div className="an-cloud-body">
                {stats.cloud.map((w, i) => (
                  <span key={i} className="an-cloud-word" style={{
                    fontSize: `${12 + (w.c / cloudMax) * 16}px`,
                    opacity: 0.55 + (w.c / cloudMax) * 0.45,
                    color: w.c > cloudMax * 0.7 ? 'var(--accent-ink)' : 'var(--ink-2)',
                    fontWeight: w.c > cloudMax * 0.5 ? 600 : 500,
                  }}>{w.w}<small>{w.c}</small></span>
                ))}
              </div>
            </div>
          )}

          <div className="card an-stats">
            <div className="an-card-label">{lang === 'kr' ? '문서 지표' : 'Document'}</div>
            <ul className="an-stats-list">
              {([
                [lang === 'kr' ? '단어 수' : 'Words', stats.wordCount.toLocaleString()],
                [lang === 'kr' ? '문장 수' : 'Sentences', String(stats.sentCount)],
                [lang === 'kr' ? '문단 수' : 'Paragraphs', String(stats.paraCount)],
                [lang === 'kr' ? '읽기 시간' : 'Read time', stats.readTime],
                [lang === 'kr' ? '어휘 다양성' : 'Vocabulary', stats.vocabDiv],
              ] as [string, string][]).map(([label, val]) => (
                <li key={label}><span>{label}</span><b>{val}</b></li>
              ))}
            </ul>
          </div>

          {(ai?.suggestions?.length ?? 0) > 0 && (
            <div className="card an-suggestions">
              <div className="an-card-label">{lang === 'kr' ? '함께 시도해볼 만한 것' : 'Worth trying'}</div>
              <ul className="an-suggest-list">
                {(ai?.suggestions ?? []).map((s, i) => (
                  <li key={i}><b>{s.style}</b><span>{s.why}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      )}
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
