export type Readiness = "READY" | "REVIEW" | "NEEDS_CLARIFICATION";

export interface TaskContract {
  version: "0.1";
  objective: string;
  requirements: string[];
  acceptanceCriteria: string[];
  constraints: string[];
  evidenceRequired: string[];
  likelyAreas: string[];
  estimatedEffortHours: { min: number; max: number };
  recommendedReward: { min: number; max: number; currency: string };
  ambiguityScore: number;
  readiness: Readiness;
  source: { type: "request" | "github-issue"; reference?: string };
}

export interface CompileOptions {
  request: string;
  reference?: string;
  currency?: string;
}

export interface RepoFileInsight {
  path: string;
  size: number;
  language?: string;
  content: string;
  signals: string[];
}

export interface RepoInspection {
  owner: string;
  repo: string;
  defaultBranch: string;
  description?: string;
  language?: string;
  stars: number;
  openIssues: number;
  recentFiles: string[];
  testFiles: string[];
  relevantFiles: string[];
  fileInsights: RepoFileInsight[];
  issue?: { number: number; title: string; body: string; state: string; labels: string[] };
}

export interface SimulationResult {
  version: "0.3";
  objective: string;
  repository?: { owner: string; repo: string; defaultBranch: string; language?: string; stars: number; openIssues: number };
  executionPlan: string[];
  likelyFiles: string[];
  likelyTests: string[];
  blockers: string[];
  scopeRisks: string[];
  codeEvidence: string[];
  effort: { min: number; likely: number; max: number };
  reward: { min: number; recommended: number; max: number; currency: string };
  confidence: number;
  recommendation: "PUBLISH" | "REVIEW" | "REWRITE";
}

export interface Bounty { id: string; title: string; description: string; reward: number; currency: string; tags: string[]; deadline?: string; status?: string; url?: string; }
export interface SkillProfile { skills: string[]; minimumReward: number; maxHours: number; }
export interface ScoredBounty extends Bounty { skillMatch: number; estimatedHours: number; successProbability: number; expectedValuePerHour: number; risk: "LOW" | "MEDIUM" | "HIGH"; score: number; reasons: string[]; }
