export interface Draft {
  id: string;
  chapterId: string;
  label: string;
  body: string;
  wordCount: number;
  createdAt: string;
}

const key = (chapterId: string) => `cowriter-drafts-${chapterId}`;

export function getDrafts(chapterId: string): Draft[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(key(chapterId)) || '[]'); }
  catch { return []; }
}

export function createDraft(chapterId: string, label: string, body: string): Draft {
  const draft: Draft = {
    id: `draft-${Date.now()}`,
    chapterId,
    label,
    body,
    wordCount: body.trim().split(/\s+/).filter(Boolean).length,
    createdAt: new Date().toISOString(),
  };
  const next = [...getDrafts(chapterId), draft];
  localStorage.setItem(key(chapterId), JSON.stringify(next));
  return draft;
}

export function deleteDraft(chapterId: string, draftId: string): void {
  const next = getDrafts(chapterId).filter(d => d.id !== draftId);
  localStorage.setItem(key(chapterId), JSON.stringify(next));
}
