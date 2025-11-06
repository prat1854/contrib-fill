// backfill.js
// Creates 3–4 commits per month for the last 12 months with realistic random dates.

const { execSync } = require("child_process");
const { existsSync, mkdirSync, appendFileSync } = require("fs");
const path = require("path");

// ====== EDIT THESE ======
const NAME  = "prat1854 ";                 // git user.name
const EMAIL = "pvajpayee41@gmail.com";  // git user.email (MUST match a verified GitHub email)
const REPO_URL = "https://github.com/prat1854/contrib-fill.git";
const BRANCH = "main";
const LOCAL_DIR = path.resolve("./contrib-fill");
// ========================

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: "inherit", ...opts });
}

function daysInMonth(y, m /* 0-based */) {
  return new Date(y, m + 1, 0).getDate();
}

function isoAtNoon(d) {
  // noon time to avoid DST edges; tweak if you like
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  return s.toISOString().replace(".000Z", "Z");
}

function pickUniqueDays(year, month, targetCount = 3) {
  const dim = daysInMonth(year, month);
  const count = Math.floor(Math.random() * 2) + targetCount; // 3 or 4
  const chosen = new Set();
  while (chosen.size < count) {
    const day = Math.floor(Math.random() * dim) + 1;
    chosen.add(day);
  }
  return [...chosen].sort((a, b) => a - b);
}

// --- clone or setup local repo
if (!existsSync(LOCAL_DIR)) {
  mkdirSync(LOCAL_DIR, { recursive: true });
  sh(`git clone ${REPO_URL} "${LOCAL_DIR}"`);
}

process.chdir(LOCAL_DIR);

// if first run on empty repo, init a file so branch exists
try { sh(`git checkout ${BRANCH}`); } catch {
  sh(`git checkout -b ${BRANCH}`);
}

sh(`git config user.name "${NAME}"`);
sh(`git config user.email "${EMAIL}"`);

if (!existsSync(path.join(LOCAL_DIR, "log.txt"))) {
  appendFileSync("log.txt", "start\n");
  sh(`git add log.txt`);
  sh(`git commit -m "Initial commit"`);
}

// --- generate dates for last 12 months (excluding future)
const now = new Date();
const start = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 11 months ago, first day

for (let y = start.getFullYear(), m = start.getMonth(); (y < now.getFullYear()) || (y === now.getFullYear() && m <= now.getMonth()); ) {
  const days = pickUniqueDays(y, m, 3);
  for (const d of days) {
    const date = new Date(y, m, d);
    if (date > now) continue; // skip future days in current month
    const when = isoAtNoon(date);
    appendFileSync("log.txt", `update ${when}\n`);
    sh(`git add log.txt`);
    // set author/committer dates for backfill
    sh(`git -c "user.name=${NAME}" -c "user.email=${EMAIL}" ` +
       `-c "GIT_AUTHOR_DATE=${when}" -c "GIT_COMMITTER_DATE=${when}" ` +
       `commit -m "Backfill: ${when}"`, { env: { ...process.env, GIT_AUTHOR_DATE: when, GIT_COMMITTER_DATE: when }});
  }

  // move to next month
  m++;
  if (m > 11) { m = 0; y++; }
}

// push once at the end
sh(`git push -u origin ${BRANCH}`);

console.log("\n✅ Backfill complete! Check your contribution graph in a minute or two.");
