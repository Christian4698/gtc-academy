import * as FileSystem from 'expo-file-system';
import { Course, Profile, QuizAttempt, SyncQueueItem } from '../types';

const CACHE_ROOT = `${FileSystem.documentDirectory ?? ''}gtc-offline-cache/`;
const PROFILE_FILE = 'profile.json';
const COURSES_FILE = 'courses.json';
const PROGRESS_FILE = 'progress.json';
const EXAM_RESULTS_FILE = 'exam-results.json';
const SYNC_QUEUE_FILE = 'sync-queue.json';

async function ensureCacheDir() {
  const info = await FileSystem.getInfoAsync(CACHE_ROOT);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_ROOT, { intermediates: true });
  }
}

async function readJson<T>(fileName: string, fallback: T): Promise<T> {
  try {
    await ensureCacheDir();
    const path = `${CACHE_ROOT}${fileName}`;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return fallback;
    const raw = await FileSystem.readAsStringAsync(path);
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(fileName: string, value: T): Promise<void> {
  await ensureCacheDir();
  await FileSystem.writeAsStringAsync(`${CACHE_ROOT}${fileName}`, JSON.stringify(value));
}

export const OfflineCacheService = {
  async cacheProfile(profile: Profile) {
    await writeJson(PROFILE_FILE, {
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      plan: profile.plan,
      role: profile.role ?? 'student',
      preferred_language: profile.preferred_language ?? 'fr',
      theme_preference: profile.theme_preference ?? 'system',
      low_data_mode: profile.low_data_mode ?? false,
    });
  },

  async getCachedProfile(): Promise<Partial<Profile> | null> {
    return readJson<Partial<Profile> | null>(PROFILE_FILE, null);
  },

  async cacheCourses(courses: Course[]) {
    await writeJson(COURSES_FILE, courses);
  },

  async getCachedCourses(): Promise<Course[]> {
    return readJson<Course[]>(COURSES_FILE, []);
  },

  async cacheProgress(courseId: string, progress: number) {
    const progressMap = await readJson<Record<string, number>>(PROGRESS_FILE, {});
    progressMap[courseId] = progress;
    await writeJson(PROGRESS_FILE, progressMap);
  },

  async getProgressCache(): Promise<Record<string, number>> {
    return readJson<Record<string, number>>(PROGRESS_FILE, {});
  },

  async cacheExamResult(attempt: QuizAttempt) {
    const results = await readJson<QuizAttempt[]>(EXAM_RESULTS_FILE, []);
    await writeJson(EXAM_RESULTS_FILE, [attempt, ...results.filter(item => item.id !== attempt.id)].slice(0, 100));
  },

  async getExamResultCache(): Promise<QuizAttempt[]> {
    return readJson<QuizAttempt[]>(EXAM_RESULTS_FILE, []);
  },

  async enqueueSync(item: Omit<SyncQueueItem, 'id' | 'retryCount' | 'createdAt'>) {
    const queue = await readJson<SyncQueueItem[]>(SYNC_QUEUE_FILE, []);
    const nextItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    await writeJson(SYNC_QUEUE_FILE, [...queue, nextItem]);
    return nextItem;
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return readJson<SyncQueueItem[]>(SYNC_QUEUE_FILE, []);
  },

  async flushSyncQueue(processor: (item: SyncQueueItem) => Promise<boolean>) {
    const queue = await readJson<SyncQueueItem[]>(SYNC_QUEUE_FILE, []);
    const remaining: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        const processed = await processor(item);
        if (!processed) remaining.push({ ...item, retryCount: item.retryCount + 1 });
      } catch {
        remaining.push({ ...item, retryCount: item.retryCount + 1 });
      }
    }

    await writeJson(SYNC_QUEUE_FILE, remaining);
    return { processed: queue.length - remaining.length, remaining: remaining.length };
  },

  async clearAll() {
    const info = await FileSystem.getInfoAsync(CACHE_ROOT);
    if (info.exists) {
      await FileSystem.deleteAsync(CACHE_ROOT, { idempotent: true });
    }
  },
};
