import { describe, it, expect } from "vitest";
import { bestCouponPercent, couponPrice, couponPercentsFromShop } from "./coupon";

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