import express from "express";
import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { answerAsk, ensureCurriculumAsk, interviewComplete, pendingPayload } from "./ask";
import { buildBook, outlineToMarkdown } from "./architect";
import { buildDailyBrief } from "./brief";
import { buildCurriculum, inferStruggles, toCsv } from "./curriculum";
import { gradeMirror } from "./mirror";
import { LEARNER, STRUGGLE_LABELS } from "./profile";
import { isAmbiguous, wikipediaCandidates } from "./research";
import { SOURCES } from "./sources";
import { loadState, saveState } from "./store";
import type { AskQuestion, InterviewAnswer, Struggle } from "./types";
import viteConfig from "../vite.config";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.HEMARX_PORT || 5050);

function studioSnapshot() {
  const state = loadState();
  const pending = pendingPayload();
  const complete = interviewComplete(state.interview);
  if (complete && !state.curriculum.length) {
    state.struggles = inferStruggles(state.interview, state.struggles);
    state.curriculum = buildCurriculum(state.struggles, state.interview);
    saveState(state);
  }
  return {
    learner: LEARNER,
    struggleLabels: STRUGGLE_LABELS,
    interview: state.interview,
    struggles: state.struggles,
    curriculum: complete ? state.curriculum : [],
    sources: SOURCES,
    latestBrief: state.briefs[0] ?? null,
    interviewComplete: complete,
    pendingAsk: pending,
  };
}

async function main() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/bootstrap", (_req, res) => {
    res.json(studioSnapshot());
  });

  app.post("/api/ask/start", (req, res) => {
    const tool = req.body?.tool === "architect" ? "architect" : "curriculum";
    if (tool === "curriculum") {
      const session = ensureCurriculumAsk();
      res.json(pendingPayload());
      return;
    }
    res.json(pendingPayload());
  });

  app.get("/api/ask/pending", (_req, res) => {
    res.json(pendingPayload());
  });

  app.post("/api/ask/answer", (req, res) => {
    try {
      const result = answerAsk({
        sessionId: String(req.body?.sessionId ?? ""),
        questionId: String(req.body?.questionId ?? ""),
        answer: req.body?.answer != null ? String(req.body.answer) : undefined,
        selected: Array.isArray(req.body?.selected) ? req.body.selected.map(String) : undefined,
      });
      const state = loadState();
      if (result.complete && result.session.tool === "curriculum") {
        state.struggles = inferStruggles(state.interview, state.struggles);
        state.curriculum = buildCurriculum(state.struggles, state.interview);
        saveState(state);
      }
      res.json({
        ...result,
        pending: pendingPayload(),
        interviewComplete: interviewComplete(loadState().interview),
        curriculum: loadState().curriculum,
      });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/interview", (req, res) => {
    const interview = Array.isArray(req.body?.interview) ? (req.body.interview as InterviewAnswer[]) : loadState().interview;
    const selected = Array.isArray(req.body?.struggles) ? (req.body.struggles as Struggle[]) : loadState().struggles;
    const struggles = inferStruggles(interview, selected);
    const state = loadState();
    state.interview = interview;
    state.struggles = struggles;
    if (interviewComplete(interview)) {
      state.curriculum = buildCurriculum(struggles, interview);
    } else {
      state.curriculum = [];
    }
    saveState(state);
    res.json({ interview, struggles, curriculum: state.curriculum, interviewComplete: interviewComplete(interview) });
  });

  app.get("/api/curriculum.csv", (_req, res) => {
    const state = loadState();
    if (!interviewComplete(state.interview)) {
      res.status(409).json({ error: "Answer the Ask User questions before the spreadsheet exists." });
      return;
    }
    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader("content-disposition", "attachment; filename=hemarx-curriculum.csv");
    res.send(toCsv(state.curriculum.length ? state.curriculum : buildCurriculum(state.struggles, state.interview)));
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
      const chosen = String(req.body?.choice ?? "").trim();
      if (!chosen) {
        const candidates = await wikipediaCandidates(person);
        if (isAmbiguous(candidates, person)) {
          const questions: AskQuestion[] = [
            {
              id: "which-person",
              prompt: `Which “${person}” should I outline? I will not guess.`,
              why: "Name collisions produce the wrong book. Pick the public body of work.",
              kind: "single",
              required: true,
              options: candidates.slice(0, 5).map((c) => ({
                id: c.title,
                label: c.title,
                description: c.snippet.slice(0, 180),
              })),
            },
          ];
          const { askUser } = await import("./ask");
          const session = askUser({
            tool: "architect",
            reason: `Ambiguous name: ${person}`,
            questions,
          });
          res.json({
            needsAsk: true,
            pending: pendingPayload(),
            session,
          });
          return;
        }
      }
      const outline = await buildBook(chosen || person);
      res.json({ outline, markdown: outlineToMarkdown(outline), needsAsk: false });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  const httpServer = createServer(app);
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: {
      middlewareMode: true,
      host: true,
      allowedHosts: true,
      hmr: { server: httpServer, overlay: false },
    },
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
