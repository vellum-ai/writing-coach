/**
 * Local persistence for Red Pen.
 * Stores writer config, draft gallery, writing sessions, and streaks
 * in a JSON file inside the plugin data directory.
 *
 * The plugin data directory is <workspaceDir>/plugins-data/red-pen/.
 * InitContext provides pluginStorageDir to hooks, but ToolContext does not
 * expose it, so tools derive the path from ctx.workingDir.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WriterConfig {
  genres: string[];
  dailyTarget: number;
  sessionMinutes: number;
}

export interface DraftEntry {
  id: string;
  promptId: string;
  promptText: string;
  genre: string;
  difficultyTier: number;
  text: string;
  wordCount: number;
  writtenAt: number;
  tags: string[];
}

export interface SessionEntry {
  id: string;
  date: string;
  wordCount: number;
  durationMinutes: number;
  project: string;
}

export interface RedPenState {
  config: WriterConfig;
  drafts: DraftEntry[];
  sessions: SessionEntry[];
  streak: {
    current: number;
    longest: number;
    lastSessionDate: string | null;
  };
  lastPromptDate: string | null;
  lastPromptId: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATE_FILE = "red-pen-state.json";
const PLUGIN_NAME = "red-pen";

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

export function defaultState(): RedPenState {
  return {
    config: {
      genres: [],
      dailyTarget: 500,
      sessionMinutes: 25,
    },
    drafts: [],
    sessions: [],
    streak: {
      current: 0,
      longest: 0,
      lastSessionDate: null,
    },
    lastPromptDate: null,
    lastPromptId: null,
  };
}

function resolveStorageDir(workingDir: string | undefined): string {
  const base = workingDir ?? "/workspace";
  return path.join(base, "plugins-data", PLUGIN_NAME);
}

export async function loadState(
  workingDir: string | undefined,
): Promise<RedPenState> {
  const storageDir = resolveStorageDir(workingDir);
  const filePath = path.join(storageDir, STATE_FILE);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return mergeState(defaultState(), parsed);
  } catch {
    return defaultState();
  }
}

export async function saveState(
  workingDir: string | undefined,
  state: RedPenState,
): Promise<void> {
  const storageDir = resolveStorageDir(workingDir);
  await fs.mkdir(storageDir, { recursive: true });
  const filePath = path.join(storageDir, STATE_FILE);
  await fs.writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
}

function mergeState(
  base: RedPenState,
  incoming: Partial<RedPenState>,
): RedPenState {
  return {
    config: { ...base.config, ...(incoming.config ?? {}) },
    drafts: incoming.drafts ?? base.drafts,
    sessions: incoming.sessions ?? base.sessions,
    streak: { ...base.streak, ...(incoming.streak ?? {}) },
    lastPromptDate: incoming.lastPromptDate ?? base.lastPromptDate,
    lastPromptId: incoming.lastPromptId ?? base.lastPromptId,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const ms = Math.abs(new Date(b).getTime() - new Date(a).getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Update the writing streak when a session is logged.
 * If the last session was yesterday, increment. If today, no change.
 * If more than 1 day gap, reset to 1.
 */
export function updateStreak(
  streak: RedPenState["streak"],
): RedPenState["streak"] {
  const today = todayStr();
  if (streak.lastSessionDate === today) {
    return streak;
  }
  if (streak.lastSessionDate) {
    const gap = daysBetween(streak.lastSessionDate, today);
    if (gap === 1) {
      const newCurrent = streak.current + 1;
      return {
        current: newCurrent,
        longest: Math.max(streak.longest, newCurrent),
        lastSessionDate: today,
      };
    }
  }
  return {
    current: 1,
    longest: Math.max(streak.longest, 1),
    lastSessionDate: today,
  };
}

/**
 * Check whether the user wrote yesterday. Used for guilt messages.
 * Returns the number of days since the last session, or null if never.
 */
export function daysSinceLastSession(
  streak: RedPenState["streak"],
): number | null {
  if (!streak.lastSessionDate) return null;
  return daysBetween(streak.lastSessionDate, todayStr());
}

/**
 * Total words written across all sessions.
 */
export function totalWords(sessions: SessionEntry[]): number {
  return sessions.reduce((sum, s) => sum + s.wordCount, 0);
}

/**
 * Total words written across all drafts in the gallery.
 */
export function totalDraftWords(drafts: DraftEntry[]): number {
  return drafts.reduce((sum, d) => sum + d.wordCount, 0);
}
