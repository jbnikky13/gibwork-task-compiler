#!/usr/bin/env node
import { Command } from "commander";
import { compileTask } from "./compiler.js";

const program = new Command();
program
  .name("gibwork")
  .description("Compile vague developer requests into precise, testable Gibwork tasks")
  .version("0.1.0");

program
  .command("compile")
  .description("Compile a developer request into a structured Gibwork Task Contract")
  .requiredOption("--request <request>", "rough task, issue, or developer request")
  .option("--reference <reference>", "GitHub issue URL, issue number, or other source reference")
  .option("--currency <currency>", "reward currency", "USDC")
  .option("--json", "output the Task Contract as JSON")
  .action((options) => {
    try {
      const contract = compileTask({
        request: options.request,
        reference: options.reference,
        currency: options.currency,
      });

      if (options.json) {
        console.log(JSON.stringify(contract, null, 2));
        return;
      }

      console.log("\n🧩 GIBWORK TASK COMPILER\n");
      console.log(`OBJECTIVE\n${contract.objective}\n`);

      console.log("REQUIREMENTS");
      contract.requirements.forEach((item) => console.log(`✓ ${item}`));
      console.log();

      console.log("ACCEPTANCE CRITERIA");
      contract.acceptanceCriteria.forEach((item) => console.log(`✓ ${item}`));
      console.log();

      console.log("CONSTRAINTS");
      contract.constraints.forEach((item) => console.log(`• ${item}`));
      console.log();

      console.log("EVIDENCE REQUIRED");
      contract.evidenceRequired.forEach((item) => console.log(`• ${item}`));
      console.log();

      console.log(`ESTIMATED EFFORT\n${contract.estimatedEffortHours.min}–${contract.estimatedEffortHours.max} hours\n`);
      console.log(`RECOMMENDED REWARD\n${contract.recommendedReward.currency} ${contract.recommendedReward.min}–${contract.recommendedReward.max}\n`);
      console.log(`AMBIGUITY SCORE\n${contract.ambiguityScore}/100\n`);
      console.log(`READINESS\n${contract.readiness}\n`);
      console.log("Next: gibwork validate-task <contract.json>");
    } catch (error) {
      console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

program.parseAsync().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
