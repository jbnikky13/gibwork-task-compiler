#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { compileTask } from "./compiler.js";
import { inspectGitHub } from "./github-inspector.js";
import { simulateTask } from "./simulator.js";
import { validateTask } from "./validator.js";
import { buildPublishPreview, publishTask } from "./gibwork.js";
import type { TaskContract } from "./types.js";

const server = new Server(
  { name: "gibwork-task-compiler", version: "0.4.0" },
  { capabilities: { tools: {} } },
);

const text = (value: unknown) => ({ content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] });
const arg = (args: Record<string, unknown> | undefined, name: string): string | undefined => {
  const value = args?.[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};
const required = (args: Record<string, unknown> | undefined, name: string): string => {
  const value = arg(args, name);
  if (!value) throw new Error(`Missing required argument: ${name}`);
  return value;
};

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "compile_task",
      description: "Turn a vague developer request into a structured Gibwork Task Contract.",
      inputSchema: { type: "object", properties: { request: { type: "string" }, reference: { type: "string" }, currency: { type: "string", default: "USDC" } }, required: ["request"] },
    },
    {
      name: "inspect_repository",
      description: "Inspect a public GitHub repository or issue and return relevant source/test evidence.",
      inputSchema: { type: "object", properties: { reference: { type: "string" } }, required: ["reference"] },
    },
    {
      name: "simulate_task",
      description: "Simulate execution of a Task Contract using real GitHub repository evidence.",
      inputSchema: { type: "object", properties: { contract: { type: "object" }, reference: { type: "string" } }, required: ["contract"] },
    },
    {
      name: "validate_task",
      description: "Validate that a compiled task is specific, testable, feasible, and ready for Gibwork.",
      inputSchema: { type: "object", properties: { contract: { type: "object" }, reference: { type: "string" }, simulation: { type: "object" } }, required: ["contract"] },
    },
    {
      name: "preview_gibwork_task",
      description: "Generate the exact Gibwork task payload without publishing it.",
      inputSchema: { type: "object", properties: { contract: { type: "object" } }, required: ["contract"] },
    },
    {
      name: "publish_gibwork_task",
      description: "Publish a READY task to Gibwork. This is the only mutating tool and requires explicit confirmation=true.",
      inputSchema: { type: "object", properties: { contract: { type: "object" }, confirmation: { type: "boolean", description: "Must be true to publish." } }, required: ["contract", "confirmation"] },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    switch (request.params.name) {
      case "compile_task": {
        return text(compileTask({ request: required(args, "request"), reference: arg(args, "reference"), currency: arg(args, "currency") ?? "USDC" }));
      }
      case "inspect_repository": {
        return text(await inspectGitHub(required(args, "reference")));
      }
      case "simulate_task": {
        const contract = args.contract as TaskContract;
        if (!contract || typeof contract !== "object") throw new Error("contract must be an object");
        const reference = arg(args, "reference") ?? contract.source.reference;
        const inspection = reference ? await inspectGitHub(reference) : undefined;
        return text({ result: simulateTask(contract, inspection), inspection });
      }
      case "validate_task": {
        const contract = args.contract as TaskContract;
        if (!contract || typeof contract !== "object") throw new Error("contract must be an object");
        const reference = arg(args, "reference") ?? contract.source.reference;
        const inspection = reference ? await inspectGitHub(reference) : undefined;
        const simulation = (args.simulation as any) ?? (inspection ? simulateTask(contract, inspection) : undefined);
        return text({ result: validateTask(contract, inspection, simulation), inspection, simulation });
      }
      case "preview_gibwork_task": {
        const contract = args.contract as TaskContract;
        if (!contract || typeof contract !== "object") throw new Error("contract must be an object");
        return text(buildPublishPreview(contract));
      }
      case "publish_gibwork_task": {
        const contract = args.contract as TaskContract;
        if (!contract || typeof contract !== "object") throw new Error("contract must be an object");
        if (args.confirmation !== true) throw new Error("Publishing is disabled unless confirmation=true is explicitly supplied.");
        if (contract.readiness !== "READY") throw new Error(`Task is ${contract.readiness}. Only READY contracts can be published.`);
        return text(await publishTask(contract));
      }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }] };
  }
});

await server.connect(new StdioServerTransport());
