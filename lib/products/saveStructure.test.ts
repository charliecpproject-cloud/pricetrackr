import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveStructure } from "./saveStructure";
import type { ParsedVariation } from "./structure";

type Client = Parameters<typeof saveStructure>[0];
type Call = { table: string; rows: Record<string, unknown>[] };

// Records every insert and answers with the rows plus a made-up id.
function fakeClient(failTable?: string, code = "XX") {
  const calls: Call[] = [];
  let n = 0;
  const client = {
    from(table: string) {
      return {
        insert(rows: Record<string, unknown>[]) {
          calls.push({ table, rows });
          return {
            select: async () => {
              if (table === failTable)
                return { data: null, error: { message: "failed", code } };
              const data = rows.map((row) => ({
                ...row,
                id: `${table}-${++n}`,
              }));
              return { data, error: null };
            },
          };
        },
      };
    },
  };
  return { client: client as unknown as Client, calls };
}

const variation = (
  key: string,
  packages: { size: number; unit: string }[],
): ParsedVariation => ({
  attributes: [{ name: "味", value: key }],
  key,
  packages,
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("saveStructure", () => {
  it("does nothing when there is nothing to save", async () => {
    const { client, calls } = fakeClient();
    const result = await saveStructure(client, "p1", {
      variations: [],
      loose: [],
    });
    expect(result).toEqual({ ok: true, firstPackageId: null });
    expect(calls).toHaveLength(0);
  });

  it("saves loose 容量 without a variation and returns the first", async () => {
    const { client, calls } = fakeClient();
    const result = await saveStructure(client, "p1", {
      variations: [],
      loose: [
        { size: 500, unit: "ml" },
        { size: 1, unit: "L" },
      ],
    });
    expect(result).toEqual({ ok: true, firstPackageId: "product_packages-1" });
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe("product_packages");
    expect(calls[0].rows.map((r) => r.variation_id)).toEqual([null, null]);
    expect(calls[0].rows.map((r) => r.package_unit)).toEqual(["ml", "L"]);
  });

  it("saves variations first, then every 容量 under the right variation", async () => {
    const { client, calls } = fakeClient();
    const result = await saveStructure(client, "p1", {
      variations: [
        variation("塩", [
          { size: 500, unit: "ml" },
          { size: 1, unit: "L" },
        ]),
        variation("醤油", [{ size: 500, unit: "ml" }]),
      ],
      loose: [],
    });
    expect(calls.map((c) => c.table)).toEqual([
      "product_variations",
      "product_packages",
    ]);
    // variations got the ids product_variations-1 and -2, the 容量 got -3, -4 and -5
    expect(calls[1].rows.map((r) => r.variation_id)).toEqual([
      "product_variations-1",
      "product_variations-1",
      "product_variations-2",
    ]);
    expect(result).toEqual({ ok: true, firstPackageId: "product_packages-3" });
  });

  it("saves a variation that has no 容量 and returns no package", async () => {
    const { client, calls } = fakeClient();
    const result = await saveStructure(client, "p1", {
      variations: [variation("塩", [])],
      loose: [],
    });
    expect(result).toEqual({ ok: true, firstPackageId: null });
    expect(calls.map((c) => c.table)).toEqual(["product_variations"]);
  });

  it("stops after a failed variation insert", async () => {
    const { client, calls } = fakeClient("product_variations", "23505");
    const result = await saveStructure(client, "p1", {
      variations: [variation("塩", [{ size: 1, unit: "L" }])],
      loose: [],
    });
    expect(result).toEqual({
      ok: false,
      stage: "variations",
      error: "同じバリエーションがすでに登録されています",
    });
    expect(calls).toHaveLength(1);
  });

  it("reports a failed 容量 insert with its stage", async () => {
    const { client } = fakeClient("product_packages", "23503");
    const result = await saveStructure(client, "p1", {
      variations: [],
      loose: [{ size: 1, unit: "L" }],
    });
    expect(result).toEqual({
      ok: false,
      stage: "packages",
      error: "選んだバリエーションはこの商品のものではありません",
    });
  });
});
