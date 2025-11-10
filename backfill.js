// backfill.js  —  clean version (no -c GIT_AUTHOR_DATE)

import { execSync } from "child_process";
import { existsSync, appendFileSync } from "fs";
import path from "path";

const NAME  = "Prateek Vajpayee";
const EMAIL = "pvajpayee41@gmail.com";   // must be verified
const BRANCH = "main";
const LOCAL_DIR = path.resolve(".");

function sh(cmd, env = {}) {
  console.log("→", cmd);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function isoAtNoon(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).toISOString(); }
function pickUniqueDays(y, m) {
  const dim = daysInMonth(y, m);
  const cnt = Math.floor(Math.random() * 2) + 3; // 3–4
  const set = new Set();
  while (set.size < cnt) set.add(Math.floor(Math.random() * dim) + 1);
  return [...set].sort((a, b) => a - b);
}

try {
  process.chdir(LOCAL_DIR);
  try { sh(`git checkout ${BRANCH}`); } catch { sh(`git checkout -b ${BRANCH}`); }
  sh(`git config user.name "${NAME}"`);
  sh(`git config user.email "${EMAIL}"`);

  if (!existsSync(path.join(LOCAL_DIR, "log.txt"))) {
    appendFileSync("log.txt", "start\n");
    sh(`git add log.txt`);
    sh(`git commit -m "Initial commit"`);
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  for (let y = start.getFullYear(), m = start.getMonth();
       (y < now.getFullYear()) || (y === now.getFullYear() && m <= now.getMonth());
  ) {
    for (const d of pickUniqueDays(y, m)) {
      const date = new Date(y, m, d);
      if (date > now) continue;
      const when = isoAtNoon(date);
      appendFileSync("log.txt", `update ${when}\n`);
      sh(`git add log.txt`);
      sh(`git commit -m "Backfill: ${when}"`, {
        GIT_AUTHOR_DATE: when,
        GIT_COMMITTER_DATE: when,
      });
    }
    m++; if (m > 11) { m = 0; y++; }
  }

  sh(`git push -u origin ${BRANCH}`);
  console.log("\n✅ Backfill complete — check contributions in 1–2 min.");
} catch (e) {
  console.error("❌", e.message);
  process.exit(1);
}
