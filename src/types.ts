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
