
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { PizzaShopPanel } from "../../src/ui/PizzaShopPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    pizzaShopPanelBuildingId: null,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("PizzaShopPanel", () => {
  it("ピザを選び、数量と消費材料を確認して作成できる", async () => {
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        buildings: [{ id: "pizza-shop-test", buildingId: "pizza-shop", gridX: 8, gridY: 8 }],
        bacon: 2,
        cheese: 2,
        tomatoes: 2,
        wheatFlour: 4,
      },
      pizzaShopPanelBuildingId: "pizza-shop-test",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(PizzaShopPanel)));
    expect(container.textContent).toContain("ピザ屋");
    expect(container.querySelector('[data-product="pizza"]')).not.toBeNull();
    expect(container.textContent).toContain("ベーコン");
    expect(container.textContent).toContain("チーズ");
    expect(container.textContent).toContain("トマト");
    expect(container.textContent).toContain("小麦粉");

    await act(async () => {
      container.querySelector<HTMLButtonElement>(".pizza-shop-panel .full-button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.textContent).toContain("この材料で作る");

    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("この材料で作る"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().game).toMatchObject({
      bacon: 1,
      cheese: 1,
      tomatoes: 1,
      wheatFlour: 2,
      pizzas: 1,
    });
    await act(async () => root.unmount());
  });

  it("10個ボタンを押すたびにピザの生産数を10枚ずつ増やせる", async () => {
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        buildings: [{ id: "pizza-shop-test", buildingId: "pizza-shop", gridX: 8, gridY: 8 }],
        bacon: 30,
        cheese: 30,
        tomatoes: 30,
        wheatFlour: 60,
      },
      pizzaShopPanelBuildingId: "pizza-shop-test",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(PizzaShopPanel)));
    const tenButton = [...container.querySelectorAll("button")]
      .find((button) => button.textContent?.includes("＋10個"));
    expect(tenButton).not.toBeUndefined();

    await act(async () => {
      tenButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector<HTMLInputElement>('input[aria-label="ピザの生産数"]')?.value)
      .toBe("11");

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[aria-label="ピザを10枚増やす"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector<HTMLInputElement>('input[aria-label="ピザの生産数"]')?.value)
      .toBe("21");
    expect(container.querySelector(".pizza-recipe-heading")?.textContent).toContain("21枚分");
    await act(async () => root.unmount());
  });
});
