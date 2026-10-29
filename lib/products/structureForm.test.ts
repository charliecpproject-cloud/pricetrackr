import { describe, expect, it } from "vitest";
import { readStructureForm, structureSaveMessage } from "./structureForm";

function form(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe("readStructureForm", () => {
  it("reads nothing from an empty form", () => {
    expect(readStructureForm(form([]))).toEqual({ variations: [], loose: [] });
  });

  it("pairs loose sizes and units in order", () => {
    expect(
      readStructureForm(
        form([
          ["st_loose_size", "500"],
          ["st_loose_unit", "ml"],
          ["st_loose_size", "1"],
          ["st_loose_unit", "L"],
        ]),
      ),
    ).toEqual({
      variations: [],
      loose: [
        { size: "500", unit: "ml" },
        { size: "1", unit: "L" },
      ],
    });
  });

  it("reads variation cards by slot and skips slots that are not there", () => {
    const result = readStructureForm(
      form([
        ["st_v3_attr_name", "味"],
        ["st_v3_attr_value", "塩"],
        ["st_v3_size", "100"],
        ["st_v3_unit", "g"],
        ["st_v0_attr_name", "サイズ"],
        ["st_v0_attr_value", "M"],
        ["st_v0_attr_name", ""],
        ["st_v0_attr_value", ""],
        ["st_v0_size", ""],
        ["st_v0_unit", ""],
      ]),
    );
    expect(result.variations).toEqual([
      {
        attributes: [
          { name: "サイズ", value: "M" },
          { name: "", value: "" },
        ],
        packages: [{ size: "", unit: "" }],
      },
      {
        attributes: [{ name: "味", value: "塩" }],
        packages: [{ size: "100", unit: "g" }],
      },
    ]);
  });

  it("treats a file or a missing partner as an empty text", () => {
    const data = new FormData();
    data.append("st_loose_size", new Blob(["x"]), "x.txt");
    data.append("st_loose_unit", "ml");
    data.append("st_loose_size", "5");
    expect(readStructureForm(data).loose).toEqual([
      { size: "", unit: "ml" },
      { size: "5", unit: "" },
    ]);
  });
});

describe("structureSaveMessage", () => {
  it("says what was saved", () => {
    expect(
      structureSaveMessage({ ok: false, stage: "variations", error: "x" }),
    ).toContain("商品は追加しました");
    expect(
      structureSaveMessage({ ok: false, stage: "packages", error: "x" }),
    ).toContain("商品とバリエーションは追加しました");
  });
});
