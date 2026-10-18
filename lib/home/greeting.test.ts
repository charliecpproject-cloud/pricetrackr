import { describe, expect, it } from "vitest";
import { greetingFor, greetingText } from "./greeting";

describe("greetingFor (Japan time)", () => {
  it("morning", () => {
    expect(greetingFor(new Date("2026-10-18T00:00:00Z"))).toBe("おはようございます"); // 09:00
  });

  it("daytime", () => {
    expect(greetingFor(new Date("2026-10-18T03:00:00Z"))).toBe("こんにちは"); // 12:00
  });

  it("evening", () => {
    expect(greetingFor(new Date("2026-10-18T10:00:00Z"))).toBe("こんばんは"); // 19:00
  });

  it("late night is still こんばんは, 5:00 is morning", () => {
    expect(greetingFor(new Date("2026-10-17T18:00:00Z"))).toBe("こんばんは"); // 03:00
    expect(greetingFor(new Date("2026-10-17T20:00:00Z"))).toBe("おはようございます"); // 05:00
  });
});

describe("greetingText", () => {
  const morning = new Date("2026-10-18T00:00:00Z");

  it("adds the name", () => {
    expect(greetingText("たろう", morning)).toBe("おはようございます、たろうさん");
  });

  it("uses only the greeting without a name", () => {
    expect(greetingText(null, morning)).toBe("おはようございます");
    expect(greetingText("   ", morning)).toBe("おはようございます");
  });
});