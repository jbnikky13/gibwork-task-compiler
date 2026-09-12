import type { RepoInspection, SimulationResult, TaskContract } from "./types.js";

export interface ValidationIssue {
  severity: "ERROR" | "WARNING" | "INFO";
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
  requirementCoverage: { total: number; covered: number; uncovered: string[] };
  testability: { totalCriteria: number; testable: number; untestable: string[] };
  recommendation: "PUBLISH" | "REVIEW" | "REWRITE";
}

const hasVerificationSignal = (value: string) => /test|verify|assert|check|expect|reproduc|output|error|success|response|result|visible|returns|persists|rejects/i.test(value);

function requirementCoverage(contract: TaskContract): ValidationResult["requirementCoverage"] {
  const uncovered = contract.requirements.filter((requirement) => {
    const words = requirement.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 4);
    return !contract.acceptanceCriteria.some((criterion) => words.some((word) => criterion.toLowerCase().includes(word)));
  });
  return { total: contract.requirements.length, covered: contract.requirements.length - uncovered.length, uncovered };
}

function testability(contract: TaskContract): ValidationResult["testability"] {
  const untestable = contract.acceptanceCriteria.filter((criterion) => !hasVerificationSignal(criterion));
  return { totalCriteria: contract.acceptanceCriteria.length, testable: contract.acceptanceCriteria.length - untestable.length, untestable };
}

export function validateTask(contract: TaskContract, inspection?: RepoInspection, simulation?: SimulationResult): ValidationResult {
  const issues: ValidationIssue[] = [];
  const coverage = requirementCoverage(contract);
  const criteria = testability(contract);

  if (!contract.objective.trim()) issues.push({ severity: "ERROR", code: "EMPTY_OBJECTIVE", message: "Task has no objective." });
  if (contract.requirements.length === 0) issues.push({ severity: "ERROR", code: "NO_REQUIREMENTS", message: "Task has no explicit requirements." });
  if (coverage.uncovered.length) issues.push({ severity: "ERROR", code: "UNCOVERED_REQUIREMENTS", message: `${coverage.uncovered.length} requirement(s) are not clearly represented by acceptance criteria.` });
  if (criteria.untestable.length) issues.push({ severity: "WARNING", code: "UNTESTABLE_CRITERIA", message: `${criteria.untestable.length} acceptance criterion/criteria lack an obvious verification signal.` });
  if (contract.recommendedReward.min <= 0 || contract.recommendedReward.max < contract.recommendedReward.min) issues.push({ severity: "ERROR", code: "INVALID_REWARD", message: "Recommended reward range is invalid." });
  if (contract.estimatedEffortHours.min <= 0 || contract.estimatedEffortHours.max < contract.estimatedEffortHours.min) issues.push({ severity: "ERROR", code: "INVALID_EFFORT", message: "Estimated effort range is invalid." });
  if (contract.evidenceRequired.length === 0) issues.push({ severity: "WARNING", code: "NO_EVIDENCE", message: "No submission evidence has been defined." });
  if (contract.readiness === "NEEDS_CLARIFICATION") issues.push({ severity: "WARNING", code: "AMBIGUOUS", message: "Compiler marked the task as needing clarification." });

  if (inspection) {
    if (inspection.issue?.state === "closed") issues.push({ severity: "ERROR", code: "CLOSED_ISSUE", message: "The referenced GitHub issue is closed." });
    if (inspection.relevantFiles.length === 0) issues.push({ severity: "WARNING", code: "NO_RELEVANT_FILES", message: "No repository files could be matched to the task context." });
    if (inspection.testFiles.length === 0) issues.push({ severity: "WARNING", code: "NO_TESTS_FOUND", message: "No recognizable test files were found." });
  } else {
    issues.push({ severity: "INFO", code: "NO_REPOSITORY_CONTEXT", message: "Validation is contract-only because no GitHub repository was inspected." });
  }

  if (simulation?.recommendation === "REWRITE") issues.push({ severity: "ERROR", code: "SIMULATION_REWRITE", message: "Simulation recommends rewriting the task before publishing." });
  if (simulation?.recommendation === "REVIEW") issues.push({ severity: "WARNING", code: "SIMULATION_REVIEW", message: "Simulation recommends human review before publishing." });
  if (simulation && simulation.confidence < 70) issues.push({ severity: "WARNING", code: "LOW_CONFIDENCE", message: `Simulation confidence is ${simulation.confidence}%.` });

  const errors = issues.filter((issue) => issue.severity === "ERROR").length;
  const warnings = issues.filter((issue) => issue.severity === "WARNING").length;
  let score = 100 - errors * 25 - warnings * 8;
  score += coverage.total ? Math.round((coverage.covered / coverage.total) * 10) - 10 : -10;
  score = Math.max(0, Math.min(100, score));

  const recommendation: ValidationResult["recommendation"] = errors ? "REWRITE" : warnings ? "REVIEW" : "PUBLISH";
  return { valid: errors === 0, score, issues, requirementCoverage: coverage, testability: criteria, recommendation };
}
