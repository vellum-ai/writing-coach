/**
 * The Prompt Forge engine.
 *
 * Difficulty escalates with streak. Four tiers, each adding craft constraints.
 * The tool returns a seed (theme + constraints + craft focus), and the skill
 * instructs the assistant to elaborate it into a full rich prompt calibrated
 * to the user's genre.
 *
 * Tier 1 (streak 0-2):   Concrete, sensory, low constraint.
 * Tier 2 (streak 3-6):   Add structural constraints, word limits.
 * Tier 3 (streak 7-14):  Form experiments, perspective shifts, subtext.
 * Tier 4 (streak 15+):   Advanced craft, genre deconstruction, hard mode.
 */

export interface PromptSeed {
  promptId: string;
  tier: number;
  tierName: string;
  genre: string;
  theme: string;
  constraints: string[];
  craftFocus: string;
  estimatedMinutes: number;
}

interface TierConfig {
  name: string;
  constraints: string[];
  craftFocuses: string[];
  themes: string[];
  estimatedMinutes: number;
}

const TIER_CONFIGS: Record<number, TierConfig> = {
  1: {
    name: "Foundation",
    constraints: ["No word limit. Write freely.", "Focus on sensory detail."],
    craftFocuses: [
      "specificity over abstraction",
      "sensory immersion",
      "concrete nouns",
      "active verbs",
      "showing not telling",
    ],
    themes: [
      "a room from your childhood, described through smell alone",
      "a stranger on public transit, observed for three stops",
      "the moment right before something important happens",
      "two people eating together in silence",
      "a weather event as if it were a character",
      "a mundane object that holds a secret",
      "the last conversation you had with someone you never saw again",
      "a place that no longer exists",
      "something found in a jacket pocket",
      "the sound your home makes at 3am",
    ],
    estimatedMinutes: 10,
  },
  2: {
    name: "Constraint",
    constraints: [
      "300 words max.",
      "No dialogue. Pure narration.",
      "Write in present tense.",
      "One paragraph, no line breaks.",
      "Start with the word 'The'. End with the word 'gone.'",
    ],
    craftFocuses: [
      "sentence rhythm and pacing",
      "tight prose, cut the fat",
      "implied emotion",
      "setting as mood",
      "voice consistency",
    ],
    themes: [
      "a confession delivered too late",
      "an inheritance that ruins a family",
      "a lie told so well it becomes true",
      "a goodbye that neither person acknowledges",
      "a small betrayal disguised as kindness",
      "a door that should have stayed locked",
      "a meal that changes a relationship",
      "an object returned after many years",
      "a promise kept for the wrong reasons",
      "a routine disrupted by one missing element",
    ],
    estimatedMinutes: 20,
  },
  3: {
    name: "Structural",
    constraints: [
      "Write in reverse chronological order. Each paragraph moves backward.",
      "Use second person ('you'). No first person.",
      "Two perspectives, alternating sentences. No dialogue tags.",
      "Tell the story through objects only. No interiority.",
      "Begin at the ending. The whole piece is aftermath.",
    ],
    craftFocuses: [
      "subtext and implication",
      "narrative structure and form",
      "unreliable narration",
      "time and memory",
      "tension through restraint",
    ],
    themes: [
      "a funeral where no one says what they actually mean",
      "a map drawn from memory, inaccurate in telling ways",
      "a confrontation that happens entirely in subtext",
      "a transformation witnessed by someone who doesn't understand it",
      "a decision made years ago, examined from the other side",
      "an apology that isn't accepted, delivered anyway",
      "a reunion where only one person has changed",
      "a secret kept so long it has become irrelevant",
      "a theft no one reports because everyone benefited",
      "a boundary crossed so quietly no one noticed",
    ],
    estimatedMinutes: 30,
  },
  4: {
    name: "Master",
    constraints: [
      "Write a scene where the subtext completely contradicts the dialogue. The reader should feel the gap without anyone naming it. 500 words.",
      "Begin with a sentence that is objectively true but emotionally false. Build the whole piece on that tension.",
      "Write the same scene twice. Once in the voice of each character. Neither should be the 'real' version.",
      "No adjectives. No adverbs. Nouns and verbs only. 400 words. Make it sing.",
      "Write a scene where nothing happens but everything changes. The shift is internal and unspoken.",
    ],
    craftFocuses: [
      "voice and register control",
      "genre deconstruction",
      "thematic density",
      "control vs. chaos",
      "the unsaid as primary instrument",
    ],
    themes: [
      "a conversation between two people who know they're being watched",
      "a moment of moral compromise, described without judgment",
      "a character who gets exactly what they wanted, and it's worse",
      "an ending that reframes everything that came before it",
      "a scene written in the style of a genre you've never attempted",
      "a life decision made in the span of one breath",
      "a power dynamic that shifts without anyone acknowledging it",
      "a love scene that is about power, not love",
      "a death scene that is about life, not death",
      "a scene where the setting is the antagonist",
    ],
    estimatedMinutes: 45,
  },
};

export function getTierForStreak(streak: number): number {
  if (streak >= 15) return 4;
  if (streak >= 7) return 3;
  if (streak >= 3) return 2;
  return 1;
}

export function getTierName(tier: number): string {
  return TIER_CONFIGS[tier]?.name ?? "Foundation";
}

/**
 * Pick a deterministic prompt seed for today.
 * Uses the date + genre as a seed so the user gets the same prompt
 * throughout the day.
 */
export function forgePrompt(
  streak: number,
  genre: string,
  dateStr: string,
): PromptSeed {
  const tier = getTierForStreak(streak);
  const config = TIER_CONFIGS[tier];

  // Deterministic selection based on date string
  const seedNum = hashString(dateStr + genre);
  const themeIdx = seedNum % config.themes.length;
  const constraintIdx = seedNum % config.constraints.length;
  const craftIdx = (seedNum >> 2) % config.craftFocuses.length;

  const theme = config.themes[themeIdx];
  const constraint = config.constraints[constraintIdx];
  const craftFocus = config.craftFocuses[craftIdx];

  return {
    promptId: `prompt_${dateStr}_${tier}`,
    tier,
    tierName: config.name,
    genre: genre || "general",
    theme,
    constraints: [constraint],
    craftFocus,
    estimatedMinutes: config.estimatedMinutes,
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Get all tier info for display purposes.
 */
export function getTierInfo(tier: number): {
  name: string;
  constraints: string[];
  craftFocuses: string[];
  estimatedMinutes: number;
} {
  const config = TIER_CONFIGS[tier];
  if (!config) return TIER_CONFIGS[1];
  return {
    name: config.name,
    constraints: config.constraints,
    craftFocuses: config.craftFocuses,
    estimatedMinutes: config.estimatedMinutes,
  };
}
