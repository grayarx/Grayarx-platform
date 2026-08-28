import { NextResponse } from "next/server";
import {
  advanceOnboarding,
  getOnboardingGuides,
} from "@/lib/onboarding/wizard";
import type { OnboardStepId } from "@/lib/onboarding/wizard";

export async function GET(request: Request) {
  const dealershipId =
    new URL(request.url).searchParams.get("dealershipId") || "demo-yard";
  return NextResponse.json(getOnboardingGuides(dealershipId));
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    dealershipId?: string;
    step?: OnboardStepId;
    name?: string;
    modules?: Record<string, boolean>;
  };
  const dealershipId = body.dealershipId || "demo-yard";
  if (!body.step) {
    return NextResponse.json({ error: "step required" }, { status: 400 });
  }
  const state = advanceOnboarding(dealershipId, body.step, {
    name: body.name,
    modules: body.modules as Parameters<typeof advanceOnboarding>[2] extends {
      modules?: infer M;
    }
      ? M
      : never,
  });
  return NextResponse.json({
    ok: true,
    state,
    ...getOnboardingGuides(dealershipId),
  });
}
