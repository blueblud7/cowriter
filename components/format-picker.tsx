'use client';
import { useState } from 'react';
import { WRITING_FORMATS, type WritingCategory, type Lang } from '@/lib/data';

interface FormatPickerProps {
  lang: Lang;
  current: string;
  onApply: (formatId: string) => void;
  onClose: () => void;
}

const CATS: Array<[WritingCategory | 'all', string, string]> = [
  ['all',        '전체',   'All'],
  ['fiction',    '소설',   'Fiction'],
  ['essay',      '에세이', 'Essay'],
  ['journal',    '저널',   'Journal'],
  ['nonfiction', '논픽션', 'Non-Fiction'],
  ['poetry',     '시',     'Poetry'],
];

export function FormatPicker({ lang, current, onApply, onClose }: FormatPickerProps) {
  const [cat, setCat] = useState<WritingCategory | 'all'>('all');
  const [selected, setSelected] = useState(current);

  const visible = cat === 'all' ? WRITING_FORMATS : WRITING_FORMATS.filter(f => f.category === cat);
  const cur = WRITING_FORMATS.find(f => f.id === selected);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
         onClick={onClose}>
      <div style={{ background: 'var(--surface-1)', borderRadius: 16, width: '100%', maxWidth: 660, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{lang === 'kr' ? '✦ 글 형식 선택' : '✦ Choose Writing Format'}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                {lang === 'kr' ? '선택한 형식이 AI 자동완성·가이드·자동작성에 모두 반영됩니다' : 'All AI features adapt to your chosen format'}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--ink-3)', paddingTop: 2 }}>✕</button>
          </div>
          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATS.map(([id, kr, en]) => (
              <button key={id} onClick={() => setCat(id as WritingCategory | 'all')}
                style={{ padding: '5px 14px', fontSize: 12, fontWeight: cat === id ? 700 : 400, background: cat === id ? 'var(--accent)' : 'var(--surface-2)', color: cat === id ? 'var(--accent-ink, #fff)' : 'var(--ink-3)', border: 'none', borderRadius: 999, cursor: 'pointer', transition: 'background 0.15s' }}>
                {lang === 'kr' ? kr : en}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {visible.map(f => {
              const isSel = selected === f.id;
              return (
                <button key={f.id} onClick={() => setSelected(f.id)}
                  style={{ padding: '14px 12px', borderRadius: 12, border: `2px solid ${isSel ? f.swatch : 'var(--border)'}`, background: isSel ? f.swatch + '18' : 'var(--surface-2)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 24, marginBottom: 7, lineHeight: 1 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? f.swatch : 'var(--ink)', marginBottom: 4 }}>{f[lang].name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', lineHeight: 1.4 }}>{f[lang].desc}</div>
                  {isSel && (
                    <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: f.swatch }}>✓ {lang === 'kr' ? '선택됨' : 'Selected'}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)' }}>
            {cur && (
              <>
                <span style={{ fontSize: 20 }}>{cur.icon}</span>
                <div>
                  <b>{cur[lang].name}</b>
                  <span style={{ color: 'var(--ink-4)', marginLeft: 8, fontSize: 12 }}>{cur[lang].desc}</span>
                </div>
              </>
            )}
          </div>
          <button onClick={onClose}
            style={{ padding: '8px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--ink-2)' }}>
            {lang === 'kr' ? '취소' : 'Cancel'}
          </button>
          <button onClick={() => { onApply(selected); onClose(); }}
            style={{ padding: '8px 22px', background: cur?.swatch || 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            {lang === 'kr' ? '적용' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
