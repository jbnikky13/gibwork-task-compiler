#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { Command } from "commander";
import { compileTask } from "./compiler.js";
import { inspectGitHub } from "./github-inspector.js";
import { simulateTask } from "./simulator.js";
import { validateTask } from "./validator.js";
import type { SimulationResult, TaskContract } from "./types.js";

const program = new Command();
program.name("gibwork").description("Compile, simulate, and validate precise Gibwork tasks").version("0.3.0");

function loadContract(file: string): TaskContract { return JSON.parse(readFileSync(file, "utf8")) as TaskContract; }
function loadSimulation(file: string): SimulationResult { return JSON.parse(readFileSync(file, "utf8")) as SimulationResult; }

program.command("compile")
  .description("Compile a developer request into a structured Gibwork Task Contract")
  .requiredOption("--request <request>", "rough task, issue, or developer request")
  .option("--reference <reference>", "GitHub repository or issue URL")
  .option("--currency <currency>", "reward currency", "USDC")
  .option("--json", "output the Task Contract as JSON")
  .action((options) => {
    try {
      const contract = compileTask({ request: options.request, reference: options.reference, currency: options.currency });
      if (options.json) return console.log(JSON.stringify(contract, null, 2));
      console.log("\n🧩 GIBWORK TASK COMPILER\n");
      console.log(`OBJECTIVE\n${contract.objective}\n`);
      console.log("REQUIREMENTS"); contract.requirements.forEach((x) => console.log(`✓ ${x}`)); console.log();
      console.log("ACCEPTANCE CRITERIA"); contract.acceptanceCriteria.forEach((x) => console.log(`✓ ${x}`)); console.log();
      console.log("CONSTRAINTS"); contract.constraints.forEach((x) => console.log(`• ${x}`)); console.log();
      console.log("EVIDENCE REQUIRED"); contract.evidenceRequired.forEach((x) => console.log(`• ${x}`)); console.log();
      console.log(`ESTIMATED EFFORT\n${contract.estimatedEffortHours.min}–${contract.estimatedEffortHours.max} hours\n`);
      console.log(`RECOMMENDED REWARD\n${contract.recommendedReward.currency} ${contract.recommendedReward.min}–${contract.recommendedReward.max}\n`);
      console.log(`AMBIGUITY SCORE\n${contract.ambiguityScore}/100\nREADINESS\n${contract.readiness}\n`);
    } catch (error) { console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; }
  });

program.command("simulate")
  .description("Simulate execution using real GitHub repository and source/test content")
  .requiredOption("--contract <file>", "Task Contract JSON file")
  .option("--reference <reference>", "GitHub repository or issue URL to inspect")
  .option("--json", "output machine-readable JSON")
  .option("--output <file>", "write the simulation JSON to a file")
  .action(async (options) => {
    try {
      const contract = loadContract(options.contract);
      const reference = options.reference ?? contract.source.reference;
      const inspection = reference ? await inspectGitHub(reference) : undefined;
      const result = simulateTask(contract, inspection);
      const payload = JSON.stringify({ ...result, inspection }, null, 2);
      if (options.output) {
        const { writeFileSync } = await import("node:fs");
        writeFileSync(options.output, payload + "\n", "utf8");
      }
      if (options.json || options.output) return console.log(payload);
      console.log("\n🧪 GIBWORK TASK SIMULATION\n");
      if (inspection) {
        console.log(`REPOSITORY\n${inspection.owner}/${inspection.repo} · ${inspection.language ?? "unknown language"} · ${inspection.stars} stars · ${inspection.openIssues} open issues\n`);
        if (inspection.issue) console.log(`ISSUE\n#${inspection.issue.number} ${inspection.issue.title} · ${inspection.issue.state}\n`);
      }
      console.log(`OBJECTIVE\n${result.objective}\n`);
      console.log("EXECUTION PLAN"); result.executionPlan.forEach((x, i) => console.log(`${i + 1}. ${x}`)); console.log();
      console.log("LIKELY FILES"); result.likelyFiles.forEach((x) => console.log(`• ${x}`)); console.log();
      console.log("LIKELY TESTS"); result.likelyTests.forEach((x) => console.log(`• ${x}`)); console.log();
      console.log("CODE EVIDENCE"); (result.codeEvidence.length ? result.codeEvidence : ["No source-content evidence available."]).forEach((x) => console.log(`• ${x}`)); console.log();
      console.log("BLOCKERS"); (result.blockers.length ? result.blockers : ["None detected."]).forEach((x) => console.log(`• ${x}`)); console.log();
      console.log("SCOPE RISKS"); (result.scopeRisks.length ? result.scopeRisks : ["None detected."]).forEach((x) => console.log(`• ${x}`)); console.log();
      console.log(`EFFORT\n${result.effort.min}–${result.effort.max} hours (likely ${result.effort.likely}h)\n`);
      console.log(`RECOMMENDED REWARD\n${result.reward.currency} ${result.reward.min}–${result.reward.max} (recommended ${result.reward.recommended})\n`);
      console.log(`CONFIDENCE\n${result.confidence}%\nRECOMMENDATION\n${result.recommendation}\n`);
    } catch (error) { console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; }
  });

program.command("validate")
  .description("Validate a Task Contract against acceptance criteria and optional simulation/repository evidence")
  .requiredOption("--contract <file>", "Task Contract JSON file")
  .option("--reference <reference>", "GitHub repository or issue URL to inspect")
  .option("--simulation <file>", "previous simulation JSON file")
  .option("--json", "output machine-readable JSON")
  .action(async (options) => {
    try {
      const contract = loadContract(options.contract);
      const reference = options.reference ?? contract.source.reference;
      const inspection = reference ? await inspectGitHub(reference) : undefined;
      const simulation = options.simulation ? loadSimulation(options.simulation) : (inspection ? simulateTask(contract, inspection) : undefined);
      const result = validateTask(contract, inspection, simulation);
      if (options.json) return console.log(JSON.stringify({ ...result, inspection, simulation }, null, 2));
      console.log("\n🔎 GIBWORK TASK VALIDATION\n");
      console.log(`SCORE\n${result.score}/100\n`);
      console.log(`REQUIREMENT COVERAGE\n${result.requirementCoverage.covered}/${result.requirementCoverage.total}\n`);
      console.log(`TESTABILITY\n${result.testability.testable}/${result.testability.totalCriteria} acceptance criteria\n`);
      console.log("FINDINGS");
      (result.issues.length ? result.issues : [{ severity: "INFO", code: "CLEAN", message: "No validation findings." }]).forEach((issue) => console.log(`${issue.severity} · ${issue.code} · ${issue.message}`));
      console.log(`\nRECOMMENDATION\n${result.recommendation}\n`);
    } catch (error) { console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; }
  });

program.parseAsync().catch((error) => { console.error(error); process.exitCode = 1; });
