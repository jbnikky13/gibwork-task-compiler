import type { Bounty, ScoredBounty, SkillProfile } from "./types.js";

const STOP_WORDS = new Set(["the", "and", "for", "with", "from", "this", "that", "your", "into", "task", "work"]);

function words(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9+#.]+/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
  );
}

function estimateHours(bounty: Bounty): number {
  const text = `${bounty.title} ${bounty.description}`.toLowerCase();
  if (/documentation|docs|copy|readme|typo/.test(text)) return 0.5;
  if (/test|testing|unit/.test(text)) return 0.75;
  if (/bug|fix|debug|error/.test(text)) return 1.25;
  if (/integration|api|mcp|sdk/.test(text)) return 2;
  if (/build|implement|feature|develop/.test(text)) return 3;
  return 2;
}

export function scoreBounty(bounty: Bounty, profile: SkillProfile): ScoredBounty {
  const profileWords = new Set(profile.skills.flatMap((skill) => [...words(skill)]));
  const taskWords = new Set([...words(`${bounty.title} ${bounty.description}`), ...bounty.tags.flatMap((tag) => [...words(tag)])]);
  const matches = [...taskWords].filter((word) => profileWords.has(word));
  const skillMatch = Math.min(100, Math.round((matches.length / Math.max(1, Math.min(taskWords.size, profileWords.size))) * 100));

  const estimatedHours = estimateHours(bounty);
  const successProbability = Math.max(0.35, Math.min(0.98, 0.45 + skillMatch / 200));
  const expectedValuePerHour = (bounty.reward * successProbability) / estimatedHours;
  const risk: ScoredBounty["risk"] = successProbability >= 0.8 ? "LOW" : successProbability >= 0.6 ? "MEDIUM" : "HIGH";

  const reasons: string[] = [];
  if (matches.length) reasons.push(`matches: ${matches.slice(0, 5).join(", ")}`);
  if (bounty.reward >= profile.minimumReward) reasons.push("meets minimum reward");
  if (estimatedHours <= profile.maxHours) reasons.push(`fits ${profile.maxHours}h time budget`);
  if (!matches.length) reasons.push("low direct skill overlap");

  const score = Math.round(expectedValuePerHour * 0.6 + skillMatch * 0.25 + Math.min(100, bounty.reward) * 0.15);
  return { ...bounty, skillMatch, estimatedHours, successProbability, expectedValuePerHour, risk, score, reasons };
}

export function rankBounties(bounties: Bounty[], profile: SkillProfile): ScoredBounty[] {
  return bounties
    .filter((bounty) => bounty.reward >= profile.minimumReward)
    .map((bounty) => scoreBounty(bounty, profile))
    .sort((a, b) => b.score - a.score);
}
