# Gibwork Task Compiler

> Turn vague GitHub work into precise, testable, economically scoped Gibwork tasks.

Gibwork Task Compiler is a terminal-first developer tool and **MCP server** that transforms an issue, request, or repository change into a structured **Task Contract** ready for Gibwork.

Instead of asking a worker or AI agent to interpret a vague request, the compiler produces:

- a clear objective
- explicit requirements
- testable acceptance criteria
- repository and code evidence
- likely files and implementation areas
- a validation/test plan
- constraints and exclusions
- estimated effort
- recommended reward range
- ambiguity, confidence, and readiness scores

The goal is simple: **make work easier to understand before it becomes a paid task.**

## Why it exists

Gibwork provides the work marketplace and developer infrastructure. The missing layer is task preparation: turning an informal request into a specification that a worker—or an AI agent—can execute and verify without repeated clarification.

Gibwork Task Compiler fills that gap from outside the browser. It can inspect public GitHub repositories, simulate execution, validate the resulting contract, preview the exact task payload, and publish only after explicit confirmation.

## Why this is different

This is not another bounty marketplace, bounty finder, or generic AI task generator.

The compiler acts as a **quality gate before work becomes a paid Gibwork task**. It combines repository evidence, deterministic validation, economic estimation, and optional AI reasoning while keeping publication behind an explicit human confirmation boundary.

## Core workflow

```text
GitHub issue / rough request
          ↓
   Repository inspection
          ↓
      COMPILE
          ↓
     Task Contract
          ↓
     SIMULATE
          ↓
   AI REASONING (optional)
          ↓
      VALIDATE
          ↓
      PREVIEW
          ↓
   Human confirmation
          ↓
      GIBWORK
```

## CLI

```bash
npm install
npm run build
```

Compile a request:

```bash
gibwork compile \
  --request "Fix the OAuth callback bug" \
  --reference https://github.com/owner/project/issues/42
```

Simulate against the real repository:

```bash
gibwork simulate \
  --contract task.json \
  --reference https://github.com/owner/project/issues/42 \
  --output simulation.json
```

Validate the contract:

```bash
gibwork validate \
  --contract task.json \
  --simulation simulation.json
```

Preview the exact Gibwork task without publishing:

```bash
gibwork preview --contract task.json
```

Publish only after explicit confirmation:

```bash
gibwork publish --contract task.json --confirm
```

Publishing requires `SOLANA_PRIVATE_KEY` and never accepts a private key as a command-line argument.

## One-command judge demo

Run the safe end-to-end demonstration locally:

```bash
npm run demo
```

The demo exercises compilation, GitHub inspection, simulation, validation, and publishing preview. It **does not create or fund a live Gibwork task**.

## MCP server

The same workflow is available to MCP-compatible AI clients such as coding agents.

Start the server:

```bash
npm run mcp
```

Available tools:

- `compile_task` — request → Task Contract
- `inspect_repository` — GitHub repository/issue → source and test evidence
- `simulate_task` — contract → execution forecast
- `reason_task` — contract + repository evidence → deeper implementation reasoning
- `validate_task` — contract + evidence → readiness decision
- `preview_gibwork_task` — contract → exact publish payload
- `publish_gibwork_task` — publish a READY contract, only when `confirmation=true`

The publish tool is intentionally separated from the analysis tools and requires explicit confirmation. This prevents an AI agent from accidentally creating a paid task while still allowing the rest of the workflow to be autonomous.

## Example result

```text
🧪 GIBWORK TASK SIMULATION

REPOSITORY
owner/project · TypeScript · 420 stars · 7 open issues

EXECUTION PLAN
1. Reproduce the reported OAuth callback failure
2. Inspect callback and session handling
3. Implement the smallest compatible fix
4. Add regression coverage
5. Run the relevant test suite

LIKELY FILES
• src/auth/callback.ts
• src/auth/session.ts

LIKELY TESTS
• tests/auth/callback.test.ts

CODE EVIDENCE
• src/auth/callback.ts: authentication/session logic detected
• src/auth/callback.ts: explicit error handling detected
• tests/auth/callback.test.ts: assertion-based test coverage detected

EFFORT
1.5–2.5 hours (likely 2h)

RECOMMENDED REWARD
USDC 60–100 (recommended 80)

CONFIDENCE
91%

RECOMMENDATION
PUBLISH
```

## Design principles

- **Human approval first:** compiling, simulating, reasoning, and validating never publish automatically.
- **Testable work:** important requirements need observable acceptance evidence.
- **Repository-aware:** real source and test content is used when repository context is available.
- **Economic realism:** effort and reward are estimated together.
- **Machine-readable:** Task Contracts are structured for CLI automation and MCP clients.
- **Gibwork-native:** the project uses the Gibwork SDK rather than scraping the marketplace.
- **Outside the browser:** terminal and MCP are first-class interfaces.
- **Safe mutation boundary:** publication is isolated behind explicit confirmation.

## Roadmap

- [x] Repository renamed and project direction established
- [x] Gibwork SDK foundation
- [x] `gibwork compile` request → Task Contract
- [x] GitHub issue/repository context ingestion
- [x] Requirement and acceptance-criteria extraction
- [x] Task ambiguity/readiness scoring
- [x] Effort and reward simulation
- [x] Repository source/test evidence inspection
- [x] `gibwork simulate` worker execution forecast
- [x] `gibwork validate` contract validation
- [x] Human-approved Gibwork publishing
- [x] Native MCP server
- [x] One-command safe demo
- [x] Optional AI reasoning adapter
- [ ] End-to-end live task demonstration
- [ ] MCP client walkthrough recording

## Environment

Node.js 22+ is required.

For GitHub API access to public repositories, no token is required for basic usage. A `GITHUB_TOKEN` can be supplied when higher API limits or private-repository support is appropriate.

For optional AI reasoning:

```bash
GIBWORK_AI_API_KEY=...
GIBWORK_AI_MODEL=gemini-2.5-flash
```

For publishing:

```bash
SOLANA_PRIVATE_KEY=...
GIBWORK_ENVIRONMENT=stage
```

Use a dedicated development wallet while testing. Never commit a private key or place one in shell scripts.

## Hackathon

Built for the **Gibwork Developer Hackathon**: a developer-tool use case that turns unstructured work requests into precise, testable Gibwork tasks using the SDK, CLI, and MCP, entirely outside the browser.

## License

MIT
