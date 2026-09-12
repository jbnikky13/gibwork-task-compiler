import { createGibworkClient } from "@gibwork/sdk/node";
import type { Bounty } from "./types.js";

function client() {
  const privateKey = process.env.SOLANA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("SOLANA_PRIVATE_KEY is required. Bounty Autopilot never accepts a private key as a CLI argument.");
  }
  return createGibworkClient({ privateKey, production: process.env.GIBWORK_ENVIRONMENT === "production" });
}

function normalizeTask(task: any): Bounty {
  const reward = Number(task?.payment?.amount ?? task?.reward ?? task?.amount ?? 0);
  return {
    id: String(task?.taskId ?? task?.id ?? "unknown"),
    title: String(task?.title ?? "Untitled bounty"),
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
