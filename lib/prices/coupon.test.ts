import { describe, it, expect } from "vitest";
import {
  bestCouponPercent,
  couponPrice,
  couponPercentsFromShop,
  bestDiscount,
  allDiscounts,
  effectivePrice,
} from "./coupon";

describe("bestCouponPercent", () => {
  it("returns the largest enabled percent", () => {
    expect(bestCouponPercent([5, 15, 10])).toBe(15);
    expect(bestCouponPercent([10])).toBe(10);
  });
  it("returns null when none is enabled", () => {
    expect(bestCouponPercent([])).toBeNull();
    expect(bestCouponPercent(null)).toBeNull();
    expect(bestCouponPercent(undefined)).toBeNull();
  });
  it("ignores percents that are not allowed", () => {
    expect(bestCouponPercent([20])).toBeNull();
    expect(bestCouponPercent([20, 5])).toBe(5);
  });
});

describe("couponPrice", () => {
  it("applies the percent and rounds down", () => {
    expect(couponPrice(198, 15)).toBe(168);
    expect(couponPrice(1000, 10)).toBe(900);
    expect(couponPrice(98.5, 5)).toBe(93);
  });
});

describe("couponPercentsFromShop", () => {
  it("reads the percents from either nested shape", () => {
    expect(couponPercentsFromShop({ store_chains: { coupon_percents: [10] } })).toEqual([10]);
    expect(couponPercentsFromShop({ store_chains: [{ coupon_percents: [5, 15] }] })).toEqual([5, 15]);
  });
  it("returns an empty list when there is nothing", () => {
    expect(couponPercentsFromShop(null)).toEqual([]);
    expect(couponPercentsFromShop({ store_chains: null })).toEqual([]);
  });
});

describe("bestDiscount", () => {
  it("returns null when there is no discount", () => {
    expect(bestDiscount(null, null)).toBeNull();
    expect(bestDiscount([], undefined)).toBeNull();
    expect(bestDiscount([], 0)).toBeNull();
  });
  it("prefers the larger percent", () => {
    expect(bestDiscount([10], 3)).toEqual({ kind: "coupon", percent: 10 });
    expect(bestDiscount([5], 8)).toEqual({ kind: "member", percent: 8 });
  });
  it("prefers the coupon on a tie", () => {
    expect(bestDiscount([5], 5)).toEqual({ kind: "coupon", percent: 5 });
  });
  it("uses membership alone", () => {
    expect(bestDiscount([], 3)).toEqual({ kind: "member", percent: 3 });
  });
});

describe("allDiscounts", () => {
  it("lists every coupon, smallest first", () => {
    expect(allDiscounts([15, 5, 10], null)).toEqual([
      { kind: "coupon", percent: 5 },
      { kind: "coupon", percent: 10 },
      { kind: "coupon", percent: 15 },
    ]);
  });
  it("puts the membership percent in order", () => {
    expect(allDiscounts([5, 10], 8)).toEqual([
      { kind: "coupon", percent: 5 },
      { kind: "member", percent: 8 },
      { kind: "coupon", percent: 10 },
    ]);
  });
  it("skips a membership percent that equals a coupon percent", () => {
    expect(allDiscounts([5], 5)).toEqual([{ kind: "coupon", percent: 5 }]);
  });
  it("ignores unknown coupon percents, repeats and empty values", () => {
    expect(allDiscounts([20, 5, 5], 0)).toEqual([{ kind: "coupon", percent: 5 }]);
    expect(allDiscounts(null, null)).toEqual([]);
    expect(allDiscounts([], undefined)).toEqual([]);
  });
  it("ends with the same discount as bestDiscount", () => {
    for (const [coupons, member] of [[[5, 10], 8], [[5], 8], [[15, 10], 3], [[], 3]] as const) {
      const list = allDiscounts(coupons, member);
      expect(list[list.length - 1]).toEqual(bestDiscount(coupons, member));
    }
  });
});

describe("effectivePrice", () => {
  it("returns the price when there is no discount", () => {
    expect(effectivePrice(1000, {})).toBe(1000);
  });
  it("applies membership", () => {
    expect(effectivePrice(1000, { memberPercent: 3 })).toBe(970);
  });
  it("applies only the larger discount", () => {
    expect(effectivePrice(1000, { couponPercents: [15], memberPercent: 3 })).toBe(850);
  });
  it("leaves a price that is already the membership price", () => {
    expect(effectivePrice(1000, { memberPercent: 3, isMemberPrice: true })).toBe(1000);
  });
});