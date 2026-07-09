import { describe, it, expect } from "vitest";
import {
  classifyAgentRoute,
  detectsBookingIntent,
  detectsTradeInIntent,
  extractCustomerName,
} from "./agentIntentRouting";

describe("agentIntentRouting", () => {
  it("routes booking messages to Lerato", () => {
    expect(classifyAgentRoute({ message: "Can I book a test drive?", afterHours: false }).agent).toBe(
      "lerato",
    );
    expect(detectsBookingIntent("Ek wil 'n toetsrit bespreek")).toBe(true);
  });

  it("routes trade-in messages to Tumi", () => {
    expect(classifyAgentRoute({ message: "What's my trade-in value?", afterHours: false }).agent).toBe(
      "tumi",
    );
    expect(detectsTradeInIntent("Do you take part exchange?")).toBe(true);
  });

  it("routes after-hours general chat to Bongi", () => {
    expect(
      classifyAgentRoute({ message: "Hello, are you there?", afterHours: true }).agent,
    ).toBe("bongi");
  });

  it("keeps booking on Lerato even after hours", () => {
    expect(
      classifyAgentRoute({ message: "Test drive tomorrow please", afterHours: true }).agent,
    ).toBe("lerato");
  });

  it("routes in-hours general questions to Nala", () => {
    expect(classifyAgentRoute({ message: "What colour is it?", afterHours: false }).agent).toBe(
      "nala",
    );
  });

  it("extracts customer names", () => {
    expect(extractCustomerName("My name is Thandi, book test drive")).toBe("Thandi");
    expect(extractCustomerName("just hello")).toBeNull();
  });
});
