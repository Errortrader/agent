# OpenRouter Agent TUI

## Website preview

This repository also includes a standalone Craft Cake Benapole bakery website.
Open `index.html` directly in a browser to preview it, or serve the repository
with any static file server.

A runnable TypeScript terminal agent for exploring and editing a repository with
[`@openrouter/agent`](https://www.npmjs.com/package/@openrouter/agent). It streams
model output as it arrives, displays tool activity, and persists each
conversation as JSONL under `.sessions/`.

## Setup

1. Install Node.js 20 or newer.
2. Install dependencies:

   ```sh
   npm install
   ```

3. Copy `.env.example` to `.env` and add an OpenRouter key:

   ```sh
   cp .env.example .env
   ```

   On PowerShell, use `Copy-Item .env.example .env`.

   The CLI reads `OPENROUTER_API_KEY` from the environment. Never commit `.env`
   or put a key in source code.

## Run

```sh
npm start
```

The default model is `anthropic/claude-haiku-4.5`. Override it at launch:

```sh
npm start -- --model openai/gpt-4o-mini --input bordered --tool-display emoji
```

Available input styles are `block`, `bordered`, and `plain`. Tool display
styles are `grouped`, `emoji`, `minimal`, and `hidden`. Type `/help` in the
agent for commands such as `/model` and `/new`; type `exit` to quit.

## Agent capabilities

The default tool registry includes local file read/write/edit, glob and regex
search, directory listing, cross-platform shell execution, OpenRouter web
search, and UTC datetime. The agent is instructed to verify repository state
before making targeted edits. Model calls retry transient 429 and 5xx errors,
and each turn is bounded by configurable step and cost limits.

## Validate

```sh
npm run typecheck
```

Configuration can also be supplied with `agent.config.json` (see
`src/config.ts` for the supported fields); environment variables take
precedence for the API key, model, step limit, and cost limit.
