import { execSync } from "child_process";
import { appendFileSync, existsSync } from "fs";
import path from "path";

const NAME = "Prateek Vajpayee";
const EMAIL = "pvajpayee41@gmail.com";
const BRANCH = "main";
const LOCAL_DIR = path.resolve(".");

function run(cmd, env = {}) {
  console.log("→", cmd);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

process.chdir(LOCAL_DIR);
try { run(`git checkout ${BRANCH}`); } catch { run(`git checkout -b ${BRANCH}`); }

run(`git config user.name "${NAME}"`);
run(`git config user.email "${EMAIL}"`);

if (!existsSync("log.txt")) {
  appendFileSync("log.txt", "start\n");
  run("git add log.txt");
  run('git commit -m "Initial commit"');
}

const now = new Date();
const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }

for (let y = start.getFullYear(), m = start.getMonth();
     (y < now.getFullYear()) || (y === now.getFullYear() && m <= now.getMonth()); ) {

  const dim = daysInMonth(y, m);
  const randomDays = [...Array(dim).keys()].filter(() => Math.random() < 0.1);

  for (const d of randomDays) {
    const date = new Date(y, m, d + 1);
    if (date > now) continue;
    const when = date.toISOString();
    appendFileSync("log.txt", `update ${when}\n`);
    run("git add log.txt");
    run(`git commit -m "Backfill: ${when}"`, {
      GIT_AUTHOR_DATE: when,
      GIT_COMMITTER_DATE: when,
    });
  }
  m++; if (m > 11) { m = 0; y++; }
}

run(`git push -u origin ${BRANCH}`);
console.log("\n✅ Backfill complete!");
