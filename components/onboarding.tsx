'use client';
import { useState } from 'react';
import { InkiMascot } from './mascot';
import type { Level, Lang, T } from '@/lib/data';

interface OnboardingScreenProps {
  t: T;
  lang: Lang;
  level: Level;
  setLevel: (l: Level) => void;
  onDone: () => void;
  onSkip: () => void;
  gamified?: boolean;
}

export function OnboardingScreen({ t, lang, level, setLevel, onDone, onSkip, gamified = false }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const total = 3;

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else onDone();
  };
  const back = () => setStep(Math.max(0, step - 1));

  const LEVELS = [
    { id: 'kids'     as Level, emoji: '🐣', name: t.lvl_kids_name,     desc: t.lvl_kids_desc,     features: t.lvl_kids_features },
    { id: 'beginner' as Level, emoji: '✿', name: t.lvl_beginner_name, desc: t.lvl_beginner_desc, features: t.lvl_beginner_features },
    { id: 'growing'  as Level, emoji: '✦', name: t.lvl_growing_name,  desc: t.lvl_growing_desc,  features: t.lvl_growing_features },
    { id: 'pro'      as Level, emoji: '◆', name: t.lvl_pro_name,      desc: t.lvl_pro_desc,      features: t.lvl_pro_features },
  ];

  return (
    <div className="onb" data-gamified={gamified ? '1' : '0'}>
      {gamified && (
        <div className="onb-progress">
          <span style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>
      )}
      <div className="onb-header">
        <div className="onb-brand">
          <InkiMascot size={26} mood="warm" />
          <span>{t.brand}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {gamified && (
            <div className="onb-xp">{lang === 'kr' ? '레벨 1 · 0 / 100' : 'Level 1 · 0 / 100'}</div>
          )}
          <button className="onb-skip" onClick={onSkip}>
            {t.ob_skip} →
          </button>
        </div>
      </div>

      <div className="onb-stage">
        {step === 0 && (
          <div className="onb-step onb-greet fade-in" key="g">
            <div className="big-mascot">
              <InkiMascot size={96} mood="encouraging" />
            </div>
            <div className="small-line">{t.ob_greet_top}</div>
            <h1>{t.ob_greet}</h1>
            <div className="onb-footer" style={{ justifyContent: 'center', gap: 12 }}>
              <button className="btn btn-primary" onClick={next} style={{ padding: '12px 22px', fontSize: 14 }}>
                {t.ob_start} →
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onb-step fade-in" key="l">
            <div className="onb-q">
              <h2>{t.ob_q}</h2>
              <p>{t.ob_sub}</p>
            </div>
            <div className="lvl-grid">
              {LEVELS.map((L) => (
                <button key={L.id} className="lvl-card"
                        data-on={level === L.id ? '1' : '0'}
                        onClick={() => setLevel(L.id)}>
                  <div className="lvl-emoji">{L.emoji}</div>
                  <h3>{L.name}</h3>
                  <div className="lvl-desc">{L.desc}</div>
                  <ul>
                    {L.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </button>
              ))}
            </div>
            <div className="onb-footer">
              <button className="btn btn-ghost" onClick={back}>← {lang === 'kr' ? '이전' : 'Back'}</button>
              <div className="onb-step-indicator">
                {[0,1,2].map(i => <i key={i} data-on={i <= step ? '1' : '0'} />)}
              </div>
              <button className="btn btn-primary" onClick={next}>
                {lang === 'kr' ? '다음' : 'Next'} →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onb-step onb-greet fade-in" key="r">
            <InkiMascot size={84} mood="smile" pulse />
            <div className="small-line">{lang === 'kr' ? '준비됐어요' : 'You’re all set'}</div>
            <h1 style={{ maxWidth: 600 }}>
              {lang === 'kr'
                ? `좋아요. 그럼 작업실로\n같이 가볼까요?`
                : `Lovely. Let’s step into\nyour writing room.`}
            </h1>
            <div style={{ marginTop: 4, color: 'var(--ink-3)', fontSize: 13 }}>
              {lang === 'kr'
                ? `선택한 모드: ${LEVELS.find(L => L.id === level)?.name}`
                : `Mode selected: ${LEVELS.find(L => L.id === level)?.name}`}
            </div>
            <div className="onb-footer" style={{ justifyContent: 'center', gap: 12, marginTop: 18 }}>
              <button className="btn btn-ghost" onClick={back}>← {lang === 'kr' ? '이전' : 'Back'}</button>
              <button className="btn btn-primary" onClick={onDone} style={{ padding: '12px 22px', fontSize: 14 }}>
                {lang === 'kr' ? '작업실로 들어가기' : 'Enter the room'} →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
