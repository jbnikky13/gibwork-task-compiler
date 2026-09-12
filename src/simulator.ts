import type { RepoInspection, SimulationResult, TaskContract } from "./types.js";

const round = (value: number, step = 0.25) => Math.round(value / step) * step;

function heuristicFiles(contract: TaskContract): string[] {
  const text = `${contract.objective} ${contract.requirements.join(" ")}`.toLowerCase();
  const files = new Set<string>();
  if (/auth|login|oauth|session|token/.test(text)) files.add("src/auth/**");
  if (/api|endpoint|webhook|request|http/.test(text)) files.add("src/api/**");
  if (/database|db|sql|query|schema/.test(text)) files.add("src/db/**");
  if (/ui|interface|component|button|page|frontend/.test(text)) files.add("src/components/**");
  if (/cli|command|terminal/.test(text)) files.add("src/cli.ts");
  if (!files.size) files.add("repository source files relevant to the requested behavior");
  return [...files];
}

function heuristicTests(contract: TaskContract): string[] {
  const text = `${contract.objective} ${contract.requirements.join(" ")}`.toLowerCase();
  const tests = ["existing tests for the affected behavior"];
  if (/fix|bug|error|regression/.test(text)) tests.push("a regression test reproducing the original failure");
  if (/api|webhook|request/.test(text)) tests.push("success, invalid-input, and failure-path API tests");
  if (/auth|login|oauth|token/.test(text)) tests.push("authentication success, rejection, and expiry cases");
  if (/ui|component|page/.test(text)) tests.push("component behavior and user-interaction tests");
  return [...new Set(tests)];
}

export function simulateTask(contract: TaskContract, inspection?: RepoInspection): SimulationResult {
  const base = (contract.estimatedEffortHours.min + contract.estimatedEffortHours.max) / 2;
  const repoFiles = inspection?.relevantFiles ?? [];
  const testFiles = inspection?.testFiles ?? [];
  const likelyFiles = repoFiles.length ? repoFiles.slice(0, 12) : heuristicFiles(contract);
  const likelyTests = testFiles.length ? testFiles.slice(0, 12) : heuristicTests(contract);
  const likely = round(base + (inspection && repoFiles.length > 8 ? 0.5 : 0));
  const min = Math.max(0.5, round(contract.estimatedEffortHours.min * 0.9));
  const max = Math.max(likely + 0.5, round(contract.estimatedEffortHours.max * (inspection ? 1.1 : 1.15)));
  const blockers: string[] = [];
  const scopeRisks: string[] = [];

  if (contract.readiness === "NEEDS_CLARIFICATION") blockers.push("Task has unresolved ambiguity; acceptance criteria should be clarified before funding.");
  if (!inspection) blockers.push("Repository was not inspected; file and effort predictions remain heuristic.");
  if (inspection?.issue?.state === "closed") blockers.push("Referenced GitHub issue is closed.");
  if (inspection && inspection.testFiles.length === 0) scopeRisks.push("No recognizable test files were found in the repository tree.");
  if (inspection && inspection.openIssues > 50) scopeRisks.push(`Repository has ${inspection.openIssues} open issues; maintenance complexity may be higher than the task suggests.`);
  if (contract.requirements.length === 1) scopeRisks.push("Single high-level requirement may hide additional implementation work.");
  if (!inspection) scopeRisks.push("Estimated files and effort are heuristic until repository inspection is available.");

  const confidence = Math.max(35, Math.min(96,
    82 - contract.ambiguityScore * 0.3 + (inspection ? 15 : 0) + (repoFiles.length ? 4 : 0) + (testFiles.length ? 3 : 0) - blockers.length * 8,
  ));
  const rewardMin = Math.ceil(min * 30 / 5) * 5;
  const rewardRecommended = Math.ceil(likely * 38 / 5) * 5;
  const rewardMax = Math.ceil(max * 45 / 5) * 5;

  let recommendation: SimulationResult["recommendation"] = "PUBLISH";
  if (contract.readiness === "NEEDS_CLARIFICATION" || confidence < 55 || inspection?.issue?.state === "closed") recommendation = "REWRITE";
  else if (contract.readiness === "REVIEW" || confidence < 75 || !inspection) recommendation = "REVIEW";

  return {
    version: "0.2",
    objective: contract.objective,
    repository: inspection ? {
      owner: inspection.owner,
      repo: inspection.repo,
      defaultBranch: inspection.defaultBranch,
      language: inspection.language,
      stars: inspection.stars,
      openIssues: inspection.openIssues,
    } : undefined,
    executionPlan: [
      inspection ? `Inspect ${inspection.owner}/${inspection.repo} on ${inspection.defaultBranch}.` : "Read the repository and issue context.",
      "Identify the smallest set of files/components required for the requested behavior.",
      "Implement the change without modifying unrelated functionality.",
      "Run existing tests and add regression/acceptance coverage where needed.",
      "Capture evidence for every acceptance criterion before submission.",
    ],
    likelyFiles,
    likelyTests,
    blockers,
    scopeRisks,
    effort: { min, likely, max },
    reward: { min: rewardMin, recommended: rewardRecommended, max: rewardMax, currency: contract.recommendedReward.currency },
    confidence: Math.round(confidence),
    recommendation,
  };
}
