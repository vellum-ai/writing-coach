# Inkwell

A writing coach plugin for Vellum. Four skills, seven tools, zero excuses to skip your daily words.

## What it does

**Daily Prompt Forge** generates one writing prompt a day calibrated to your genre. Difficulty escalates with your streak. Drafts are saved to a gallery so you can watch your work accumulate over time.

**First Draft Roast** takes your draft and runs programmatic text analysis (adverb density, passive voice, sentence rhythm, cliché detection, weak verb ratio, word repetition, reading level), then delivers constructive-but-savage feedback with real numbers as ammunition. "This opening paragraph is 40% adverbs. We need to talk."

**Query Letter Doctor** checks your query letter against publishing industry standards: word count in the 250-450 range, hook present, comps cited and recent, bio relevant, agent personalized. Then gives you structural feedback on hook, story stakes, comps, and bio.

**Word Count Enforcer** tracks your writing sessions (word count + duration), maintains a streak, and sends guilt messages with Balkan-mom energy when you skip. "You didn't write yesterday. That's a choice. A bad one, but a choice."

## Surfaces

| Surface | Files |
|---------|-------|
| Tools   | `forge-prompt`, `save-draft`, `view-gallery`, `roast-analyze`, `analyze-query`, `log-session`, `session-stats` |
| Skills  | `daily-prompt-forge`, `first-draft-roast`, `query-letter-doctor`, `word-count-enforcer` |
| Hooks   | `init` (storage bootstrap) |
| Src     | `store`, `text-analysis`, `prompt-engine` |

## Install

```
assistant plugins install inkwell
```

Then restart your assistant.

## No credentials needed

Everything runs locally. No external APIs, no keys, no OAuth. Your drafts and sessions live in `<workspace>/plugins-data/inkwell/`.

## License

MIT
