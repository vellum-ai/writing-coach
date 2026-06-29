import type { ToolDefinition } from "@vellumai/plugin-api";
import { loadState, totalDraftWords } from "../src/store";

const tool: ToolDefinition = {
  description:
    "Show the user's draft gallery: all saved drafts with dates, word counts, " +
    "genres, and prompts. Use when the user asks to see their drafts, their gallery, " +
    "their writing history, or how much they've written. Supports limiting to recent " +
    "drafts with the 'limit' parameter.",
  input_schema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of recent drafts to show. Default is all.",
      },
    },
    required: [],
  },
  defaultRiskLevel: "low",
  execute: async (input: { limit?: number }, ctx) => {
    try {
      const state = await loadState(ctx.workingDir);
      const drafts = state.drafts;

      if (drafts.length === 0) {
        return {
          content:
            "Your gallery is empty. No drafts saved yet. " +
            "Forge a daily prompt and write something. The gallery starts with one draft.",
        };
      }

      const sorted = [...drafts].sort((a, b) => b.writtenAt - a.writtenAt);
      const limited = input.limit ? sorted.slice(0, input.limit) : sorted;
      const totalWords = totalDraftWords(drafts);

      const gallery = limited.map((d) => ({
        id: d.id,
        date: new Date(d.writtenAt).toISOString().slice(0, 10),
        genre: d.genre,
        wordCount: d.wordCount,
        tier: d.difficultyTier,
        prompt: d.promptText,
        preview: d.text.slice(0, 100) + (d.text.length > 100 ? "..." : ""),
        tags: d.tags,
      }));

      return {
        content: {
          totalDrafts: drafts.length,
          totalWords,
          draftsShown: gallery.length,
          gallery,
          message:
            `Your gallery has ${drafts.length} draft${drafts.length === 1 ? "" : "s"}, ` +
            `totaling ${totalWords} words. ` +
            (drafts.length >= 30
              ? "That's a serious gallery. You're building something."
              : drafts.length >= 10
                ? "Double digits. This is becoming a habit."
                : ""),
        },
      };
    } catch (err) {
      return {
        content: `Failed to load gallery: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
    }
  },
};

export default tool;
