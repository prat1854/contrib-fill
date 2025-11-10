// backfill.js — verbose + safe
const { execSync } = require("child_process");
const { existsSync, appendFileSync } = require("fs");
const path = require("path");

const NAME  = "Prateek Vajpayee";          // no trailing space
const EMAIL = "pvajpayee41@gmail.com";     // VERIFIED email in GitHub Settings → Emails
const BRANCH = "main";
const LOCAL_DIR = path.resolve(".");

function sh(cmd, opts = {}) {
  console.log("→", cmd);
  return execSync(cmd, { stdio: "inherit", ...opts });
}

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function isoAtNoon(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).toISOString().replace(".000Z","Z"); }
function pickUniqueDays(year, month, base = 3) {
  const dim = daysInMonth(year, month);
  const count = Math.floor(Math.random() * 2) + base; // 3 or 4
  const chosen = new Set();
  while (chosen.size < count) chosen.add(Math.floor(Math.random()*dim)+1);
  return [...chosen].sort((a,b)=>a-b);
}

(async () => {
  try {
    process.chdir(LOCAL_DIR);

    try { sh(`git checkout ${BRANCH}`); } 
    catch { sh(`git checkout -b ${BRANCH}`); }

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
         (y < now.getFullYear()) || (y === now.getFullYear() && m <= now.getMonth()); ) {

      const days = pickUniqueDays(y, m, 3);
      console.log(`\n📅 Month ${y}-${String(m+1).padStart(2,"0")} → days`, days);

      for (const d of days) {
        const date = new Date(y, m, d);
        if (date > now) continue;
        const when = isoAtNoon(date);

        appendFileSync("log.txt", `update ${when}\n`);
        sh(`git add log.txt`);
        sh(`git commit -m "Backfill: ${when}"`, {
          env: { ...process.env, GIT_AUTHOR_DATE: when, GIT_COMMITTER_DATE: when }
        });
      }
      m++; if (m > 11) { m = 0; y++; }
    }

    sh(`git status`);
    sh(`git log --oneline -n 5`);
    sh(`git push -u origin ${BRANCH}`);

    console.log("\n✅ Backfill complete! Refresh your contributions in ~1–2 minutes.");
  } catch (e) {
    console.error("\n❌ ERROR:", e?.message || e);
    process.exit(1);
  }
})();
