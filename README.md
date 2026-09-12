# Bounty Autopilot

> Turn developer bounties into decisions, not endless scrolling.

Bounty Autopilot is an AI-assisted terminal tool for discovering Gibwork opportunities and ranking them by **skill fit, estimated effort, success probability, and expected value per hour**.

## Why it exists

Gibwork already provides a marketplace for paid work. Developers still have to manually scan tasks, judge whether they fit their skills, estimate the effort, and decide which opportunity is actually worth pursuing. Gibwork's developer workflow is built around finding a bounty, starting work, using a `gib-` branch, and submitting a pull request. Bounty Autopilot turns the discovery and decision stage into an agent-friendly terminal workflow.

## MVP

```text
Gibwork tasks
     ↓
Normalize opportunities
     ↓
Skill + effort analysis
     ↓
Expected-value scoring
     ↓
Rank the best opportunities
     ↓
Human chooses what to execute
```

### Example

```bash
npm install
npm run build
SOLANA_PRIVATE_KEY='...' node dist/cli.js hunt
```

Or during development:

```bash
npm run dev -- hunt --skills "TypeScript,MCP,GitHub,AI" --min-reward 25
```

The CLI produces a shortlist like:

```text
🔎 BOUNTY AUTOPILOT — GIBWORK HUNT

1. Build an MCP integration
   USDC 125.00 · 96% skill match · ~2h
   Expected value: USDC 73.50/hr · Risk: LOW
   matches: mcp, integration, github · meets minimum reward

2. Fix GitHub API bug
   USDC 75.00 · 92% skill match · ~1.25h
   Expected value: USDC 55.20/hr · Risk: LOW
```

## Design principles

- **Human approval first:** the MVP does not autonomously spend funds or submit work.
- **Wallet stays local:** credentials are supplied through the environment and are never accepted as a CLI argument.
- **Machine-readable:** `--json` makes the output usable by other agents and automation.
- **Gibwork-native:** the project uses the official Gibwork SDK rather than scraping the marketplace.
- **Outside the browser:** the primary interface is the terminal, with MCP planned as the next integration layer.

## Roadmap

- [x] Gibwork SDK task discovery
- [x] Skill-fit scoring
- [x] Effort estimation
- [x] Expected-value ranking
- [x] JSON output for agents
- [ ] `bounty analyze <id>` repository/task analysis
- [ ] GitHub workspace + `gib-` branch preparation
- [ ] Validation and proof-package generation
- [ ] Native MCP server
- [ ] Human-approved execution mode
- [ ] Telegram bounty radar

## Environment

Node.js 22+ is required.

```bash
SOLANA_PRIVATE_KEY=...
GIBWORK_ENVIRONMENT=stage
```

Use a dedicated development wallet while testing. Never commit a private key or place one in shell scripts.

## Hackathon

Built for the **Gibwork Developer Hackathon**: a new developer-focused use case for Gibwork using its SDK, with terminal-first and MCP-first workflows.

## License

MIT
