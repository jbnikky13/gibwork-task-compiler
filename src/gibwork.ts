import { createGibworkClient } from "@gibwork/sdk/node";
import type { Bounty, TaskContract } from "./types.js";

function client() {
  const privateKey = process.env.SOLANA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("SOLANA_PRIVATE_KEY is required for Gibwork API operations. Never pass a private key as a CLI argument.");
  }
  return createGibworkClient({ privateKey, production: process.env.GIBWORK_ENVIRONMENT === "production" });
}

function normalizeTask(task: any): Bounty {
  const reward = Number(task?.payment?.amount ?? task?.reward ?? task?.amount ?? 0);
  return {
    id: String(task?.taskId ?? task?.id ?? "unknown"),
    title: String(task?.title ?? "Untitled task"),
    description: String(task?.content ?? task?.description ?? ""),
    reward: Number.isFinite(reward) ? reward : 0,
    currency: String(task?.payment?.symbol ?? task?.asset?.symbol ?? "USDC"),
    tags: Array.isArray(task?.tags) ? task.tags.map(String) : [],
    deadline: task?.deadline,
    status: task?.status,
    url: task?.url ?? (task?.taskId ? `https://app.gib.work/tasks/${task.taskId}` : undefined),
  };
}

export async function listBounties(): Promise<Bounty[]> {
  const result: any = await client().tasks.list();
  const items = Array.isArray(result) ? result : result?.tasks ?? result?.results ?? result?.data ?? [];
  return items.map(normalizeTask).filter((task: Bounty) => task.id !== "unknown" && task.reward > 0);
}

export interface PublishOptions {
  dryRun?: boolean;
}

export interface PublishPreview {
  title: string;
  description: string;
  reward: { amount: number; currency: string };
  requirements: string[];
  acceptanceCriteria: string[];
  evidenceRequired: string[];
  sourceReference?: string;
}

export function buildPublishPreview(contract: TaskContract): PublishPreview {
  const description = [
    contract.objective,
    "",
    "Requirements:",
    ...contract.requirements.map((x) => `- ${x}`),
    "",
    "Acceptance criteria:",
    ...contract.acceptanceCriteria.map((x) => `- ${x}`),
    "",
    "Evidence required:",
    ...contract.evidenceRequired.map((x) => `- ${x}`),
    "",
    "Constraints:",
    ...contract.constraints.map((x) => `- ${x}`),
  ].join("\n");

  return {
    title: contract.objective.replace(/[.!?]+$/, "").slice(0, 100),
    description,
    reward: {
      amount: contract.recommendedReward.min,
      currency: contract.recommendedReward.currency,
    },
    requirements: contract.requirements,
    acceptanceCriteria: contract.acceptanceCriteria,
    evidenceRequired: contract.evidenceRequired,
    sourceReference: contract.source.reference,
  };
}

/**
 * Publishing is intentionally explicit. This function is only called after
 * the user confirms a validated contract. The SDK API shape can vary by SDK
 * version, so the adapter keeps the publish boundary isolated here.
 */
export async function publishTask(contract: TaskContract): Promise<unknown> {
  const api: any = client();
  const preview = buildPublishPreview(contract);
  const tasks = api.tasks;
  if (!tasks?.create) {
    throw new Error("Installed Gibwork SDK does not expose tasks.create; update the SDK adapter before publishing.");
  }

  return tasks.create({
    title: preview.title,
    content: preview.description,
    payment: { amount: preview.reward.amount, symbol: preview.reward.currency },
  });
}
