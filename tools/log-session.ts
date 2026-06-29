import type { ToolDefinition } from "@vellumai/plugin-api";
import {
  loadState,
  saveState,
  generateId,
  updateStreak,
  todayStr,
  daysSinceLastSession,
  type SessionEntry,
} from "../src/store";

const tool: ToolDefinition = {
  description:
    "Log a writing session: record word count and duration, update the user's writing streak. " +
    "Use when the user finishes a writing session, reports how many words they wrote, " +
    "or says they just wrote for X minutes. Also use when they want to set or update " +
    "their daily word count target or session length preference.",
  input_schema: {
    type: "object",
    properties: {
      wordCount: {
        type: "number",
        description: "Number of words written in this session.",
      },
      durationMinutes: {
        type: "number",
        description: "How long the session lasted in minutes. If omitted, estimates from word count.",
      },
      project: {
        type: "string",
        description: "What project this session was for (e.g. 'novel', 'short story', 'blog post'). Default: 'general'.",
      },
      setDailyTarget: {
        type: "number",
        description: "Set or update the daily word count target. Optional.",
      },
      setSessionMinutes: {
        type: "number",
        description: "Set or update the target session length in minutes. Optional.",
      },
    },
    required: ["wordCount"],
  },
  defaultRiskLevel: "low",
  execute: async (
    input: {
      wordCount: number;
      durationMinutes?: number;
      project?: string;
      setDailyTarget?: number;
      setSessionMinutes?: number;
    },
    ctx,
  ) => {
    try {
      const state = await loadState(ctx.workingDir);

      // Update config if requested
      if (input.setDailyTarget) {
        state.config.dailyTarget = input.setDailyTarget;
      }
      if (input.setSessionMinutes) {
        state.config.sessionMinutes = input.setSessionMinutes;
      }

      const today = todayStr();
      const duration =
        input.durationMinutes ?? Math.max(5, Math.round(input.wordCount / 25));

      // Check if already logged today
      const existingToday = state.sessions.find((s) => s.date === today);

      const session: SessionEntry = {
        id: generateId("sess"),
        date: today,
        wordCount: input.wordCount,
        durationMinutes: duration,
        project: input.project ?? "general",
      };

      if (existingToday) {
        // Add to today's existing session
        existingToday.wordCount += input.wordCount;
        existingToday.durationMinutes += duration;
      } else {
        state.sessions.push(session);
      }

      // Update streak
      const prevStreak = state.streak.current;
      state.streak = updateStreak(state.streak);
      const streakDelta = state.streak.current - prevStreak;

      await saveState(ctx.workingDir, state);

      // Build response
      const target = state.config.dailyTarget;
      const todayTotal = state.sessions
        .filter((s) => s.date === today)
        .reduce((sum, s) => sum + s.wordCount, 0);
      const hitTarget = todayTotal >= target;

      const messages: string[] = [];
      messages.push(
        `Logged ${input.wordCount} words in ${duration} min. Today's total: ${todayTotal}/${target} words.`,
      );

      if (hitTarget && todayTotal - input.wordCount < target) {
        messages.push(`Daily target hit. ${todayTotal} words today. That's the bar cleared.`);
      }

      if (streakDelta > 0) {
        if (state.streak.current === prevStreak + 1 && prevStreak === 0) {
          messages.push("Streak started. Day 1. The hardest one.");
        } else if (state.streak.current === 7) {
          messages.push("7-day streak. That's a habit forming.");
        } else if (state.streak.current === 14) {
          messages.push("14 days. This is who you are now: someone who writes.");
        } else if (state.streak.current === 30) {
          messages.push("30-day streak. That's not a streak, that's a practice.");
        } else if (streakDelta > 0) {
          messages.push(`Streak: ${state.streak.current} days.`);
        }
      }

      if (state.streak.longest === state.streak.current && streakDelta > 0) {
        messages.push(`New personal best. Longest streak: ${state.streak.longest} days.`);
      }

      return {
        content: {
          sessionWordCount: input.wordCount,
          todayTotal,
          dailyTarget: target,
          hitTarget,
          streak: state.streak.current,
          longestStreak: state.streak.longest,
          durationMinutes: duration,
          project: input.project ?? "general",
          message: messages.join(" "),
        },
      };
    } catch (err) {
      return {
        content: `Failed to log session: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
    }
  },
};

export default tool;
