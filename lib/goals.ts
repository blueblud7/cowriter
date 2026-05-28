const KEY = 'cowriter-goals';

interface GoalStore {
  daily: number;
  days: Record<string, number>; // ISO date → words written
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): GoalStore {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { daily: 500, days: {} };
  } catch { return { daily: 500, days: {} }; }
}

function save(store: GoalStore): void {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {}
}

export function getDailyGoal(): number {
  return load().daily;
}

export function setDailyGoal(words: number): void {
  const store = load();
  store.daily = Math.max(1, words);
  save(store);
}

export function addWordsToday(delta: number): void {
  if (delta <= 0) return;
  const store = load();
  const d = today();
  store.days[d] = (store.days[d] || 0) + delta;
  // keep only last 90 days
  const keys = Object.keys(store.days).sort();
  if (keys.length > 90) {
    keys.slice(0, keys.length - 90).forEach(k => delete store.days[k]);
  }
  save(store);
}

export function getTodayWords(): number {
  return load().days[today()] || 0;
}

export function getStreak(): number {
  const { days } = load();
  let streak = 0;
  const d = new Date();
  // start from yesterday if today has no words yet
  if (!days[today()]) d.setDate(d.getDate() - 1);
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (!days[key] || days[key] <= 0) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function getTodayProgress(): number {
  const { daily } = load();
  return Math.min(1, getTodayWords() / daily);
}
