// backfill.js
// Creates 3–4 commits per month for the last 12 months with realistic random dates.

const { execSync } = require("child_process");
const { existsSync, appendFileSync } = require("fs");
const path = require("path");

// ====== EDIT THESE ======
const NAME  = "Prateek Vajpayee";           // git user.name (no trailing space)
const EMAIL = "pvajpayee41@gmail.com";      // verified GitHub email
const BRANCH = "main";
const LOCAL_DIR = path.resolve(".");        // run inside repo
// ========================

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: "inherit", ...opts });
}

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

function isoAtNoon(d) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  return s.toISOString().replace(".000Z", "Z");
}

function pickUniqueDays(year, month, targetCount = 3) {
  const dim = daysInMonth(year, month);
  const count = Math.floor(Math.random() * 2) + targetCount; // 3 or 4 per month
  const chosen = new Set();
  while (chosen.size < count) {
    const day = Math.floor(Math.random() * dim) + 1;
    chosen.add(day);
  }
  return [...chosen].sort((a, b) => a - b);
}

// --- setup local repo ---
process.chdir(LOCAL_DIR);

try {
  sh(`git checkout ${BRANCH}`);
} catch {
  sh(`git checkout -b ${BRANCH}`);
}

sh(`git config user.name "${NAME}"`);
sh(`git config user.email "${EMAIL}"`);

if (!existsSync(path.join(LOCAL_DIR, "log.txt"))) {
  appendFileSync("log.txt", "start\n");
  sh(`git add log.txt`);
  sh(`git commit -m "Initial commit"`);
}

// --- generate backfilled commits ---
const now = new Date();
const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

for (let y = start.getFullYear(), m = start.getMonth();
     (y < now.getFullYear()) || (y === now.getFullYear() && m <= now.getMonth());
) {
  const days = pickUniqueDays(y, m, 3);
  for (const d of days) {
    const date = new Date(y, m, d);
    if (date > now) continue; // skip future
    const when = isoAtNoon(date);

    appendFileSync("log.txt", `update ${when}\n`);
    sh(`git add log.txt`);

    // ✅ Correct commit command — NO "-c GIT_AUTHOR_DATE"
    sh(`git commit -m "Backfill: ${when}"`, {
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: when,
        GIT_COMMITTER_DATE: when
      }
    });
  }

  m++;
  if (m > 11) { m = 0; y++; }
}

// push once at the end
sh(`git push -u origin ${BRANCH}`);

console.log("\n✅ Backfill complete! Check your contribution graph in a minute or two.");
