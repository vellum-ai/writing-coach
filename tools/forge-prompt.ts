import type { ToolDefinition } from "@vellumai/plugin-api";
import { loadState, saveState, todayStr } from "../src/store";
import { forgePrompt, getTierForStreak, getTierName } from "../src/prompt-engine";

const tool: ToolDefinition = {
  description:
    "Generate today's writing prompt calibrated to the user's genre and streak. " +
    "Difficulty escalates with streak: Tier 1 (Foundation) for new writers, " +
    "Tier 2 (Constraint) at 3-day streak, Tier 3 (Structural) at 7 days, " +
    "Tier 4 (Master) at 15 days. Returns a prompt seed with theme, constraints, " +
    "and craft focus. Use when the user asks for a writing prompt, daily prompt, " +
    "wants to write something, or says 'give me something to write about'.",
  input_schema: {
    type: "object",
    properties: {
      genre: {
        type: "string",
        description:
          "Genre to calibrate the prompt for. If omitted, uses the user's saved genre preference. " +
          "Examples: literary fiction, memoir, sci-fi, fantasy, mystery, romance, horror, YA, poetry.",
      },
    },
    required: [],
  },
  defaultRiskLevel: "low",
  execute: async (input: { genre?: string }, ctx) => {
    try {
      const state = await loadState(ctx.workingDir);

      const genre = input.genre ?? state.config.genres[0] ?? "general";
      const today = todayStr();

      // If we already forged a prompt today, return it
      if (state.lastPromptDate === today && state.lastPromptId) {
        // Re-forge deterministically (same date + genre = same prompt)
        const seed = forgePrompt(state.streak.current, genre, today);
        return {
          content: {
            promptId: seed.promptId,
            tier: seed.tier,
            tierName: seed.tierName,
            genre: seed.genre,
            theme: seed.theme,
            constraints: seed.constraints,
            craftFocus: seed.craftFocus,
            estimatedMinutes: seed.estimatedMinutes,
            streak: state.streak.current,
            alreadyForged: true,
            message: `Here's your prompt for today (already forged earlier). Tier ${seed.tier}: ${seed.tierName}. Streak: ${state.streak.current} days.`,
          },
        };
      }

      const seed = forgePrompt(state.streak.current, genre, today);

      // Save the prompt date
      state.lastPromptDate = today;
      state.lastPromptId = seed.promptId;
      await saveState(ctx.workingDir, state);

      const nextTierStreak =
        seed.tier === 1 ? 3 : seed.tier === 2 ? 7 : seed.tier === 3 ? 15 : null;

      return {
        content: {
          promptId: seed.promptId,
          tier: seed.tier,
          tierName: seed.tierName,
          genre: seed.genre,
          theme: seed.theme,
          constraints: seed.constraints,
          craftFocus: seed.craftFocus,
          estimatedMinutes: seed.estimatedMinutes,
          streak: state.streak.current,
          alreadyForged: false,
          nextTierAt: nextTierStreak,
          message:
            `New prompt forged. Tier ${seed.tier}: ${seed.tierName}. ` +
            `Your streak is ${state.streak.current} day${state.streak.current === 1 ? "" : "s"}.` +
            (nextTierStreak
              ? ` Next tier (${getTierName(getTierForStreak(nextTierStreak))}) at ${nextTierStreak} days.`
              : " You're at the highest tier. Respect."),
        },
      };
    } catch (err) {
      return {
        content: `Failed to forge prompt: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
    }
  },
};

export default tool;
