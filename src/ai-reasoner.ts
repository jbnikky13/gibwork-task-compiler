import type { RepoInspection, SimulationResult, TaskContract } from "./types.js";

export interface AIReasoningResult {
  provider: "gemini" | "deterministic";
  model: string;
  summary: string;
  clarifiedObjective: string;
  implementationPlan: string[];
  acceptanceCriteria: string[];
  likelyFiles: string[];
  likelyTests: string[];
  risks: string[];
  missingInformation: string[];
  effortRationale: string;
  rewardRationale: string;
  confidence: number;
}

function deterministic(contract: TaskContract, inspection?: RepoInspection, simulation?: SimulationResult): AIReasoningResult {
  const files = inspection?.fileInsights.map((x) => x.path).slice(0, 8) ?? simulation?.likelyFiles.slice(0, 8) ?? [];
  const tests = inspection?.testFiles.slice(0, 6) ?? simulation?.likelyTests.slice(0, 6) ?? [];
  const evidence = inspection?.fileInsights.flatMap((x) => x.signals).slice(0, 8) ?? [];
  return {
    provider: "deterministic", model: "local-rules",
    summary: `The request was decomposed into ${contract.requirements.length} requirement(s) and cross-checked against ${files.length} repository file(s).`,
    clarifiedObjective: contract.objective,
    implementationPlan: [...contract.requirements.map((x) => `Implement and verify: ${x}`), files.length ? `Review affected implementation files: ${files.join(", ")}.` : "Inspect the repository for the implementation entry point.", tests.length ? `Run and extend relevant tests: ${tests.join(", ")}.` : "Add a focused regression test for the requested behavior."],
    acceptanceCriteria: contract.acceptanceCriteria, likelyFiles: files, likelyTests: tests,
    risks: [...(simulation?.scopeRisks ?? []), ...evidence].slice(0, 8),
    missingInformation: contract.readiness === "NEEDS_CLARIFICATION" ? ["More precise expected behavior or reproduction steps are needed."] : [],
    effortRationale: simulation ? `Repository simulation estimates ${simulation.effort.min}-${simulation.effort.max} hours, with ${simulation.confidence}% confidence.` : "No repository simulation was supplied.",
    rewardRationale: `Reward is scoped from the estimated implementation effort at ${contract.recommendedReward.currency} ${contract.recommendedReward.min}-${contract.recommendedReward.max}.`,
    confidence: simulation?.confidence ?? Math.max(45, 100 - contract.ambiguityScore),
  };
}

function extractText(payload: any): string { return payload?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("")?.trim() ?? ""; }

function extractJson(text: string): AIReasoningResult {
  const parsed = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim());
  return {
    provider: "gemini", model: process.env.GIBWORK_AI_MODEL ?? "gemini-2.5-flash",
    summary: String(parsed.summary ?? ""), clarifiedObjective: String(parsed.clarifiedObjective ?? ""),
    implementationPlan: Array.isArray(parsed.implementationPlan) ? parsed.implementationPlan.map(String) : [],
    acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria) ? parsed.acceptanceCriteria.map(String) : [],
    likelyFiles: Array.isArray(parsed.likelyFiles) ? parsed.likelyFiles.map(String) : [],
    likelyTests: Array.isArray(parsed.likelyTests) ? parsed.likelyTests.map(String) : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
    missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation.map(String) : [],
    effortRationale: String(parsed.effortRationale ?? ""), rewardRationale: String(parsed.rewardRationale ?? ""),
    confidence: Math.max(0, Math.min(100, Number(parsed.confidence ?? 0))),
  };
}

export async function reasonAboutTask(contract: TaskContract, inspection?: RepoInspection, simulation?: SimulationResult): Promise<AIReasoningResult> {
  const key = process.env.GIBWORK_AI_API_KEY;
  if (!key) return deterministic(contract, inspection, simulation);
  const model = process.env.GIBWORK_AI_MODEL ?? "gemini-2.5-flash";
  const context = JSON.stringify({ contract, repository: inspection ? { ...inspection, fileInsights: inspection.fileInsights.map((x) => ({ ...x, content: x.content.slice(0, 6000) })) } : undefined, simulation }, null, 2);
  const prompt = `You are a senior software task architect. Analyze the supplied developer request, GitHub issue context, repository source snippets, tests, and deterministic simulation. Improve the task specification without inventing facts. Return ONLY valid JSON with exactly these keys: summary, clarifiedObjective, implementationPlan (string[]), acceptanceCriteria (string[]), likelyFiles (string[]), likelyTests (string[]), risks (string[]), missingInformation (string[]), effortRationale, rewardRationale, confidence (0-100). Only name files that appear in supplied repository evidence. Prefer concrete, testable acceptance criteria. Flag uncertainty instead of guessing.\n\nCONTEXT:\n${context}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json" } }),
  });
  if (!response.ok) throw new Error(`AI reasoning request failed (${response.status}): ${await response.text()}`);
  const text = extractText(await response.json());
  if (!text) throw new Error("AI reasoning returned an empty response.");
  return extractJson(text);
}
