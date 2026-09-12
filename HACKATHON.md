# Gibwork Developer Hackathon Submission

## Gibwork Task Compiler

**Tagline:** Turn vague developer work into precise, testable, economically scoped Gibwork tasks.

## The problem

Developer work often starts as a short issue:

> "Fix the OAuth callback."

A marketplace can publish that request, but the difficult work happens before publication: understanding the repository, defining what done means, identifying evidence, estimating effort, and choosing a fair reward.

If that preparation is weak, workers need clarification, scope expands, and bounty outcomes become unpredictable.

## The solution

**Gibwork Task Compiler** is a terminal-first developer tool and MCP server that adds a task-engineering layer before work reaches Gibwork.

It takes a GitHub issue or rough developer request and produces a structured Task Contract containing:

- objective
- requirements
- acceptance criteria
- constraints
- evidence requirements
- likely implementation areas
- test plan
- effort estimate
- recommended reward range
- ambiguity/readiness score
- confidence and validation findings

It can then preview the exact task payload and, only after explicit confirmation, publish through the Gibwork SDK.

## Why Gibwork matters

This is not a generic project-management tool. The final artifact is designed specifically for a **Gibwork task** and uses the Gibwork SDK for the publication boundary.

The use case is outside the browser: developers and AI coding agents can prepare Gibwork work from a terminal or MCP-compatible environment.

## What is novel

The key idea is the combination of four layers:

1. **Repository evidence** — inspect the actual GitHub issue, tree, source files, and tests instead of inventing likely filenames.
2. **Deterministic validation** — require requirements, acceptance criteria, evidence, effort, and reward to satisfy quality checks.
3. **AI reasoning** — optionally use an AI model to turn repository evidence into a deeper implementation plan and identify missing information.
4. **Safe economic action** — preview the exact Gibwork payload and keep publication behind an explicit human confirmation boundary.

The result is a **quality gate for paid developer work**, not another bounty discovery tool.

## Architecture

```text
                    GitHub Issue / Request
                              |
                              v
                       +--------------+
                       |    COMPILE   |
                       +------+-------+
                              |
                              v
                       +--------------+
                       |    INSPECT   | <--- GitHub repository
                       +------+-------+      source + tests
                              |
                              v
                       +--------------+
                       |   SIMULATE   |
                       +------+-------+
                              |
                              v
                       +--------------+
                       | AI REASONING | <--- optional
                       +------+-------+
                              |
                              v
                       +--------------+
                       |   VALIDATE   |
                       +------+-------+
                              |
                              v
                       +--------------+
                       |    PREVIEW   |
                       +------+-------+
                              |
                       HUMAN CONFIRMATION
                              |
                              v
                       +--------------+
                       |   GIBWORK    |
                       +--------------+
```

## CLI demo

Install and build:

```bash
npm install
npm run build
```

Run the safe judge demo:

```bash
npm run demo
```

The demo exercises the complete analysis path and does not create or fund a live task.

For a real workflow:

```bash
gibwork compile \
  --request "Fix the OAuth callback so authenticated users stay logged in" \
  --reference https://github.com/owner/project/issues/42
```

Then:

```bash
gibwork simulate --contract task.json --output simulation.json
gibwork validate --contract task.json --simulation simulation.json
gibwork preview --contract task.json
```

Only after review:

```bash
gibwork publish --contract task.json --confirm
```

## MCP demo

Start the MCP server:

```bash
npm run mcp
```

An MCP-compatible coding agent can use:

- `compile_task`
- `inspect_repository`
- `simulate_task`
- `reason_task`
- `validate_task`
- `preview_gibwork_task`
- `publish_gibwork_task`

The publication tool is deliberately isolated and requires explicit confirmation.

## Example output

```text
GIBWORK TASK SIMULATION

REPOSITORY
owner/project · TypeScript · 420 stars · 7 open issues

EXECUTION PLAN
1. Reproduce the OAuth callback failure
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
• callback.ts contains authentication/session logic
• callback.ts contains explicit error handling
• callback.test.ts contains assertion-based coverage

EFFORT
1.5–2.5 hours

RECOMMENDED REWARD
USDC 60–100

CONFIDENCE
91%

RECOMMENDATION
PUBLISH
```

## Why it is a strong hackathon fit

The challenge asks for a new use case for Gibwork using the SDK, CLI, or MCP, focused on developer tooling, terminal utilities, automation, or AI-agent integration outside the browser.

Gibwork Task Compiler directly targets all of those dimensions:

- **SDK:** publishes validated task contracts through the Gibwork SDK.
- **CLI:** complete task engineering workflow from a terminal.
- **MCP:** exposes the workflow to AI coding agents.
- **Developer tool:** understands GitHub repositories and tests.
- **Automation:** compile → inspect → simulate → validate → preview.
- **AI integration:** optional reasoning over real repository evidence.
- **Outside the browser:** no marketplace UI is required for task preparation.

## Safety and trust

The system is designed to reduce accidental or low-quality economic actions:

- Analysis commands never publish.
- Validation happens before publication.
- Publishing is a separate command/tool.
- Publishing requires explicit confirmation.
- Private keys are read from environment configuration and never accepted as CLI arguments.
- The judge demo never creates or funds a live task.

## Current status

Implemented:

- [x] Task Contract compiler
- [x] GitHub issue/repository inspection
- [x] Source and test evidence extraction
- [x] Simulation and effort/reward estimation
- [x] Deterministic validation
- [x] Optional AI reasoning
- [x] Gibwork SDK publication adapter
- [x] Explicit publish confirmation
- [x] MCP server
- [x] Safe one-command demo
- [x] GitHub Actions CI for build and demo

## Submission pitch

**Gibwork Task Compiler is the missing pre-flight layer for paid developer work: it turns vague requests into repository-aware, testable, economically scoped Gibwork tasks—and lets AI coding agents perform that preparation from the terminal through MCP, while keeping the final economic action under human control.**
