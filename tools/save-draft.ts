import type { ToolDefinition } from "@vellumai/plugin-api";
import {
  loadState,
  saveState,
  generateId,
  countWords,
  type DraftEntry,
} from "../src/store";

const tool: ToolDefinition = {
  description:
    "Save a draft to the user's writing gallery. Stores the draft text with its prompt, " +
    "genre, difficulty tier, word count, and date. Use after the user finishes writing a " +
    "draft in response to a daily prompt, or when they want to save any piece of writing " +
    "to their gallery. The gallery builds over time so they can see their progress.",
  input_schema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The draft text to save to the gallery.",
      },
      promptText: {
        type: "string",
        description: "The prompt that inspired this draft, if any.",
      },
      genre: {
        type: "string",
        description: "Genre of this draft. If omitted, uses saved preference.",
      },
      difficultyTier: {
        type: "number",
        description: "Difficulty tier of the prompt (1-4). If omitted, uses 1.",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tags for this draft (e.g. 'flash fiction', 'experiment').",
      },
    },
    required: ["text"],
  },
  defaultRiskLevel: "low",
  execute: async (
    input: {
      text: string;
      promptText?: string;
      genre?: string;
      difficultyTier?: number;
      tags?: string[];
    },
    ctx,
  ) => {
    try {
      const state = await loadState(ctx.workingDir);
      const wc = countWords(input.text);
      const genre = input.genre ?? state.config.genres[0] ?? "general";

      const entry: DraftEntry = {
        id: generateId("draft"),
        promptId: `manual_${Date.now()}`,
        promptText: input.promptText ?? "Freewrite (no prompt)",
        genre,
        difficultyTier: input.difficultyTier ?? 1,
        text: input.text,
        wordCount: wc,
        writtenAt: Date.now(),
        tags: input.tags ?? [],
      };

      state.drafts.push(entry);
      await saveState(ctx.workingDir, state);

      const totalDrafts = state.drafts.length;
      const totalWords = state.drafts.reduce((s, d) => s + d.wordCount, 0);

      return {
        content: {
          draftId: entry.id,
          wordCount: wc,
          totalDrafts,
          totalWordsInGallery: totalWords,
          message:
            `Draft saved to your gallery. ${wc} words. ` +
            `That's draft #${totalDrafts}, totaling ${totalWords} words across your gallery. ` +
            (totalDrafts % 10 === 0
              ? `${totalDrafts} drafts in the gallery. That's a body of work forming.`
              : totalDrafts === 1
                ? "First draft in the gallery. The gallery begins."
                : ""),
        },
      };
    } catch (err) {
      return {
        content: `Failed to save draft: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
    }
  },
};

export default tool;
