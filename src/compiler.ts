import type { CompileOptions, TaskContract } from "./types.js";

const requirementSignals = [
  "fix", "implement", "add", "remove", "update", "support", "build", "create", "integrate", "refactor",
];

function cleanRequest(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function sentence(value: string): string {
  const clean = cleanRequest(value);
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1).replace(/[.!?]+$/, "") + "." : "Complete the requested work.";
}

function extractRequirements(request: string): string[] {
  const clauses = request
    .split(/\n|;|\.(?=\s+[A-Z])/)
    .map(cleanRequest)
    .filter(Boolean);

  if (clauses.length > 1) return clauses.slice(0, 8).map(sentence);

  const action = request.match(/\b(fix|implement|add|remove|update|support|build|create|integrate|refactor)\b/i)?.[1];
  return [action ? sentence(request) : `Complete: ${sentence(request)}`];
}

function buildAcceptanceCriteria(requirements: string[]): string[] {
  return [
    "The requested behavior is implemented and reproducible.",
    ...requirements.slice(0, 4).map((item) => `Requirement verified: ${item}`),
    "Relevant existing tests continue to pass.",
    "A regression test is added when the change fixes a bug or changes behavior.",
  ].slice(0, 7);
}

function estimate(request: string, requirementCount: number) {
  const words = request.split(/\s+/).filter(Boolean).length;
  const complexity = requirementCount * 0.45 + Math.min(words / 45, 1.5);
  const min = Math.max(0.5, Math.round((0.75 + complexity) * 4) / 4);
  const max = Math.max(min + 0.75, Math.round((min * 1.65) * 4) / 4);
  return { min, max };
}

export function compileTask(options: CompileOptions): TaskContract {
  const request = cleanRequest(options.request);
  if (!request) throw new Error("A request is required.");

  const requirements = extractRequirements(request);
  const acceptanceCriteria = buildAcceptanceCriteria(requirements);
  const effort = estimate(request, requirements.length);
  const ambiguitySignals = [
    request.length < 25,
    !requirementSignals.some((signal) => request.toLowerCase().includes(signal)),
    !/(test|accept|should|must|when|after|before|error|success)/i.test(request),
  ].filter(Boolean).length;
  const ambiguityScore = Math.min(100, 25 + ambiguitySignals * 20 + (requirements.length === 1 ? 15 : 0));
  const readiness = ambiguityScore <= 40 ? "READY" : ambiguityScore <= 65 ? "REVIEW" : "NEEDS_CLARIFICATION";
  const rewardMin = Math.ceil(effort.min * 30 / 5) * 5;
  const rewardMax = Math.ceil(effort.max * 45 / 5) * 5;

  return {
    version: "0.1",
    objective: sentence(request),
    requirements,
    acceptanceCriteria,
    constraints: [
      "Do not modify unrelated functionality.",
      "Preserve existing public behavior unless the request explicitly changes it.",
      "Do not commit secrets, credentials, or generated dependency artifacts.",
    ],
    evidenceRequired: [
      "Link to the completed change or pull request.",
      "Test/build output demonstrating validation.",
      "Brief explanation of how each acceptance criterion was verified.",
    ],
    likelyAreas: [
      "Repository source code relevant to the requested behavior",
      "Existing tests for the affected feature",
      "Documentation or configuration only if required by the change",
    ],
    estimatedEffortHours: effort,
    recommendedReward: { min: rewardMin, max: rewardMax, currency: options.currency ?? "USDC" },
    ambiguityScore,
    readiness,
    source: { type: options.reference ? "github-issue" : "request", reference: options.reference },
  };
}
