export const STORAGE_KEYS = {
  profile: "little-signs-profile",
  progress: "little-signs-progress"
};

export const defaultProgress = {
  signs: {},
  customWords: [],
  routinesCompleted: {},
  streak: {
    current: 0,
    lastPracticeDate: null
  }
};

export function loadLocal(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Could not load ${key} from localStorage`, error);
    return fallback;
  }
}

export function saveLocal(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save ${key} to localStorage`, error);
  }
}

export function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayString() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function updateStreak(streak = defaultProgress.streak) {
  const today = todayString();
  if (streak.lastPracticeDate === today) return streak;

  const continued = streak.lastPracticeDate === yesterdayString();
  return {
    current: continued ? streak.current + 1 : 1,
    lastPracticeDate: today
  };
}
