/**
 * Kill any processes holding ports 3000-3020 before dev server starts.
 * Prevents port-hopping when tsx watch restarts the server.
 * Windows-only (uses netstat + taskkill).
 */
import { execSync } from "child_process";

const START = 3000;
const END = 3020;

for (let port = START; port <= END; port++) {
  try {
    const out = execSync(`netstat -ano 2>nul | findstr ":${port} " | findstr LISTENING`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    if (!out) continue;
    const lines = out.split("\n").filter(Boolean);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== "0") {
        execSync(`taskkill /PID ${pid} /F 2>nul`, { stdio: "ignore" });
        console.log(`[predev] Freed port ${port} (PID ${pid})`);
      }
    }
  } catch {
    // port not in use — continue
  }
}
