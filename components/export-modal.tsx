'use client';
import { useState } from 'react';
import type { Lang } from '@/lib/data';

interface ExportChapter {
  n: number;
  title: string;
  body: string;
}

interface ExportModalProps {
  lang: Lang;
  chapters: ExportChapter[];
  projectTitle?: string;
  onClose: () => void;
}

function wc(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function buildTxt(chapters: ExportChapter[], selected: Set<number>): string {
  return chapters
    .filter(c => selected.has(c.n) && c.body.trim())
    .map(c => `Chapter ${String(c.n).padStart(2, '0')}: ${c.title}\n\n${c.body}`)
    .join('\n\n' + '─'.repeat(40) + '\n\n');
}

function buildMarkdown(chapters: ExportChapter[], selected: Set<number>): string {
  return chapters
    .filter(c => selected.has(c.n) && c.body.trim())
    .map(c => `# Chapter ${c.n}: ${c.title}\n\n${c.body}`)
    .join('\n\n---\n\n');
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printPdf(chapters: ExportChapter[], selected: Set<number>, projectTitle: string, lang: Lang) {
  const chaps = chapters.filter(c => selected.has(c.n) && c.body.trim());
  const html = `<!DOCTYPE html>
<html lang="${lang === 'kr' ? 'ko' : 'en'}">
<head>
<meta charset="utf-8" />
<title>${projectTitle}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; font-size: 12pt; line-height: 1.8; color: #111;
         max-width: 640px; margin: 0 auto; padding: 48pt 48pt; }
  h1.cover { font-size: 28pt; text-align: center; margin-bottom: 8pt; font-weight: 700; }
  .cover-sub { text-align: center; color: #555; font-size: 10pt; margin-bottom: 48pt; }
  .chapter-title { font-size: 18pt; font-weight: 700; margin-top: 48pt; margin-bottom: 24pt;
                    page-break-before: always; }
  .chapter-title:first-of-type { page-break-before: avoid; }
  p { margin-bottom: 12pt; text-indent: 2em; }
  p:first-child { text-indent: 0; }
  hr { border: none; border-top: 1px solid #ddd; margin: 24pt 0; }
  @media print {
    body { max-width: none; margin: 0; padding: 1in; }
    .chapter-title { page-break-before: always; }
  }
</style>
</head>
<body>
<h1 class="cover">${projectTitle}</h1>
<div class="cover-sub">${chaps.reduce((s, c) => s + wc(c.body), 0).toLocaleString()} ${lang === 'kr' ? '단어' : 'words'} · ${chaps.length} ${lang === 'kr' ? '챕터' : 'chapters'}</div>
${chaps.map(c => `<div class="chapter-title">Chapter ${c.n}: ${c.title}</div>
${c.body.split('\n').filter(l => l.trim()).map(l => `<p>${l.trim()}</p>`).join('\n')}`).join('\n')}
</body>
</html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

export function ExportModal({ lang, chapters, projectTitle = 'My Story', onClose }: ExportModalProps) {
  const writtenChapters = chapters.filter(c => c.body.trim());
  const [selected, setSelected] = useState<Set<number>>(
    new Set(writtenChapters.map(c => c.n))
  );
  const [copied, setCopied] = useState(false);

  const toggleAll = () => {
    if (selected.size === writtenChapters.length) setSelected(new Set());
    else setSelected(new Set(writtenChapters.map(c => c.n)));
  };

  const toggleChap = (n: number) => {
    const next = new Set(selected);
    next.has(n) ? next.delete(n) : next.add(n);
    setSelected(next);
  };

  const selectedChaps = writtenChapters.filter(c => selected.has(c.n));
  const totalWords = selectedChaps.reduce((s, c) => s + wc(c.body), 0);
  const slug = projectTitle.replace(/\s+/g, '-').toLowerCase().slice(0, 30) || 'story';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
         onClick={onClose}>
      <div style={{ background: 'var(--surface-1)', borderRadius: 18, boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
                    width: '100%', maxWidth: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
                    overflow: 'hidden' }}
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              📤 {lang === 'kr' ? '내보내기' : 'Export'}
            </div>
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--ink-3)' }}>✕</button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
            {selectedChaps.length}{lang === 'kr' ? '개 챕터' : ' chapters'} · {totalWords.toLocaleString()} {lang === 'kr' ? '단어' : 'words'}
          </div>
        </div>

        {/* Chapter selection */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lang === 'kr' ? '챕터 선택' : 'Select chapters'}
            </span>
            <button onClick={toggleAll}
              style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {selected.size === writtenChapters.length
                ? (lang === 'kr' ? '전체 해제' : 'Deselect all')
                : (lang === 'kr' ? '전체 선택' : 'Select all')}
            </button>
          </div>

          {writtenChapters.length === 0 ? (
            <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
              {lang === 'kr' ? '아직 작성된 챕터가 없습니다.' : 'No written chapters yet.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {writtenChapters.map(c => (
                <label key={c.n}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                           background: selected.has(c.n) ? 'var(--accent)10' : 'var(--surface-2)',
                           border: `1px solid ${selected.has(c.n) ? 'var(--accent)44' : 'var(--border)'}`,
                           borderRadius: 9, cursor: 'pointer', transition: 'all 0.12s' }}>
                  <input type="checkbox" checked={selected.has(c.n)} onChange={() => toggleChap(c.n)}
                    style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', minWidth: 28 }}>
                    {String(c.n).padStart(2, '0')}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{wc(c.body).toLocaleString()}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Export buttons */}
        <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {/* TXT */}
            <button
              disabled={selected.size === 0}
              onClick={() => download(buildTxt(chapters, selected), `${slug}.txt`, 'text/plain')}
              style={{ padding: '10px 8px', fontSize: 13, fontWeight: 600, background: 'var(--surface-2)',
                       border: '1px solid var(--border)', borderRadius: 10, cursor: selected.size ? 'pointer' : 'not-allowed',
                       opacity: selected.size ? 1 : 0.4, display: 'flex', flexDirection: 'column',
                       alignItems: 'center', gap: 4, color: 'var(--ink-1)' }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <span>.txt</span>
            </button>
            {/* Markdown */}
            <button
              disabled={selected.size === 0}
              onClick={() => download(buildMarkdown(chapters, selected), `${slug}.md`, 'text/markdown')}
              style={{ padding: '10px 8px', fontSize: 13, fontWeight: 600, background: 'var(--surface-2)',
                       border: '1px solid var(--border)', borderRadius: 10, cursor: selected.size ? 'pointer' : 'not-allowed',
                       opacity: selected.size ? 1 : 0.4, display: 'flex', flexDirection: 'column',
                       alignItems: 'center', gap: 4, color: 'var(--ink-1)' }}>
              <span style={{ fontSize: 20 }}>📝</span>
              <span>.md</span>
            </button>
            {/* PDF */}
            <button
              disabled={selected.size === 0}
              onClick={() => printPdf(chapters, selected, projectTitle, lang)}
              style={{ padding: '10px 8px', fontSize: 13, fontWeight: 600, background: 'var(--accent)',
                       border: 'none', borderRadius: 10, cursor: selected.size ? 'pointer' : 'not-allowed',
                       opacity: selected.size ? 1 : 0.4, display: 'flex', flexDirection: 'column',
                       alignItems: 'center', gap: 4, color: '#fff' }}>
              <span style={{ fontSize: 20 }}>🖨</span>
              <span>PDF</span>
            </button>
          </div>

          {/* Copy all */}
          <button
            disabled={selected.size === 0}
            onClick={() => {
              navigator.clipboard.writeText(buildTxt(chapters, selected));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={{ width: '100%', padding: '9px 12px', fontSize: 13, fontWeight: 600,
                     background: copied ? '#10b981' : 'var(--surface-2)',
                     color: copied ? '#fff' : 'var(--ink-2)',
                     border: `1px solid ${copied ? '#10b981' : 'var(--border)'}`,
                     borderRadius: 10, cursor: selected.size ? 'pointer' : 'not-allowed',
                     opacity: selected.size ? 1 : 0.4, transition: 'all 0.2s' }}>
            {copied
              ? (lang === 'kr' ? '✓ 클립보드에 복사됨' : '✓ Copied to clipboard')
              : (lang === 'kr' ? '📋 클립보드에 복사' : '📋 Copy to clipboard')}
          </button>

          <div style={{ fontSize: 11, color: 'var(--ink-4)', textAlign: 'center' }}>
            {lang === 'kr'
              ? 'PDF는 새 창에서 인쇄 → PDF로 저장하세요.'
              : 'PDF: opens a print dialog in a new window — save as PDF.'}
          </div>
        </div>
      </div>
    </div>
  );
}
