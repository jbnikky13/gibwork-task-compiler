import type { SimulationResult, TaskContract } from "./types.js";

const round = (value: number, step = 0.25) => Math.round(value / step) * step;

function likelyFiles(contract: TaskContract): string[] {
  const text = `${contract.objective} ${contract.requirements.join(" ")}`.toLowerCase();
  const files = new Set<string>();
  if (/auth|login|oauth|session|token/.test(text)) files.add("src/auth/**");
  if (/api|endpoint|webhook|request|http/.test(text)) files.add("src/api/**");
  if (/database|db|sql|query|schema/.test(text)) files.add("src/db/**");
  if (/ui|interface|component|button|page|frontend/.test(text)) files.add("src/components/**");
  if (/cli|command|terminal/.test(text)) files.add("src/cli.ts");
  if (/config|environment|env/.test(text)) files.add("configuration files");
  if (!files.size) files.add("repository source files relevant to the requested behavior");
  return [...files];
}

function likelyTests(contract: TaskContract): string[] {
  const text = `${contract.objective} ${contract.requirements.join(" ")}`.toLowerCase();
  const tests = ["existing tests for the affected behavior"];
  if (/fix|bug|error|regression/.test(text)) tests.push("a regression test reproducing the original failure");
  if (/api|webhook|request/.test(text)) tests.push("success, invalid-input, and failure-path API tests");
  if (/auth|login|oauth|token/.test(text)) tests.push("authentication success, rejection, and expiry cases");
  if (/ui|component|page/.test(text)) tests.push("component behavior and user-interaction tests");
  return [...new Set(tests)];
}

export function simulateTask(contract: TaskContract): SimulationResult {
  const base = (contract.estimatedEffortHours.min + contract.estimatedEffortHours.max) / 2;
  const likely = round(base);
  const min = Math.max(0.5, round(contract.estimatedEffortHours.min * 0.9));
  const max = Math.max(likely + 0.5, round(contract.estimatedEffortHours.max * 1.15));
  const blockers: string[] = [];
  const scopeRisks: string[] = [];

  if (contract.readiness === "NEEDS_CLARIFICATION") blockers.push("Task has unresolved ambiguity; acceptance criteria should be clarified before funding.");
  if (!contract.source.reference) blockers.push("No repository or issue reference was supplied; simulation cannot inspect the actual codebase.");
  if (contract.requirements.length === 1) scopeRisks.push("Single high-level requirement may hide additional implementation work.");
  if (contract.acceptanceCriteria.length < 3) scopeRisks.push("Acceptance criteria are too thin to confidently define done.");
  scopeRisks.push("Estimated files and effort are heuristic until repository inspection is available.");

  const confidence = Math.max(35, Math.min(95,
    92 - contract.ambiguityScore * 0.35 - (contract.source.reference ? 0 : 20) - scopeRisks.length * 4,
  ));
  const rewardMin = Math.ceil(min * 30 / 5) * 5;
  const rewardRecommended = Math.ceil(likely * 38 / 5) * 5;
  const rewardMax = Math.ceil(max * 45 / 5) * 5;

  let recommendation: SimulationResult["recommendation"] = "PUBLISH";
  if (contract.readiness === "NEEDS_CLARIFICATION" || confidence < 55) recommendation = "REWRITE";
  else if (contract.readiness === "REVIEW" || confidence < 75 || !contract.source.reference) recommendation = "REVIEW";

  return {
    version: "0.1",
    objective: contract.objective,
    executionPlan: [
      "Read the repository and issue context.",
      "Identify the smallest set of files/components required for the requested behavior.",
      "Implement the change without modifying unrelated functionality.",
      "Run existing tests and add regression/acceptance coverage where needed.",
      "Capture evidence for every acceptance criterion before submission.",
    ],
    likelyFiles: likelyFiles(contract),
    likelyTests: likelyTests(contract),
    blockers,
    scopeRisks,
    effort: { min, likely, max },
    reward: { min: rewardMin, recommended: rewardRecommended, max: rewardMax, currency: contract.recommendedReward.currency },
    confidence: Math.round(confidence),
    recommendation,
  };
}
