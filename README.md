# Writing Coach

A writing coach plugin for Vellum. Four skills, seven tools, zero excuses to skip your daily words.

## What it does

**Daily Prompt Forge** generates one writing prompt a day calibrated to your genre. Difficulty escalates with your streak. Drafts are saved to a gallery so you can watch your work accumulate over time.

**First Draft Roast** takes your draft and runs programmatic text analysis (adverb density, passive voice, sentence rhythm, cliché detection, weak verb ratio, word repetition, reading level), then delivers constructive-but-savage feedback with real numbers as ammunition. "This opening paragraph is 40% adverbs. We need to talk."

**Query Letter Doctor** checks your query letter against publishing industry standards: word count in the 250-450 range, hook present, comps cited and recent, bio relevant, agent personalized. Then gives you structural feedback on hook, story stakes, comps, and bio.

**Word Count Enforcer** tracks your writing sessions (word count + duration), maintains a streak, and sends guilt messages when you skip. "You didn't write yesterday. That's a choice. A bad one, but a choice."

## Surfaces

| Surface | Files |
|---------|-------|
| Tools   | `forge-prompt`, `save-draft`, `view-gallery`, `roast-analyze`, `analyze-query`, `log-session`, `session-stats` |
| Skills  | `daily-prompt-forge`, `first-draft-roast`, `query-letter-doctor`, `word-count-enforcer` |
| Hooks   | `init` (storage bootstrap) |
| Src     | `store`, `text-analysis`, `prompt-engine` |

## Install

```
assistant plugins install writing-coach
```

Then restart your assistant.

## How to use

You don't need to memorize tool names. Just talk to your assistant naturally and the right skill activates.

### Daily Prompt Forge

Ask for a prompt. That's it.

```
"Give me a writing prompt"
"I want to write something today"
"What's today's prompt?"
"Give me a sci-fi prompt"
```

The prompt escalates with your streak:
- **Tier 1 (Foundation)** — days 0-2. Concrete, sensory, low constraint.
- **Tier 2 (Constraint)** — days 3-6. Word limits, tense restrictions, structural rules.
- **Tier 3 (Structural)** — days 7-14. Form experiments, perspective shifts, subtext.
- **Tier 4 (Master)** — days 15+. Advanced craft, genre deconstruction, hard mode.

When you finish writing, paste your draft and say "save this." It goes to your gallery. Ask "show me my drafts" or "how much have I written?" to see your gallery.

### First Draft Roast

Paste a draft and ask for feedback.

```
"Roast this draft: [paste]"
"Rip this apart: [paste]"
"How's my writing here? [paste]"
"Give me honest feedback on this: [paste]"
```

You'll get a programmatic breakdown (adverb density, passive voice, weak verbs, clichés, sentence rhythm, word repetition, reading level) followed by a constructive-but-savage critique that uses the real numbers as ammunition. Every roast ends with one actionable challenge for your next revision.

The roast targets the prose, never the writer. And it never rewrites for you. It points, you fix. That's where the writing happens.

### Query Letter Doctor

Paste your query letter.

```
"Is my query letter ready? [paste]"
"Give me feedback on this query: [paste]"
"How's my query? [paste]"
```

You'll get a structural checklist (word count, hook, comps, bio, agent personalization, paragraph structure) followed by a publishing-industry-style critique on hook strength, story clarity, comps relevance, and bio credibility. Each issue comes with a specific fix direction.

### Word Count Enforcer

Report your sessions and check your stats.

```
"I wrote 500 words today"
"Just did a 30-minute session, 800 words"
"What's my writing streak?"
"How much have I written this week?"
"Set my daily target to 1000 words"
```

When you skip, you'll hear about it. The guilt is funny, not cruel, but it lands. One day missed gets a light ribbing. A week gets the full treatment. Every guilt message ends with an invitation to start again.

Milestones get acknowledged (7-day streak, 30-day streak, 10k words, 50k words) with a nod, not a parade.

### Genre setup

The first time you use Daily Prompt Forge, your assistant will ask what genre(s) you write. You can list multiple: literary fiction, memoir, sci-fi, fantasy, mystery, romance, horror, YA, poetry, creative nonfiction. Say "general" if you're not sure and the prompts will work across genres.

### Tips

- **Write first, roast later.** Don't analyze your draft while you're still writing it. Get it down, save it to the gallery, then roast it the next day with fresh eyes.
- **The gallery is your portfolio.** Every saved draft counts. After 30 drafts you'll have a body of work, not just a habit.
- **Streaks unlock harder prompts.** The difficulty escalation is designed to keep you growing. Tier 4 prompts are genuinely hard. That's the point.
- **Log sessions even without a prompt.** If you're working on a novel and wrote 1000 words, log it. The streak and stats track all writing, not just prompted drafts.

## No credentials needed

Everything runs locally. No external APIs, no keys, no OAuth. Your drafts and sessions live in `<workspace>/plugins-data/writing-coach/`.

## License

MIT
