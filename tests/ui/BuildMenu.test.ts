
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { buildingsById, playerBuildingIds } from "../../src/game/data/buildings";
import { useGameStore } from "../../src/store/gameStore";
import { BuildMenu } from "../../src/ui/BuildMenu";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    selectedDistrictId: "agriculture",
    isBuildMenuOpen: false,
  });
  document.body.replaceChildren();
});

describe("BuildMenu", () => {
  it("建築コストを整数に切り捨てて表示する", async () => {
    const originalCost = buildingsById.field.cost;
    buildingsById.field.cost = 10.9;
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        villageLevel: 3,
        unlockedBuildings: ["field"],
      },
      isBuildMenuOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await act(async () => root.render(createElement(BuildMenu)));
      const fieldButton = container.querySelector<HTMLButtonElement>(".building-option");
      expect(fieldButton?.querySelector(".building-cost")?.textContent).toContain("10");
      expect(fieldButton?.querySelector(".building-cost")?.textContent).not.toContain("10.9");
    } finally {
      await act(async () => root.unmount());
      buildingsById.field.cost = originalCost;
    }
  });

  it("鉱石工房はコインではなく必要な採掘素材を表示する", async () => {
    useGameStore.setState({
      game: createInitialGameState(0),
      selectedDistrictId: "common",
      isBuildMenuOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BuildMenu)));

    const workshop = container.querySelector<HTMLButtonElement>('[data-building-id="ore-workshop"]');
    expect(workshop).not.toBeNull();
    expect(workshop?.querySelector(".building-cost")?.textContent).toContain("🟤8");
    expect(workshop?.querySelector(".building-cost")?.textContent).toContain("⚙️5");
    expect(workshop?.querySelector(".building-cost")?.textContent).toContain("🔷3");
    expect(workshop?.querySelector('[aria-label="コイン 0"]')).toBeNull();
    expect(workshop?.querySelector('[aria-label="銅 8"]')).not.toBeNull();
    expect(workshop?.querySelector('[aria-label="鉄 5"]')).not.toBeNull();
    expect(workshop?.querySelector('[aria-label="水晶 3"]')).not.toBeNull();

    await act(async () => root.unmount());
  });

  it("地区を選ぶと関連する建築物だけを表示し、地区目標を確認できる", async () => {
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        unlockedBuildings: [...playerBuildingIds],
      },
      selectedDistrictId: "agriculture",
      isBuildMenuOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BuildMenu)));
    expect(container.textContent).toContain("畑");
    expect(container.textContent).toContain("パン屋");
    expect(container.textContent).toContain("倉庫");
    expect(container.textContent).toContain("畑 0/3");
    expect(container.textContent).toContain("倉庫 0/1");
    expect(container.textContent).not.toContain("ピザ屋");
    expect(container.querySelector('[data-district-id="agriculture"]')?.getAttribute("aria-selected"))
      .toBe("true");

    const commercialTab = container.querySelector<HTMLButtonElement>('[data-district-id="commercial"]');
    await act(async () => commercialTab?.click());
    expect(container.textContent).toContain("店舗3種類 0/3");
    expect(container.textContent).toContain("ピザ屋");
    expect(container.textContent).toContain("中華食堂");
    expect(container.textContent).not.toContain("パン屋");

    const natureTab = container.querySelector<HTMLButtonElement>('[data-district-id="nature-park"]');
    await act(async () => natureTab?.click());
    expect(container.textContent).toContain("木");
    expect(container.textContent).toContain("花");
    expect(container.textContent).not.toContain("ピザ屋");

    const buildingTab = [...container.querySelectorAll('[role="tab"]')]
      .find((tab) => tab.textContent?.includes("建物"));
    await act(async () => {
      buildingTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.textContent).toContain("温泉");
    expect(container.textContent).not.toContain("牛乳工場");

    const industrialTab = container.querySelector<HTMLButtonElement>('[data-district-id="industrial"]');
    await act(async () => industrialTab?.click());
    expect(container.textContent).toContain("工場3種類 0/3");
    expect(container.textContent).toContain("牛乳工場");
    expect(container.textContent).toContain("小麦工場");
    expect(container.textContent).not.toContain("温泉");

    await act(async () => root.unmount());
  });

  it("家畜が5頭いると家畜の建築ボタンを無効にする", async () => {
    const initial = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...initial,
        villageLevel: 3,
        unlockedBuildings: [...playerBuildingIds],
        buildings: [
          { id: "cow-1", buildingId: "cow", gridX: 1, gridY: 1 },
          { id: "pig-1", buildingId: "pig", gridX: 3, gridY: 1 },
          { id: "chicken-1", buildingId: "chicken", gridX: 5, gridY: 1 },
          { id: "cow-2", buildingId: "cow", gridX: 7, gridY: 1 },
          { id: "pig-2", buildingId: "pig", gridX: 9, gridY: 1 },
        ],
      },
      selectedDistrictId: "common",
      isBuildMenuOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BuildMenu)));
    const natureTab = [...container.querySelectorAll('.building-category-tab')]
      .find((tab) => tab.textContent?.includes("自然"));
    await act(async () => {
      natureTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("家畜: 5 / 5");
    for (const name of ["牛", "豚", "鶏"]) {
      const button = [...container.querySelectorAll("button")]
        .find((candidate) => candidate.textContent?.includes(name));
      expect(button).toBeDefined();
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }

    await act(async () => root.unmount());
  });
});
