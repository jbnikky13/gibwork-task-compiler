# Gibwork Task Compiler

> Turn vague GitHub work into precise, testable, economically scoped Gibwork tasks.

Gibwork Task Compiler is a terminal-first AI developer tool that transforms an issue, request, or repository change into a structured **Task Contract** ready for Gibwork.

Instead of asking a worker to interpret a vague request, the compiler produces:

- a clear objective
- explicit requirements
- testable acceptance criteria
- likely files and implementation areas
- a validation/test plan
- constraints and exclusions
- estimated effort
- recommended reward range
- ambiguity and readiness scores

The goal is simple: **make work easier to understand before it becomes a paid task.**

## Why it exists

Gibwork is an onchain work marketplace for getting real tasks completed. The marketplace already supports development work such as bug fixes, API integrations, unit tests, research, content, design, and other paid requests. citeturn0search0

The missing layer is task preparation: turning an informal request into a specification that a worker—or an AI agent—can execute and verify without repeated clarification.

Gibwork Task Compiler is designed to fill that gap from outside the browser, using Gibwork's developer tooling as the execution layer.

## Core workflow

```text
GitHub issue / rough request
          ↓
   Repository context
          ↓
   Task Compiler
          ↓
 ┌────────┼─────────┐
 ▼        ▼         ▼
Scope   Tests    Economics
 └────────┼─────────┘
          ↓
     Task Contract
          ↓
   Validate / simulate
          ↓
      Human review
          ↓
     Gibwork task
```

## Example

```bash
npm install
npm run build
npm start -- compile --request "Fix the OAuth callback bug in this repository"
```

The compiler is intended to produce a result like:

```text
🧩 GIBWORK TASK COMPILER

OBJECTIVE
Fix the OAuth callback failure and preserve existing session behavior.

REQUIREMENTS
✓ Reproduce the callback failure
✓ Correct callback state handling
✓ Preserve existing session creation
✓ Add regression coverage

ACCEPTANCE CRITERIA
✓ OAuth callback succeeds with a valid state
✓ Invalid state is rejected
✓ Existing auth tests remain green
✓ New regression test passes

ESTIMATED EFFORT
1.5–2.5 hours

RECOMMENDED REWARD
USDC 60–100

AMBIGUITY
LOW

READINESS
READY TO REVIEW
```

## Design principles

- **Human approval first:** compiling a task does not publish or fund anything automatically.
- **Testable work:** every important requirement should have observable acceptance evidence.
- **Repository-aware:** when repository context is available, the compiler uses it to make the task concrete.
- **Economic realism:** effort and reward are estimated together instead of treating the bounty amount in isolation.
- **Machine-readable:** Task Contracts are structured for CLI automation and future MCP clients.
- **Gibwork-native:** the project uses the official Gibwork SDK instead of scraping the marketplace.
- **Outside the browser:** the primary interface is the terminal, with MCP planned as a first-class integration.

## Roadmap

- [x] Repository renamed and project direction established
- [x] Gibwork SDK foundation
- [ ] `gibwork compile` request → Task Contract
- [ ] GitHub issue/repository context ingestion
- [ ] Requirement and acceptance-criteria extraction
- [ ] Task ambiguity/readiness scoring
- [ ] Effort and reward simulation
- [ ] `gibwork validate-task` contract validation
- [ ] `gibwork simulate` worker execution forecast
- [ ] Human-approved Gibwork publishing
- [ ] Native MCP server
- [ ] Example end-to-end Gibwork task

## Environment

Node.js 22+ is required.

```bash
SOLANA_PRIVATE_KEY=...
GIBWORK_ENVIRONMENT=stage
```

Use a dedicated development wallet while testing. Never commit a private key or place one in shell scripts.

## Hackathon

Built for the **Gibwork Developer Hackathon**: a developer-tool use case that turns unstructured work requests into precise, testable Gibwork tasks using the SDK, with terminal-first and MCP-first workflows.

## License

MIT
