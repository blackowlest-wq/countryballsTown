import { describe, expect, it } from "vitest";
import {
  getDailyPopularProduct,
  getProductDemandFactors,
  getProductSalePriceForVisitor,
  selectDemandProduct,
} from "../../src/game/systems/ProductDemandSystem";

const menu = ["bread", "hot-dog", "croissant"] as const;
const testDate = new Date(2025, 0, 15, 12, 0, 0).getTime();

describe("ProductDemandSystem", () => {
  it("ローカル日付とメニューから日替わり人気商品を決定論的に導出する", () => {
    const popular = getDailyPopularProduct(menu, testDate);

    expect(popular).toBe(getDailyPopularProduct([...menu].reverse(), testDate));
    expect(menu).toContain(popular);
    expect(getDailyPopularProduct(menu, testDate + 24 * 60 * 60 * 1000)).toBeDefined();
  });

  it("国の好物と日替わり人気は選択weightだけに反映し、価格は固定する", () => {
    const factors = getProductDemandFactors("bread", "poland", testDate, ["bread"]);

    expect(factors).toEqual({
      isFavorite: true,
      isDailyPopular: true,
      weight: 5,
      salePrice: 3,
    });
    expect(getProductSalePriceForVisitor("bread", "poland", testDate, ["bread"])).toBe(3);
  });

  it("在庫の候補だけを選びつつ、人気判定は店舗メニューを基準にする", () => {
    const popular = getDailyPopularProduct(menu, testDate);
    const stocked = menu.filter((productType) => productType !== popular);
    const selected = selectDemandProduct(stocked, "poland", testDate, () => 0, menu);

    expect(selected).toBe(stocked[0]);
    if (selected === null) throw new Error("A stocked product should be selected.");
    expect(getProductDemandFactors(selected, "poland", testDate, menu).isDailyPopular)
      .toBe(false);
  });

  it("候補が空なら商品を選択しない", () => {
    expect(selectDemandProduct([], "poland", testDate, () => 0)).toBeNull();
    expect(getDailyPopularProduct([], testDate)).toBeNull();
  });
});
