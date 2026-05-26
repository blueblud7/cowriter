'use client';
import { useState, useEffect, CSSProperties } from 'react';

type Mood = 'warm' | 'smile' | 'encouraging' | 'wink' | 'sleep' | 'think';

interface InkiMascotProps {
  size?: number;
  mood?: Mood;
  pulse?: boolean;
  talking?: boolean;
  blink?: boolean;
  style?: CSSProperties;
}

export function InkiMascot({ size = 48, mood = 'warm', pulse = false, talking = false, blink = true, style }: InkiMascotProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);

  useEffect(() => {
    if (!blink) return;
    let blinkT: ReturnType<typeof setTimeout>, openT: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const wait = 3000 + Math.random() * 3000;
      blinkT = setTimeout(() => {
        setIsBlinking(true);
        openT = setTimeout(() => {
          setIsBlinking(false);
          schedule();
        }, 80 + Math.random() * 60);
      }, wait);
    };
    schedule();
    return () => { clearTimeout(blinkT); clearTimeout(openT); };
  }, [blink]);

  useEffect(() => {
    if (!talking) { setMouthFrame(0); return; }
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setMouthFrame(Math.floor(Math.random() * 3));
      t = setTimeout(tick, 110 + Math.random() * 110);
    };
    tick();
    return () => clearTimeout(t);
  }, [talking]);

  const eyeY = 30;
  let leftEye, rightEye;
  if (isBlinking) {
    leftEye  = <path d="M19 30 q3 0 6 0" fill="none" strokeWidth="1.8" strokeLinecap="round" />;
    rightEye = <path d="M31 30 q3 0 6 0" fill="none" strokeWidth="1.8" strokeLinecap="round" />;
  } else if (mood === 'smile' || mood === 'encouraging') {
    leftEye  = <path d="M19 31 q3 -3.5 6 0" fill="none" strokeWidth="1.8" strokeLinecap="round" />;
    rightEye = <path d="M31 31 q3 -3.5 6 0" fill="none" strokeWidth="1.8" strokeLinecap="round" />;
  } else if (mood === 'wink') {
    leftEye  = <circle cx="22" cy={eyeY} r="2.2" />;
    rightEye = <path d="M31 30 q3 0 6 0" fill="none" strokeWidth="1.8" strokeLinecap="round" />;
  } else if (mood === 'sleep') {
    leftEye  = <path d="M19 30 q3 0 6 0" fill="none" strokeWidth="1.8" strokeLinecap="round" />;
    rightEye = <path d="M31 30 q3 0 6 0" fill="none" strokeWidth="1.8" strokeLinecap="round" />;
  } else {
    leftEye  = <circle cx="22" cy={eyeY} r="2.2" />;
    rightEye = <circle cx="34" cy={eyeY} r="2.2" />;
  }

  let mouth;
  if (talking) {
    const shapes = [
      <ellipse key="0" cx="28" cy="40" rx="2.6" ry="2" fill="#FBF8F2" />,
      <ellipse key="1" cx="28" cy="40" rx="3.6" ry="1.4" fill="#FBF8F2" />,
      <ellipse key="2" cx="28" cy="40" rx="1.8" ry="1.4" fill="#FBF8F2" />,
    ];
    mouth = shapes[mouthFrame];
  } else if (mood === 'smile' || mood === 'encouraging') {
    mouth = <path d="M24 40 q4 4 8 0" stroke="#FBF8F2" strokeWidth="1.6" fill="none" strokeLinecap="round" />;
  } else if (mood === 'sleep') {
    mouth = <text x="38" y="22" fontSize="6" fill="#FBF8F2" fontFamily="serif">z</text>;
  } else {
    mouth = <circle cx="28" cy="40" r="0.9" fill="#FBF8F2" />;
  }

  return (
    <svg viewBox="0 0 56 64" width={size} height={size * 64 / 56} style={style}
         className={pulse ? 'inki-pulse' : ''} aria-label="Inki" role="img">
      <defs>
        <linearGradient id="inkiBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-ink, #8A3E1E)" />
          <stop offset="100%" stopColor="var(--accent, #C8633D)" />
        </linearGradient>
        <radialGradient id="inkiHi" cx="0.35" cy="0.35" r="0.4">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <path d="M28 4 C 28 14, 50 22, 50 38 A 22 22 0 1 1 6 38 C 6 22, 28 14, 28 4 Z"
            fill="url(#inkiBody)" />
      <path d="M28 4 C 28 14, 50 22, 50 38 A 22 22 0 1 1 6 38 C 6 22, 28 14, 28 4 Z"
            fill="url(#inkiHi)" />
      <g fill="#FBF8F2" stroke="#FBF8F2" style={{ transition: 'opacity 60ms' }}>
        {leftEye}
        {rightEye}
      </g>
      {mouth}
      {mood === 'encouraging' && (
        <>
          <circle cx="16" cy="36" r="2.5" fill="rgba(255,255,255,0.25)" />
          <circle cx="40" cy="36" r="2.5" fill="rgba(255,255,255,0.25)" />
        </>
      )}
    </svg>
  );
}

interface InkiCoachProps {
  size?: number;
  mood?: Mood;
  text: string;
  sub?: string;
  align?: 'left' | 'right';
}

export function InkiCoach({ size = 56, mood = 'smile', text, sub, align = 'left' }: InkiCoachProps) {
  const [talking, setTalking] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTalking(false), 1600);
    return () => clearTimeout(t);
  }, [text]);
  return (
    <div className={`inki-coach inki-coach-${align}`}>
      <InkiMascot size={size} mood={mood} pulse talking={talking} />
      <div className="inki-bubble">
        <div className="inki-bubble-text">{text}</div>
        {sub && <div className="inki-bubble-sub">{sub}</div>}
      </div>
    </div>
  );
}
