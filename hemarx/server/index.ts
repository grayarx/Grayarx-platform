import express from "express";
import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { buildBook, outlineToMarkdown } from "./architect";
import { buildDailyBrief } from "./brief";
import { buildCurriculum, inferStruggles, toCsv } from "./curriculum";
import { gradeMirror } from "./mirror";
import { DEFAULT_STRUGGLES, INTERVIEW_QUESTIONS, LEARNER, STRUGGLE_LABELS } from "./profile";
import { SOURCES } from "./sources";
import { loadState, saveState } from "./store";
import type { InterviewAnswer, Struggle } from "./types";
import viteConfig from "../vite.config";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.HEMARX_PORT || 5050);

function ensureCurriculum() {
  const state = loadState();
  if (!state.curriculum.length) {
    state.struggles = inferStruggles(state.interview, state.struggles);
    state.curriculum = buildCurriculum(state.struggles, state.interview);
    saveState(state);
  }
  return state;
}

async function main() {
  ensureCurriculum();
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/bootstrap", (_req, res) => {
    const state = ensureCurriculum();
    res.json({
      learner: LEARNER,
      struggleLabels: STRUGGLE_LABELS,
      interview: state.interview,
      struggles: state.struggles,
      curriculum: state.curriculum,
      sources: SOURCES,
      latestBrief: state.briefs[0] ?? null,
    });
  });

  app.post("/api/interview", (req, res) => {
    const interview = Array.isArray(req.body?.interview) ? (req.body.interview as InterviewAnswer[]) : INTERVIEW_QUESTIONS;
    const selected = Array.isArray(req.body?.struggles) ? (req.body.struggles as Struggle[]) : DEFAULT_STRUGGLES;
    const struggles = inferStruggles(interview, selected);
    const curriculum = buildCurriculum(struggles, interview);
    const state = loadState();
    state.interview = interview;
    state.struggles = struggles;
    state.curriculum = curriculum;
    saveState(state);
    res.json({ interview, struggles, curriculum });
  });

  app.get("/api/curriculum.csv", (_req, res) => {
    const state = ensureCurriculum();
    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader("content-disposition", "attachment; filename=hemarx-curriculum.csv");
    res.send(toCsv(state.curriculum));
  });

  app.post("/api/brief", async (req, res) => {
    try {
      const brief = await buildDailyBrief(Boolean(req.body?.force));
      res.json(brief);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/mirror", async (req, res) => {
    const material = String(req.body?.material ?? "");
    const explanation = String(req.body?.explanation ?? "");
    if (material.trim().length < 40 || explanation.trim().length < 20) {
      res.status(400).json({ error: "Paste the material and your explanation first." });
      return;
    }
    const grade = await gradeMirror(material, explanation);
    res.json(grade);
  });

  app.post("/api/architect", async (req, res) => {
    const person = String(req.body?.person ?? "").trim();
    if (person.length < 2) {
      res.status(400).json({ error: "Name a public figure with a real body of work." });
      return;
    }
    try {
      const outline = await buildBook(person);
      res.json({ outline, markdown: outlineToMarkdown(outline) });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  const httpServer = createServer(app);
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: { middlewareMode: true, hmr: { server: httpServer }, allowedHosts: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
  app.use(async (req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) return next();
    try {
      const templatePath = path.join(root, "client", "index.html");
      let template = await fs.promises.readFile(templatePath, "utf8");
      const page = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (err) {
      vite.ssrFixStacktrace(err as Error);
      next(err);
    }
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Hemarx private study on http://127.0.0.1:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
