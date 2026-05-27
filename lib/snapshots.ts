export interface Snapshot {
  id: string;
  chapterId: string;
  body: string;
  wordCount: number;
  label: 'auto' | 'manual';
  createdAt: string;
}

const key = (chapterId: string) => `cowriter-snaps-${chapterId}`;

export function getSnapshots(chapterId: string): Snapshot[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(key(chapterId)) || '[]'); }
  catch { return []; }
}

export function saveSnapshot(chapterId: string, body: string, label: 'auto' | 'manual' = 'manual'): Snapshot {
  const snap: Snapshot = {
    id: `snap-${Date.now()}`,
    chapterId,
    body,
    wordCount: body.trim().split(/\s+/).filter(Boolean).length,
    label,
    createdAt: new Date().toISOString(),
  };
  const next = [snap, ...getSnapshots(chapterId)].slice(0, 30);
  localStorage.setItem(key(chapterId), JSON.stringify(next));
  return snap;
}

export function deleteSnapshot(chapterId: string, snapId: string): void {
  const next = getSnapshots(chapterId).filter(s => s.id !== snapId);
  localStorage.setItem(key(chapterId), JSON.stringify(next));
}
