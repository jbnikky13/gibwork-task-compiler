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
  readiness: "READY" | "REVIEW" | "NEEDS_CLARIFICATION";
  source: {
    type: "request" | "github-issue";
    reference?: string;
  };
}

export interface CompileOptions {
  request: string;
  reference?: string;
  currency?: string;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  currency: string;
  tags: string[];
  deadline?: string;
  status?: string;
  url?: string;
}

export interface SkillProfile {
  skills: string[];
  minimumReward: number;
  maxHours: number;
}

export interface ScoredBounty extends Bounty {
  skillMatch: number;
  estimatedHours: number;
  successProbability: number;
  expectedValuePerHour: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  score: number;
  reasons: string[];
}
