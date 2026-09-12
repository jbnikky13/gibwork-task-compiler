#!/usr/bin/env node
import { Command } from "commander";
import { listBounties } from "./gibwork.js";
import { rankBounties } from "./scoring.js";
import type { SkillProfile } from "./types.js";

const program = new Command();
program.name("bounty").description("AI-assisted Gibwork bounty discovery and ROI ranking").version("0.1.0");

program
  .command("hunt")
  .description("Find and rank Gibwork bounties by skill fit and expected value")
  .option("--skills <skills>", "comma-separated skills", "TypeScript,JavaScript,Python,AI,MCP,GitHub,Solana")
  .option("--min-reward <usd>", "minimum reward", "10")
  .option("--max-hours <hours>", "maximum estimated effort", "4")
  .option("--limit <count>", "number of results", "10")
  .option("--json", "output machine-readable JSON")
  .action(async (options) => {
    try {
      const profile: SkillProfile = {
        skills: options.skills.split(",").map((s: string) => s.trim()).filter(Boolean),
        minimumReward: Number(options.minReward),
        maxHours: Number(options.maxHours),
      };
      const ranked = rankBounties(await listBounties(), profile).slice(0, Number(options.limit));
      if (options.json) {
        console.log(JSON.stringify({ ok: true, data: ranked }, null, 2));
        return;
      }
      console.log("\n🔎 BOUNTY AUTOPILOT — GIBWORK HUNT\n");
      if (!ranked.length) {
        console.log("No bounties matched your current profile.");
        return;
      }
      ranked.forEach((bounty, index) => {
        console.log(`${index + 1}. ${bounty.title}`);
        console.log(`   ${bounty.currency} ${bounty.reward.toFixed(2)} · ${bounty.skillMatch}% skill match · ~${bounty.estimatedHours}h`);
        console.log(`   Expected value: ${bounty.currency} ${bounty.expectedValuePerHour.toFixed(2)}/hr · Risk: ${bounty.risk}`);
        console.log(`   ${bounty.reasons.join(" · ")}`);
        if (bounty.url) console.log(`   ${bounty.url}`);
        console.log();
      });
      console.log("Next: bounty analyze <id>");
    } catch (error) {
      console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

program.parseAsync().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
