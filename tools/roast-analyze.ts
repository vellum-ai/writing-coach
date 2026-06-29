import type { ToolDefinition } from "@vellumai/plugin-api";
import { fullRoastAnalysis } from "../src/text-analysis";

const tool: ToolDefinition = {
  description:
    "Run programmatic text analysis on a piece of prose. Returns metrics the assistant " +
    "uses to deliver a constructive-but-savage roast: adverb density, passive voice count, " +
    "weak verb ratio, cliché detection, sentence rhythm (mean length, variance, monotony flag), " +
    "word repetition, Flesch-Kincaid reading level, and dialogue ratio. " +
    "Use when the user pastes a draft and asks for feedback, a roast, a critique, " +
    "or says 'rip this apart', 'tear this up', or 'how's my writing'.",
  input_schema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The draft text to analyze.",
      },
    },
    required: ["text"],
  },
  defaultRiskLevel: "low",
  execute: async (input: { text: string }, ctx) => {
    try {
      if (!input.text || input.text.trim().length < 20) {
        return {
          content:
            "That's too short to roast properly. Paste at least a few sentences. " +
            "The roast needs material to work with.",
          isError: true,
        };
      }

      const analysis = fullRoastAnalysis(input.text);

      // Build a summary the assistant can use as roast ammunition
      const flags: string[] = [];

      if (analysis.adverbs.density > 0.05) {
        flags.push(
          `Adverb density is ${(analysis.adverbs.density * 100).toFixed(1)}% (${analysis.adverbs.count} adverbs). That's above 5%, which is the threshold where it starts reading lazy.`,
        );
      }
      if (analysis.passiveVoice.count > 0) {
        flags.push(
          `${analysis.passiveVoice.count} passive voice instance${analysis.passiveVoice.count === 1 ? "" : "s"} detected. Passive voice kills momentum.`,
        );
      }
      if (analysis.weakVerbs.ratio > 0.15) {
        flags.push(
          `Weak verb ratio is ${(analysis.weakVerbs.ratio * 100).toFixed(1)}%. Too many is/was/were/have/get/make. Your verbs should do the heavy lifting.`,
        );
      }
      if (analysis.cliches.count > 0) {
        flags.push(
          `${analysis.cliches.count} cliché${analysis.cliches.count === 1 ? "" : "s"} found: ${analysis.cliches.found.join(", ")}. These are dead phrases. Bury them.`,
        );
      }
      if (analysis.sentenceRhythm.monotonous) {
        flags.push(
          `Sentence rhythm is monotonous (variance ratio ${analysis.sentenceRhythm.varianceRatio}). Mean length ${analysis.sentenceRhythm.meanLength} words. Mix it up: short punches between long flows.`,
        );
      }
      if (analysis.repetition.repeated.length > 0) {
        const top = analysis.repetition.repeated
          .slice(0, 3)
          .map((r) => `"${r.word}" (${r.count}x)`)
          .join(", ");
        flags.push(`Word repetition detected: ${top}. Your reader notices.`);
      }
      if (analysis.dialogueRatio < 5 && analysis.totalWords > 200) {
        flags.push(
          `Dialogue ratio is ${analysis.dialogueRatio}%. This is almost entirely narration. Is that intentional?`,
        );
      }

      const positiveNotes: string[] = [];
      if (analysis.adverbs.density < 0.03 && analysis.adverbs.count > 0) {
        positiveNotes.push("Adverb usage is lean. Good instinct.");
      }
      if (analysis.passiveVoice.count === 0) {
        positiveNotes.push("No passive voice detected. Active voice throughout.");
      }
      if (!analysis.sentenceRhythm.monotonous && analysis.sentenceRhythm.count > 3) {
        positiveNotes.push(
          `Sentence rhythm has good variance (ratio ${analysis.sentenceRhythm.varianceRatio}). You're mixing lengths naturally.`,
        );
      }
      if (analysis.cliches.count === 0) {
        positiveNotes.push("No clichés detected. Your language is fresh.");
      }

      return {
        content: {
          totalWords: analysis.totalWords,
          metrics: {
            adverbs: {
              count: analysis.adverbs.count,
              density: `${(analysis.adverbs.density * 100).toFixed(1)}%`,
              words: analysis.adverbs.adverbs,
            },
            passiveVoice: {
              count: analysis.passiveVoice.count,
              instances: analysis.passiveVoice.instances,
            },
            weakVerbs: {
              count: analysis.weakVerbs.count,
              ratio: `${(analysis.weakVerbs.ratio * 100).toFixed(1)}%`,
              verbs: analysis.weakVerbs.verbs,
            },
            cliches: {
              count: analysis.cliches.count,
              found: analysis.cliches.found,
            },
            sentenceRhythm: {
              count: analysis.sentenceRhythm.count,
              meanLength: analysis.sentenceRhythm.meanLength,
              stdDev: analysis.sentenceRhythm.stdDev,
              minLength: analysis.sentenceRhythm.minLength,
              maxLength: analysis.sentenceRhythm.maxLength,
              varianceRatio: analysis.sentenceRhythm.varianceRatio,
              monotonous: analysis.sentenceRhythm.monotonous,
            },
            repetition: analysis.repetition.repeated,
            readingLevel: {
              fleschKincaid: analysis.readingLevel.fleschKincaid,
              grade: analysis.readingLevel.grade,
              assessment: analysis.readingLevel.assessment,
            },
            dialogueRatio: `${analysis.dialogueRatio}%`,
          },
          flags,
          positiveNotes,
          message:
            flags.length === 0
              ? "Clean analysis. The numbers look good. Now the assistant should read it for craft, voice, and story."
              : `${flags.length} flag${flags.length === 1 ? "" : "s"} raised. The assistant should use these as roast ammunition.`,
        },
      };
    } catch (err) {
      return {
        content: `Analysis failed: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
    }
  },
};

export default tool;
