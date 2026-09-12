import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const demoDir = ".demo";
rmSync(demoDir, { recursive: true, force: true });
mkdirSync(demoDir, { recursive: true });

const request = "Fix the authentication callback so users stay signed in after OAuth login and add a regression test for session persistence.";
const reference = "https://github.com/jbnikky13/gibwork-task-compiler/issues/1";
const contractFile = `${demoDir}/task.json`;
const simulationFile = `${demoDir}/simulation.json`;

function run(args) {
  console.log(`\n$ node dist/cli.js ${args.join(" ")}`);
  execFileSync(process.execPath, ["dist/cli.js", ...args], { stdio: "inherit" });
}

console.log("\n🚀 GIBWORK TASK COMPILER — JUDGE DEMO\n");
run(["compile", "--request", request, "--reference", reference, "--json"]);
const contract = execFileSync(process.execPath, ["dist/cli.js", "compile", "--request", request, "--reference", reference, "--json"], { encoding: "utf8" });
writeFileSync(contractFile, contract);
run(["simulate", "--contract", contractFile, "--reference", reference, "--output", simulationFile]);
run(["validate", "--contract", contractFile, "--reference", reference, "--simulation", simulationFile]);
run(["preview", "--contract", contractFile]);
console.log("\n✅ Demo complete. No Gibwork task was published.\n");
console.log("To publish a READY contract intentionally, use:");
console.log(`  node dist/cli.js publish --contract ${contractFile} --confirm`);
