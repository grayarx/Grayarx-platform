import { describe, expect, it } from "vitest";
import {
  AGENT_LIST,
  DEALER_AGENT_LIST,
  FOUNDER_OPS_AGENT_LIST,
  PILOT_AGENT_LIST,
} from "./agents";

describe("agent audiences", () => {
  it("keeps Themba on the founder roster and off the dealer list", () => {
    expect(FOUNDER_OPS_AGENT_LIST.some((a) => a.id === "calling")).toBe(true);
    expect(DEALER_AGENT_LIST.some((a) => a.id === "calling")).toBe(false);
    expect(PILOT_AGENT_LIST.some((a) => a.id === "calling")).toBe(false);
    expect(AGENT_LIST.some((a) => a.id === "calling")).toBe(true);
  });

  it("describes Themba as GrayArx sales, not a dealer add-on", () => {
    const themba = AGENT_LIST.find((a) => a.id === "calling");
    expect(themba?.audience).toBe("founder");
    expect(themba?.description).toMatch(/Founder-only/i);
    expect(themba?.description).toMatch(/never get Themba/i);
    expect(themba?.description).not.toMatch(/opt in/i);
  });

  it("describes Lerato as pencilling slots rather than auto-confirming", () => {
    const lerato = AGENT_LIST.find((a) => a.id === "booking");
    expect(lerato?.displayName).toBe("Lerato");
    expect(lerato?.audience).toBe("dealer");
    expect(lerato?.description).toMatch(/Pencils/i);
    expect(lerato?.description).not.toMatch(/confirms appointments/i);
  });
});
