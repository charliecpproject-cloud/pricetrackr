import { describe, expect, it } from "vitest";
import {
  VARIATION_AND_CHOICE_ERROR,
  parseNewVariation,
  variationInsertMessage,
} from "./newVariation";

const base = {
  size: "500",
  unit: "ml",
  allowedUnits: ["ml", "g", "count"],
  selectedVariationId: null,
};

describe("parseNewVariation", () => {
  it("gives no variation when every row is empty", () => {
    expect(
      parseNewVariation({ ...base, names: ["", " "], values: ["", ""] }),
    ).toEqual({ ok: true, variation: null });
    expect(parseNewVariation({ ...base, names: [], values: [] })).toEqual({
      ok: true,
      variation: null,
    });
  });

  it("reads the filled rows and skips the empty ones", () => {
    const result = parseNewVariation({
      ...base,
      names: ["サイズ", "色", ""],
      values: ["M", "赤", ""],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.variation?.attributes).toEqual([
        { name: "サイズ", value: "M" },
        { name: "色", value: "赤" },
      ]);
      expect(result.variation?.packages).toEqual([{ size: 500, unit: "ml" }]);
    }
  });

  it("refuses a half-filled row", () => {
    expect(
      parseNewVariation({ ...base, names: ["サイズ"], values: [""] }),
    ).toEqual({
      ok: false,
      error: "バリエーションの名前と値は両方入力してください",
    });
  });

  it("refuses a typed variation next to a chosen one", () => {
    expect(
      parseNewVariation({
        ...base,
        names: ["サイズ"],
        values: ["M"],
        selectedVariationId: "v1",
      }),
    ).toEqual({ ok: false, error: VARIATION_AND_CHOICE_ERROR });
  });

  it("ignores values that are not text", () => {
    expect(
      parseNewVariation({ ...base, names: [new Blob([])], values: [null] }),
    ).toEqual({ ok: true, variation: null });
  });

  it("passes on a unit that is not allowed", () => {
    expect(
      parseNewVariation({
        ...base,
        unit: "本",
        names: ["味"],
        values: ["塩"],
      }),
    ).toEqual({ ok: false, error: "単位を選んでください" });
  });
});

describe("variationInsertMessage", () => {
  it("names a duplicate, and says the product was saved when it was", () => {
    expect(variationInsertMessage("23505", false)).toBe(
      "同じバリエーションがすでに登録されています",
    );
    expect(variationInsertMessage("XX", true)).toContain("商品は追加しました");
    expect(variationInsertMessage(undefined, false)).toBe(
      "バリエーションを追加できませんでした",
    );
  });
});
