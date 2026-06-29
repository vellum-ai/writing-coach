/**
 * Programmatic text analysis for the First Draft Roast and Query Letter Doctor.
 * These functions give the roast real teeth: adverb density, passive voice,
 * sentence rhythm, weak verbs, clichés, word repetition, and reading level.
 *
 * No LLM needed here. The numbers speak for themselves.
 */

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "was", "are", "were", "be", "been",
  "being", "am", "it", "its", "this", "that", "these", "those", "i",
  "you", "he", "she", "we", "they", "him", "her", "us", "them", "my",
  "your", "his", "their", "our", "as", "if", "then", "than", "so",
  "not", "no", "yes", "do", "does", "did", "had", "has", "have", "will",
  "would", "could", "should", "can", "may", "might", "must", "shall",
  "about", "into", "through", "during", "before", "after", "above",
  "below", "up", "down", "out", "off", "over", "under", "again",
  "further", "here", "there", "when", "where", "why", "how", "all",
  "each", "few", "more", "most", "other", "some", "such", "only",
  "own", "same", "too", "very", "just", "also", "now",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z']+/)
    .filter((w) => w.length > 0);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ---------------------------------------------------------------------------
// Adverb density
// ---------------------------------------------------------------------------

const ADVERB_FALSE_POSITIVES = new Set([
  "family", "reply", "apply", "supply", "comply", "only", "early",
  "july", "monopoly", "anomaly", "Italy", "jelly", "belly", "silly",
  "holly", "lily", "tally", "alley", "valley", "rally", "bully",
  "fully", "duly", "truly", "ugly", "pally", "lowly", "godly",
  "monthly", "daily", "weekly", "hourly", "quarterly", "yearly",
]);

export interface AdverbResult {
  count: number;
  density: number; // fraction of total words
  adverbs: string[];
}

export function analyzeAdverbs(text: string): AdverbResult {
  const words = tokenize(text);
  const total = words.length || 1;
  const adverbs = words.filter(
    (w) =>
      w.endsWith("ly") &&
      w.length > 3 &&
      !ADVERB_FALSE_POSITIVES.has(w),
  );
  return {
    count: adverbs.length,
    density: adverbs.length / total,
    adverbs: dedupe(adverbs).slice(0, 15),
  };
}

// ---------------------------------------------------------------------------
// Passive voice detection
// ---------------------------------------------------------------------------

const BE_VERBS = new Set([
  "is", "was", "were", "are", "am", "been", "being", "be",
]);

const COMMON_PARTICIPLES = new Set([
  "written", "done", "made", "taken", "given", "seen", "known",
  "shown", "told", "said", "held", "kept", "left", "built", "sent",
  "spent", "brought", "bought", "caught", "taught", "fought",
  "thought", "sought", "worn", "born", "torn", "sworn", "drawn",
  "blown", "grown", "thrown", "flown", "led", "paid", "laid",
  "read", "put", "set", "cut", "hit", "hurt", "shut", "let",
  "spread", "fed", "fled", "bred", "wed", "bound", "found",
  "ground", "wound", "lost", "sold", "told", "mold",
]);

export interface PassiveResult {
  count: number;
  instances: string[];
}

export function analyzePassiveVoice(text: string): PassiveResult {
  const sentences = splitSentences(text);
  const instances: string[] = [];

  for (const sentence of sentences) {
    const words = tokenize(sentence);
    for (let i = 0; i < words.length - 1; i++) {
      if (BE_VERBS.has(words[i])) {
        const next = words[i + 1];
        if (
          next.endsWith("ed") &&
          next.length > 3 &&
          !STOP_WORDS.has(next)
        ) {
          instances.push(sentence);
          break;
        }
        if (COMMON_PARTICIPLES.has(next)) {
          instances.push(sentence);
          break;
        }
      }
    }
  }

  return {
    count: instances.length,
    instances: instances.slice(0, 8),
  };
}

// ---------------------------------------------------------------------------
// Weak verb ratio
// ---------------------------------------------------------------------------

const WEAK_VERBS = new Set([
  "is", "was", "were", "are", "am", "been", "being", "be",
  "have", "had", "has", "get", "got", "gotten", "make", "made",
  "go", "went", "gone", "do", "did", "done", "say", "said",
  "think", "thought", "feel", "felt", "look", "looked", "seem",
  "seemed", "appear", "appeared",
]);

export interface WeakVerbResult {
  count: number;
  ratio: number;
  verbs: string[];
}

export function analyzeWeakVerbs(text: string): WeakVerbResult {
  const words = tokenize(text);
  const total = words.length || 1;
  const weak = words.filter((w) => WEAK_VERBS.has(w));
  return {
    count: weak.length,
    ratio: weak.length / total,
    verbs: dedupe(weak).slice(0, 12),
  };
}

// ---------------------------------------------------------------------------
// Cliché detection
// ---------------------------------------------------------------------------

const CLICHES = [
  "at the end of the day", "needless to say", "each and every",
  "first and foremost", "when all is said and done", "few and far between",
  "in this day and age", "light at the end of the tunnel",
  "avoid like the plague", "calm before the storm", "ashes to ashes",
  "blind as a bat", "busy as a bee", "clear as crystal",
  "cold as ice", "dead as a doornail", "fit as a fiddle",
  "gentle as a lamb", "hard as nails", "light as a feather",
  "old as time", "quiet as a mouse", "sharp as a tack",
  "slow as molasses", "strong as an ox", "white as snow",
  "time will tell", "time flies", "time heals all wounds",
  "all that glitters is not gold", "every cloud has a silver lining",
  "rome wasn't built in a day", "the grass is always greener",
  "what goes around comes around", "actions speak louder than words",
  "better late than never", "the early bird catches the worm",
  "you can't judge a book by its cover", "a penny for your thoughts",
  "bite the bullet", "break a leg", "break the ice",
  "burn the midnight oil", "call it a day", "cut corners",
  "cut to the chase", "get out of hand", "get your act together",
  "give it your all", "go the extra mile", "hang in there",
  "hit the nail on the head", "hit the sack", "it's not rocket science",
  "let sleeping dogs lie", "miss the boat", "on thin ice",
  "once in a blue moon", "play devil's advocate", "pull someone's leg",
  "ring a bell", "the whole nine yards", "under the weather",
  "up in the air", "when pigs fly", "you can say that again",
  "a diamond in the rough", "adding insult to injury",
  "as old as the hills", "barking up the wrong tree",
  "beat around the bush", "blessing in disguise",
  "bull in a china shop", "by the skin of your teeth",
  "catch a cold", "caught red-handed", "chase a wild goose chase",
  "close but no cigar", "cry over spilled milk",
  "drop in the bucket", "easier said than done",
  "elephant in the room", "every rose has its thorn",
  "fair and square", "fishing for compliments",
  "flash in the pan", "fly by the seat of your pants",
  "give the benefit of the doubt", "happy as a clam",
  "head over heels", "hear a pin drop", "hold your horses",
  "in the nick of time", "it takes two to tango",
  "jump the gun", "kick the bucket", "kill two birds with one stone",
  "let the cat out of the bag", "long story short",
  "needle in a haystack", "no pain no gain",
  "on the same page", "out of this world",
  "practice makes perfect", "read between the lines",
  "right as rain", "sick as a dog", "sleep like a baby",
  "spill the beans", "steal someone's thunder",
  "take a rain check", "take it with a grain of salt",
  "the ball is in your court", "the best of both worlds",
  "the devil is in the details", "throw caution to the wind",
  "to get bent out of shape", "to make matters worse",
  "touch a raw nerve", "turn a blind eye",
  "water under the bridge", "wear your heart on your sleeve",
  "when the going gets tough", "worst of both worlds",
];

export interface ClicheResult {
  count: number;
  found: string[];
}

export function analyzeCliches(text: string): ClicheResult {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const cliche of CLICHES) {
    if (lower.includes(cliche)) {
      found.push(cliche);
    }
  }
  return {
    count: found.length,
    found,
  };
}

// ---------------------------------------------------------------------------
// Sentence rhythm analysis
// ---------------------------------------------------------------------------

export interface SentenceRhythmResult {
  count: number;
  meanLength: number;
  stdDev: number;
  minLength: number;
  maxLength: number;
  varianceRatio: number; // stdDev / mean, higher = more varied
  monotonous: boolean;
}

export function analyzeSentenceRhythm(text: string): SentenceRhythmResult {
  const sentences = splitSentences(text);
  const lengths = sentences.map((s) => tokenize(s).length);
  const count = lengths.length;

  if (count === 0) {
    return {
      count: 0,
      meanLength: 0,
      stdDev: 0,
      minLength: 0,
      maxLength: 0,
      varianceRatio: 0,
      monotonous: true,
    };
  }

  const mean = lengths.reduce((a, b) => a + b, 0) / count;
  const variance =
    lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / count;
  const stdDev = Math.sqrt(variance);
  const varianceRatio = mean > 0 ? stdDev / mean : 0;

  return {
    count,
    meanLength: Math.round(mean * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    varianceRatio: Math.round(varianceRatio * 100) / 100,
    monotonous: varianceRatio < 0.3,
  };
}

// ---------------------------------------------------------------------------
// Word repetition
// ---------------------------------------------------------------------------

export interface RepetitionResult {
  repeated: { word: string; count: number }[];
}

export function analyzeRepetition(text: string): RepetitionResult {
  const words = tokenize(text).filter((w) => !STOP_WORDS.has(w));
  const counts = new Map<string, number>();
  for (const w of words) {
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const repeated: { word: string; count: number }[] = [];
  for (const [word, count] of counts) {
    if (count >= 3) {
      repeated.push({ word, count });
    }
  }
  repeated.sort((a, b) => b.count - a.count);
  return { repeated: repeated.slice(0, 10) };
}

// ---------------------------------------------------------------------------
// Reading level (Flesch-Kincaid)
// ---------------------------------------------------------------------------

function countSyllables(word: string): number {
  const lower = word.toLowerCase();
  if (lower.length <= 3) return 1;
  const stripped = lower.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/i, "");
  const groups = stripped.match(/[aeiouy]{1,2}/gi);
  return groups ? groups.length : 1;
}

export interface ReadingLevelResult {
  fleschKincaid: number;
  grade: string;
  assessment: string;
}

export function analyzeReadingLevel(text: string): ReadingLevelResult {
  const sentences = splitSentences(text);
  const words = tokenize(text);
  const sentenceCount = sentences.length || 1;
  const wordCount = words.length || 1;
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const asl = wordCount / sentenceCount;
  const asw = syllableCount / wordCount;
  const fk = 0.39 * asl + 11.8 * asw - 15.59;

  const grade = fk < 5
    ? "elementary"
    : fk < 8
      ? "middle school"
      : fk < 12
        ? "high school"
        : fk < 16
          ? "college"
          : "graduate";

  const assessment = fk < 5
    ? "very accessible, maybe too simple for literary fiction"
    : fk < 8
      ? "accessible, good for YA or commercial fiction"
      : fk < 12
        ? "solid range for most fiction and memoir"
        : fk < 16
          ? "dense, watch for academic register"
          : "very dense, your reader is working hard";

  return {
    fleschKincaid: Math.round(fk * 10) / 10,
    grade,
    assessment,
  };
}

// ---------------------------------------------------------------------------
// Dialogue ratio
// ---------------------------------------------------------------------------

export function analyzeDialogueRatio(text: string): number {
  const total = text.length || 1;
  const inQuotes = (text.match(/[""][^""]*[""]/g) ?? []).join("").length;
  return Math.round((inQuotes / total) * 100);
}

// ---------------------------------------------------------------------------
// Aggregate roast analysis
// ---------------------------------------------------------------------------

export interface RoastAnalysis {
  totalWords: number;
  adverbs: AdverbResult;
  passiveVoice: PassiveResult;
  weakVerbs: WeakVerbResult;
  cliches: ClicheResult;
  sentenceRhythm: SentenceRhythmResult;
  repetition: RepetitionResult;
  readingLevel: ReadingLevelResult;
  dialogueRatio: number;
}

export function fullRoastAnalysis(text: string): RoastAnalysis {
  return {
    totalWords: tokenize(text).length,
    adverbs: analyzeAdverbs(text),
    passiveVoice: analyzePassiveVoice(text),
    weakVerbs: analyzeWeakVerbs(text),
    cliches: analyzeCliches(text),
    sentenceRhythm: analyzeSentenceRhythm(text),
    repetition: analyzeRepetition(text),
    readingLevel: analyzeReadingLevel(text),
    dialogueRatio: analyzeDialogueRatio(text),
  };
}

// ---------------------------------------------------------------------------
// Query letter analysis
// ---------------------------------------------------------------------------

export interface QueryAnalysis {
  wordCount: number;
  inRange: boolean;
  hasHook: boolean;
  hasComps: boolean;
  compPhrases: string[];
  hasBio: boolean;
  hasPersonalization: boolean;
  agentName: string | null;
  paragraphCount: number;
  issues: string[];
}

const COMP_PATTERNS = [
  /(?:fans of|for readers of|in the vein of|reminiscent of|fans of)\s+([A-Z][^,.]{2,40})/gi,
  /(?:will appeal to|appeals to|compares? to|comp:)\s+([A-Z][^,.]{2,40})/gi,
  /(?:like|along the lines of)\s+([A-Z][^,.]{2,40})/gi,
];

const BIO_PATTERNS = [
  /\b(?:my|I am|I'm|I've)\b.*\b(?:live|lives? in|based in|reside)/i,
  /\b(?:my|I am|I'm|I've)\b.*\b(?:writing|written|published|author|blog)/i,
  /\b(?:my|I am|I'm|I've)\b.*\b(?:award|MFA|degree|studied|education)/i,
  /\b(?:my|I am|I'm|I've)\b.*\b(?:work|career|profession|previously)/i,
];

const AGENT_PATTERNS = [
  /Dear\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
  /Dear\s+(Mr\.|Ms\.|Mrs\.)\s+([A-Z][a-z]+)/,
];

export function analyzeQueryLetter(text: string): QueryAnalysis {
  const words = tokenize(text);
  const wordCount = words.length;
  const inRange = wordCount >= 250 && wordCount <= 450;

  const lower = text.toLowerCase();

  // Hook detection: first 80 words should have something intriguing
  const firstChunk = words.slice(0, 80).join(" ");
  const hasHook = /\b(?:when|after|before|until|every|if|until|someone|nobody|nothing|the last|the day)\b/i.test(firstChunk);

  // Comps detection
  const compPhrases: string[] = [];
  for (const pattern of COMP_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) compPhrases.push(match[1].trim());
    }
  }
  const hasComps = compPhrases.length > 0;

  // Bio detection
  const hasBio = BIO_PATTERNS.some((p) => p.test(text));

  // Personalization (agent name)
  let agentName: string | null = null;
  for (const pattern of AGENT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      agentName = match[2] ?? match[1] ?? null;
      break;
    }
  }
  const hasPersonalization = agentName !== null;

  // Paragraph count (double newlines)
  const paragraphCount = text
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length;

  // Build issues list
  const issues: string[] = [];
  if (wordCount < 250) {
    issues.push(`Query is ${wordCount} words. Industry standard is 250-450. You're underselling.`);
  }
  if (wordCount > 450) {
    issues.push(`Query is ${wordCount} words. Industry standard is 250-450. Agents skim. Cut it down.`);
  }
  if (!hasHook) {
    issues.push("No clear hook detected in your opening. The first 1-2 sentences need to make the agent lean in.");
  }
  if (!hasComps) {
    issues.push("No comps (comparable titles) detected. Agents want to know where your book sits on the shelf. Cite 1-2 recent titles (published in the last 2-3 years).");
  }
  if (!hasBio) {
    issues.push("No bio paragraph detected. Even a brief relevant bio builds credibility. If you have no writing credentials, keep it to one line about why you're the person to tell this story.");
  }
  if (!hasPersonalization) {
    issues.push("No agent name detected. 'Dear Agent' is a red flag. Address them by name and mention why you're querying them specifically.");
  }
  if (paragraphCount < 3) {
    issues.push(`Only ${paragraphCount} paragraph${paragraphCount === 1 ? "" : "s"}. A typical query has 4-5: hook, story, stakes, comps, bio, sign-off.`);
  }

  return {
    wordCount,
    inRange,
    hasHook,
    hasComps,
    compPhrases: dedupe(compPhrases),
    hasBio,
    hasPersonalization,
    agentName,
    paragraphCount,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)];
}
