import type { ToolDefinition } from "@vellumai/plugin-api";
import {
  loadState,
  totalWords,
  daysSinceLastSession,
  todayStr,
} from "../src/store";

const tool: ToolDefinition = {
  description:
    "Show writing session statistics: current streak, longest streak, total words written, " +
    "total sessions, average words per session, days since last session, and whether the " +
    "daily target was hit today. Use when the user asks about their writing stats, progress, " +
    "streak, how much they've written, or if they're wondering whether they skipped.",
  input_schema: {
    type: "object",
    properties: {
      days: {
        type: "number",
        description: "Number of recent days to show session details for. Default: 7.",
      },
    },
    required: [],
  },
  defaultRiskLevel: "low",
  execute: async (input: { days?: number }, ctx) => {
    try {
      const state = await loadState(ctx.workingDir);
      const sessions = state.sessions;

      if (sessions.length === 0) {
        return {
          content:
            "No writing sessions logged yet. You haven't started. " +
            "Forge a prompt, write something, log it. Day 1 is waiting.",
        };
      }

      const allTimeWords = totalWords(sessions);
      const avgWords = Math.round(allTimeWords / sessions.length);
      const today = todayStr();
      const todaySessions = sessions.filter((s) => s.date === today);
      const todayWords = todaySessions.reduce((s, sess) => s + sess.wordCount, 0);
      const daysSince = daysSinceLastSession(state.streak);
      const skippedYesterday =
        daysSince !== null && daysSince >= 2 && state.streak.lastSessionDate !== today;

      // Recent sessions
      const lookback = input.days ?? 7;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - lookback);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      const recentSessions = sessions
        .filter((s) => s.date >= cutoffStr)
        .sort((a, b) => b.date.localeCompare(a.date));

      // Build guilt message if skipped
      let guiltMessage: string | null = null;
      if (skippedYesterday) {
        if (daysSince && daysSince >= 7) {
          guiltMessage =
            `It's been ${daysSince} days since you wrote. Your streak died at ${state.streak.current} days. ` +
            "That's not a gap, that's a funeral. Start again. Day 1. Right now.";
        } else if (daysSince && daysSince >= 3) {
          guiltMessage =
            `${daysSince} days since you wrote. The streak is broken. ` +
            "You can sit with that, or you can pick up the pen. Your call.";
        } else if (daysSince === 2) {
          guiltMessage =
            "You didn't write yesterday. That's a choice. A bad one, but a choice. " +
            "Write today and the streak resets to 1. Not a tragedy, just a Tuesday.";
        }
      }

      return {
        content: {
          streak: state.streak.current,
          longestStreak: state.streak.longest,
          lastSessionDate: state.streak.lastSessionDate,
          daysSinceLastSession: daysSince,
          totalSessions: sessions.length,
          totalWords: allTimeWords,
          averageWordsPerSession: avgWords,
          dailyTarget: state.config.dailyTarget,
          todayWords,
          todayTargetHit: todayWords >= state.config.dailyTarget,
          skippedYesterday,
          guiltMessage,
          recentSessions: recentSessions.map((s) => ({
            date: s.date,
            wordCount: s.wordCount,
            durationMinutes: s.durationMinutes,
            project: s.project,
          })),
          message:
            `Streak: ${state.streak.current} day${state.streak.current === 1 ? "" : "s"} (longest: ${state.streak.longest}). ` +
            `Total: ${allTimeWords} words across ${sessions.length} session${sessions.length === 1 ? "" : "s"}. ` +
            `Avg: ${avgWords} words/session. ` +
            (todayWords > 0
              ? `Today: ${todayWords}/${state.config.dailyTarget} words.`
              : "Today: 0 words. The page is still blank."),
        },
      };
    } catch (err) {
      return {
        content: `Failed to load stats: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
    }
  },
};

export default tool;
