import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_STRUGGLES, INTERVIEW_QUESTIONS } from "./profile";
import type { DailyBrief, StudioState } from "./types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDir = path.join(root, "data", "runtime");
const statePath = path.join(runtimeDir, "state.json");

function emptyState(): StudioState {
  return {
    interview: INTERVIEW_QUESTIONS.map((q) => ({ ...q })),
    struggles: [...DEFAULT_STRUGGLES],
    curriculum: [],
    seenUrls: [],
    briefs: [],
  };
}

export function loadState(): StudioState {
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    const parsed = JSON.parse(raw) as StudioState;
    return {
      ...emptyState(),
      ...parsed,
      interview: parsed.interview?.length ? parsed.interview : emptyState().interview,
      struggles: parsed.struggles?.length ? parsed.struggles : emptyState().struggles,
      curriculum: parsed.curriculum ?? [],
      seenUrls: parsed.seenUrls ?? [],
      briefs: parsed.briefs ?? [],
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: StudioState): void {
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

export function rememberUrls(urls: string[]): StudioState {
  const state = loadState();
  const set = new Set(state.seenUrls);
  for (const url of urls) set.add(url);
  state.seenUrls = [...set].slice(-4000);
  saveState(state);
  return state;
}

export function saveBrief(brief: DailyBrief): StudioState {
  const state = rememberUrls(brief.items.map((item) => item.url));
  state.briefs = [brief, ...state.briefs.filter((b) => b.date !== brief.date)].slice(0, 30);
  state.lastBriefAt = brief.generatedAt;
  saveState(state);
  return state;
}
