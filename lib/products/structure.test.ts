import { describe, expect, it } from "vitest";
import { parseSize, parseStructure, type StructureInput } from "./structure";
import { variationKey } from "./variation";

const units = ["ml", "L", "g", "kg", "count"];
const attr = (name: string, value: string) => ({ name, value });
const pack = (size: string, unit: string) => ({ size, unit });
const parse = (input: StructureInput) => parseStructure(input, units);
const error = (input: StructureInput) => {
  const result = parse(input);
  return result.ok ? null : result.error;
};

describe("parseSize", () => {
  it("accepts numbers, full-width digits and commas", () => {
    expect(parseSize("500")).toBe(500);
    expect(parseSize("１，５００")).toBe(1500);
    expect(parseSize("0.5")).toBe(0.5);
    expect(parseSize(".5")).toBe(0.5);
  });

  it("refuses zero, text, negatives and huge numbers", () => {
    for (const raw of ["", "0", "abc", "-1", "1e3", "1000001"]) {
      expect(parseSize(raw)).toBeNull();
    }
  });
});

describe("parseStructure", () => {
  it("accepts nothing at all", () => {
    expect(parse({ variations: [], loose: [] })).toEqual({
      ok: true,
      variations: [],
      loose: [],
    });
  });

  it("reads one 容量 without a variation and ignores empty rows", () => {
    expect(
      parse({
        variations: [{ attributes: [attr("", "")], packages: [pack("", "")] }],
        loose: [pack("５００", "ml"), pack("", "")],
      }),
    ).toEqual({
      ok: true,
      variations: [],
      loose: [{ size: 500, unit: "ml" }],
    });
  });

  it("reads a variation with two attribute rows and one 容量", () => {
    const attributes = [attr("サイズ", "M"), attr("色", "赤")];
    const result = parse({
      variations: [{ attributes, packages: [pack("1", "count")] }],
      loose: [],
    });
    expect(result).toEqual({
      ok: true,
      variations: [
        {
          attributes,
          key: variationKey(attributes),
          packages: [{ size: 1, unit: "count" }],
        },
      ],
      loose: [],
    });
  });

  it("allows a variation without any 容量", () => {
    const result = parse({
      variations: [{ attributes: [attr("味", "塩")], packages: [] }],
      loose: [],
    });
    expect(result.ok).toBe(true);
  });

  it("refuses a half-filled 容量 row", () => {
    expect(error({ variations: [], loose: [pack("500", "")] })).toBe(
      "単位を選んでください",
    );
    expect(error({ variations: [], loose: [pack("", "ml")] })).toBe(
      "容量を入力してください",
    );
    expect(error({ variations: [], loose: [pack("abc", "ml")] })).toBe(
      "容量は0より大きい数値で入力してください",
    );
  });

  it("refuses a unit that is not allowed", () => {
    expect(error({ variations: [], loose: [pack("5", "本")] })).toBe(
      "単位を選んでください",
    );
  });

  it("refuses a half-filled attribute row", () => {
    expect(
      error({
        variations: [{ attributes: [attr("サイズ", "")], packages: [] }],
        loose: [],
      }),
    ).toBe("バリエーションの名前と値は両方入力してください");
  });

  it("refuses a 容量 under a variation without attributes, but skips an empty group", () => {
    expect(
      error({
        variations: [{ attributes: [], packages: [pack("1", "count")] }],
        loose: [],
      }),
    ).toBe("バリエーションの名前と値を入力してください");
    expect(
      parse({ variations: [{ attributes: [], packages: [] }], loose: [] }).ok,
    ).toBe(true);
  });

  it("refuses a repeated attribute name", () => {
    expect(
      error({
        variations: [
          {
            attributes: [attr("サイズ", "M"), attr("サイズ", "L")],
            packages: [],
          },
        ],
        loose: [],
      }),
    ).toBe("同じ名前の属性が重複しています：サイズ");
  });

  it("refuses the same variation twice, whatever the row order", () => {
    expect(
      error({
        variations: [
          {
            attributes: [attr("サイズ", "M"), attr("色", "赤")],
            packages: [],
          },
          {
            attributes: [attr("色", "赤"), attr("サイズ", "m")],
            packages: [],
          },
        ],
        loose: [],
      }),
    ).toBe("同じバリエーションが重複しています");
  });

  it("refuses the same 容量 twice in one group", () => {
    expect(
      error({
        variations: [],
        loose: [pack("500", "ml"), pack("500", "ml")],
      }),
    ).toBe("同じ容量が重複しています");
  });

  it("refuses loose 容量 next to variations", () => {
    expect(
      error({
        variations: [{ attributes: [attr("味", "塩")], packages: [] }],
        loose: [pack("500", "ml")],
      }),
    ).toBe(
      "バリエーションがある商品では、容量はバリエーションごとに入力してください",
    );
  });

  it("enforces the limits", () => {
    const six = Array.from({ length: 6 }, (_, i) => ({
      attributes: [attr("番号", String(i))],
      packages: [],
    }));
    expect(error({ variations: six, loose: [] })).toBe(
      "バリエーションは5個までです",
    );

    const nine = Array.from({ length: 9 }, (_, i) => attr(`名${i}`, "値"));
    expect(
      error({ variations: [{ attributes: nine, packages: [] }], loose: [] }),
    ).toBe("属性は8個までです");

    const long = "あ".repeat(31);
    expect(
      error({
        variations: [{ attributes: [attr("名", long)], packages: [] }],
        loose: [],
      }),
    ).toBe("名前と値は30文字以内で入力してください");

    const seven = Array.from({ length: 7 }, (_, i) => pack(String(i + 1), "g"));
    expect(error({ variations: [], loose: seven })).toBe("容量は6個までです");
  });
});
