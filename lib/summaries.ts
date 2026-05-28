const KEY = 'cowriter-summaries';

type SummaryStore = Record<string, string>; // chapterId → summary

function load(): SummaryStore {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function save(store: SummaryStore) {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {}
}

export function getSummary(chapterId: string): string {
  return load()[chapterId] || '';
}

export function setSummary(chapterId: string, summary: string): void {
  const store = load();
  store[chapterId] = summary;
  save(store);
}

export function getAllSummaries(): SummaryStore {
  return load();
}
