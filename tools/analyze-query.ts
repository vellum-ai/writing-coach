import type { ToolDefinition } from "@vellumai/plugin-api";
import { analyzeQueryLetter } from "../src/text-analysis";

const tool: ToolDefinition = {
  description:
    "Analyze a query letter against publishing industry standards. Checks word count " +
    "(250-450 ideal), hook presence, comp titles, bio paragraph, agent personalization, " +
    "and paragraph structure. Returns a structural checklist and list of issues. " +
    "Use when the user pastes a query letter, asks for query feedback, says 'is my query " +
    "ready', mentions querying agents, or asks about the publishing submission process.",
  input_schema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The query letter text to analyze.",
      },
    },
    required: ["text"],
  },
  defaultRiskLevel: "low",
  execute: async (input: { text: string }, ctx) => {
    try {
      if (!input.text || input.text.trim().length < 50) {
        return {
          content:
            "That's too short to be a query letter. A proper query is 250-450 words. " +
            "Paste the full letter for a real analysis.",
          isError: true,
        };
      }

      const analysis = analyzeQueryLetter(input.text);

      const checklist = [
        {
          item: "Word count in range (250-450)",
          status: analysis.inRange,
          detail: `${analysis.wordCount} words`,
        },
        {
          item: "Hook present in opening",
          status: analysis.hasHook,
          detail: analysis.hasHook
            ? "Opening has a hook structure"
            : "No hook detected in first 80 words",
        },
        {
          item: "Comp titles cited",
          status: analysis.hasComps,
          detail: analysis.hasComps
            ? `Found: ${analysis.compPhrases.join(", ")}`
            : "No comp phrases detected",
        },
        {
          item: "Bio paragraph present",
          status: analysis.hasBio,
          detail: analysis.hasBio
            ? "Bio paragraph detected"
            : "No bio paragraph detected",
        },
        {
          item: "Agent personalized",
          status: analysis.hasPersonalization,
          detail: analysis.hasPersonalization
            ? `Addressed to: ${analysis.agentName}`
            : "No agent name found (Dear Agent is a red flag)",
        },
        {
          item: "Paragraph structure (4-5 ideal)",
          status: analysis.paragraphCount >= 3,
          detail: `${analysis.paragraphCount} paragraph${analysis.paragraphCount === 1 ? "" : "s"}`,
        },
      ];

      const passedCount = checklist.filter((c) => c.status).length;

      return {
        content: {
          wordCount: analysis.wordCount,
          inRange: analysis.inRange,
          agentName: analysis.agentName,
          compPhrases: analysis.compPhrases,
          paragraphCount: analysis.paragraphCount,
          checklist,
          issues: analysis.issues,
          passedChecks: passedCount,
          totalChecks: checklist.length,
          message:
            `${passedCount}/${checklist.length} checks passed. ` +
            (analysis.issues.length === 0
              ? "Structurally solid. The assistant should now read for voice, hook strength, and story clarity."
              : `${analysis.issues.length} issue${analysis.issues.length === 1 ? "" : "s"} to address. The assistant should walk through each one with specific fix suggestions.`),
        },
      };
    } catch (err) {
      return {
        content: `Query analysis failed: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
    }
  },
};

export default tool;
