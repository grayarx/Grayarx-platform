import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(here, "../../drizzle/migrations/0077_prospect_research_attempts.sql");
const runnerPath = path.resolve(here, "../../scripts/apply-pending-migrations.mjs");
const railwayPath = path.resolve(here, "../../railway.toml");

describe("0077 prospect_research_attempts migration", () => {
  it("creates the table idempotently for TiDB/MySQL", () => {
    const sql = fs.readFileSync(sqlPath, "utf8");
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS `prospect_research_attempts`/i);
    expect(sql).toMatch(/`researchKey` varchar\(320\) NOT NULL/i);
    expect(sql).toMatch(/UNIQUE KEY `researchKey`/i);
    // DATETIME + explicit DEFAULT NULL avoids MySQL/TiDB
    // "Invalid default value for 'cooldownUntil'" on a second TIMESTAMP column.
    expect(sql).toMatch(/`lastAttemptAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP/i);
    expect(sql).toMatch(/`cooldownUntil` datetime NULL DEFAULT NULL/i);
  });

  it("is listed in apply-pending-migrations.mjs", () => {
    const src = fs.readFileSync(runnerPath, "utf8");
    expect(src).toContain("0077_prospect_research_attempts.sql");
  });

  it("keeps Railway healthcheck on the fast webhook health path", () => {
    const toml = fs.readFileSync(railwayPath, "utf8");
    expect(toml).toMatch(/healthcheckPath\s*=\s*"\/api\/webhooks\/health"/);
    expect(toml).toMatch(/healthcheckTimeout\s*=\s*120/);
  });
});
