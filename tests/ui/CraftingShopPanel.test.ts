import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { getDailyPopularProduct } from "../../src/game/systems/ProductDemandSystem";
import { BAKERY_PRODUCT_TYPES } from "../../src/game/systems/BakerySystem";
import { useGameStore } from "../../src/store/gameStore";
import { BakeryPanel } from "../../src/ui/BakeryPanel";
import { withInventory } from "../inventoryFixture";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  vi.restoreAllMocks();
  useGameStore.setState({
    game: createInitialGameState(0),
    bakeryPanelBuildingId: null,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("CraftingShopPanel", () => {
  it("商品価格・好物・日替わり人気を表示し、新規料理を選択できる", async () => {
    const now = new Date(2025, 0, 15, 12, 0, 0).getTime();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const bakery = { id: "bakery-crafting-ui-test", buildingId: "bakery", gridX: 8, gridY: 8 } as const;
    useGameStore.setState({
      game: withInventory({ ...createInitialGameState(0), buildings: [bakery] }, {
        "wheat-flour": 1,
        cheese: 1,
      }),
      bakeryPanelBuildingId: bakery.id,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BakeryPanel)));
    const popularProduct = getDailyPopularProduct(BAKERY_PRODUCT_TYPES, now);
    expect(container.querySelector('[data-product="cheese-bread"]')).not.toBeNull();
    expect(container.querySelector('[data-product="cheese-bread"]')?.textContent)
      .toContain("💰 5コイン");
    expect(container.querySelector('[data-product="cheese-bread"]')?.textContent).toContain("好物");
    expect(container.querySelectorAll(".crafting-product-popular")).toHaveLength(1);
    expect(container.querySelector(`[data-product="${popularProduct}"] .crafting-product-popular`))
      .not.toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-product="cheese-bread"]')?.click();
    });
    expect(container.querySelector<HTMLInputElement>('input[aria-label="チーズパンの生産数"]'))
      .not.toBeNull();
    expect(container.textContent).toContain("チーズ");

    await act(async () => root.unmount());
  });
});
