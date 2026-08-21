import { create } from "zustand";
import { createBuildingCollection } from "../game/core/BuildingCollection";
import { createInitialGameState } from "../game/core/GameState";
import {
  getBuildingOperationMessage,
  moveBuilding,
  placeBuilding,
  removeBuilding,
} from "../game/systems/BuildingSystem";
import { advanceEconomy } from "../game/systems/EconomySystem";
import {
  collectCowMilk as collectMilkFromCow,
  normalizeCowProductions,
  type CowMilkOutcome,
} from "../game/systems/CowSystem";
import {
  collectPigPork as collectPorkFromPig,
  normalizePigProductions,
  type PigPorkOutcome,
} from "../game/systems/PigSystem";
import {
  collectChickenEggs as collectEggsFromChicken,
  normalizeChickenProductions,
  type ChickenEggOutcome,
} from "../game/systems/ChickenSystem";
import {
  configureMilkFactory as configureFactory,
  advanceMilkFactoryProductions,
  getMilkFactoryProductName,
  normalizeMilkFactoryProductions,
} from "../game/systems/MilkFactorySystem";
import {
  advancePorkFactoryProductions,
  configurePorkFactory as configurePorkFactorySystem,
  getPorkFactoryProductName,
  normalizePorkFactoryProductions,
} from "../game/systems/PorkFactorySystem";
import { craftPizza as craftPizzaSystem } from "../game/systems/PizzaSystem";
import { advanceResidents } from "../game/systems/ResidentSystem";
import {
  advanceShopVisitors,
  createShopVisitorSimulation,
} from "../game/systems/ShopVisitorSystem";
import {
  advanceResidentRequest,
  describeResidentRequestEvent,
  maybeStartResidentRequest,
} from "../game/systems/ResidentRequestSystem";
import { describeProgressEvent, evaluateVillageProgress } from "../game/systems/VillageProgressSystem";
import { travelToMap as travelToMapSystem } from "../game/systems/MapSystem";
import { loadGameState, saveGameState } from "../game/systems/SaveSystem";
import {
  getCropName,
  performCropAction,
  type CropActionOutcome,
} from "../game/systems/CropSystem";
import type { BuildingInstance } from "../game/types/Building";
import type { CropType } from "../game/types/Crop";
import type { MilkFactoryProductType } from "../game/types/MilkFactory";
import type { PorkFactoryProductType } from "../game/types/PorkFactory";
import type { ShopVisitorSimulation } from "../game/types/ShopVisitor";
import type { MapId } from "../game/types/Map";
import type { GameState } from "../game/types/Village";

export type InteractionMode = "inspect" | "build" | "move" | "farm";

interface GameStore {
  game: GameState;
  economyRemainderMs: number;
  visitorSimulation: ShopVisitorSimulation;
  interactionMode: InteractionMode;
  selectedCropType: CropType;
  selectedBuildingId: string | null;
  milkFactoryPanelBuildingId: string | null;
  porkFactoryPanelBuildingId: string | null;
  pizzaShopPanelBuildingId: string | null;
  selectedResidentId: string | null;
  isBuildMenuOpen: boolean;
  isResidentPanelOpen: boolean;
  notice: string | null;
  tick: (deltaMs: number, now: number) => void;
  setBuildMenuOpen: (open: boolean) => void;
  setResidentPanelOpen: (open: boolean) => void;
  travelToMap: (mapId: MapId, now?: number) => void;
  beginBuild: (buildingId: string) => void;
  beginMove: (buildingId: string) => void;
  beginFarming: () => void;
  selectCropType: (cropType: CropType) => void;
  cancelInteraction: () => void;
  interactCrop: (
    gridX: number,
    gridY: number,
    now?: number,
  ) => CropActionOutcome | null;
  harvestCrop: (
    gridX: number,
    gridY: number,
    now?: number,
  ) => CropActionOutcome | null;
  placeSelectedBuilding: (gridX: number, gridY: number) => boolean;
  moveSelectedBuilding: (gridX: number, gridY: number) => boolean;
  removeSelectedBuilding: () => boolean;
  collectCowMilk: (buildingInstanceId: string, now?: number) => CowMilkOutcome | null;
  collectPigPork: (buildingInstanceId: string, now?: number) => PigPorkOutcome | null;
  collectChickenEggs: (buildingInstanceId: string, now?: number) => ChickenEggOutcome | null;
  openMilkFactoryPanel: (buildingInstanceId: string) => void;
  closeMilkFactoryPanel: () => void;
  configureMilkFactory: (
    buildingInstanceId: string,
    productType: MilkFactoryProductType,
    now?: number,
  ) => boolean;
  openPorkFactoryPanel: (buildingInstanceId: string) => void;
  closePorkFactoryPanel: () => void;
  configurePorkFactory: (
    buildingInstanceId: string,
    productType: PorkFactoryProductType,
    now?: number,
  ) => boolean;
  openPizzaShopPanel: (buildingInstanceId: string) => void;
  closePizzaShopPanel: () => void;
  craftPizza: (buildingInstanceId: string, quantity: number) => boolean;
  selectBuilding: (building: BuildingInstance | null) => void;
  selectResident: (residentId: string | null) => void;
  save: () => void;
  dismissNotice: () => void;
  resetForDevelopment: () => void;
}

function normalizeGameState(state: GameState): GameState {
  const buildings = createBuildingCollection(state.buildings).buildings;
  const cowProductions = normalizeCowProductions(
    state.cowProductions,
    buildings,
    Date.now(),
  );
  const milkFactoryProductions = normalizeMilkFactoryProductions(
    state.milkFactoryProductions,
    buildings,
    Date.now(),
  );
  const pigProductions = normalizePigProductions(
    state.pigProductions,
    buildings,
    Date.now(),
  );
  const chickenProductions = normalizeChickenProductions(
    state.chickenProductions,
    buildings,
    Date.now(),
  );
  const porkFactoryProductions = normalizePorkFactoryProductions(
    state.porkFactoryProductions,
    buildings,
    Date.now(),
  );
  return buildings === state.buildings &&
    cowProductions === state.cowProductions &&
    milkFactoryProductions === state.milkFactoryProductions &&
    pigProductions === state.pigProductions &&
    chickenProductions === state.chickenProductions &&
    porkFactoryProductions === state.porkFactoryProductions
    ? state
    : {
      ...state,
      buildings,
      cowProductions,
      milkFactoryProductions,
      pigProductions,
      chickenProductions,
      porkFactoryProductions,
    };
}

function persist(state: GameState): GameState {
  const normalized = normalizeGameState(state);
  const saved = { ...normalized, lastSavedAt: Date.now() };
  saveGameState(saved);
  return saved;
}

function withProgress(state: GameState): { game: GameState; notice: string | null } {
  const progress = evaluateVillageProgress(state);
  const notice = progress.events.map(describeProgressEvent).join(" ") || null;
  return { game: progress.state, notice };
}

function combineNotices(...notices: Array<string | null>): string | null {
  return notices.filter((notice): notice is string => Boolean(notice)).join(" ") || null;
}

export const useGameStore = create<GameStore>((setState, get) => {
  const set = (update: Partial<GameStore>): void => {
    setState(update.game ? { ...update, game: normalizeGameState(update.game) } : update);
  };

  return {
  game: loadGameState(),
  economyRemainderMs: 0,
  visitorSimulation: createShopVisitorSimulation(),
  interactionMode: "inspect",
  selectedCropType: "wheat",
  selectedBuildingId: null,
  milkFactoryPanelBuildingId: null,
  porkFactoryPanelBuildingId: null,
  pizzaShopPanelBuildingId: null,
  selectedResidentId: null,
  isBuildMenuOpen: false,
  isResidentPanelOpen: false,
  notice: null,

  tick: (deltaMs, now) => {
    const current = get();
    const milkFactory = advanceMilkFactoryProductions(current.game, now);
    const factory = advancePorkFactoryProductions(milkFactory, now);
    const economy = advanceEconomy(factory, deltaMs, current.economyRemainderMs);
    const visitorResult = advanceShopVisitors(
      economy.state,
      current.visitorSimulation,
      deltaMs,
      now,
    );
    const withVisitorSales = visitorResult.coinsEarned === 0 && visitorResult.pizzasSold === 0
      ? economy.state
      : {
        ...economy.state,
        coins: economy.state.coins + visitorResult.coinsEarned,
        pizzas: Math.max(0, economy.state.pizzas - visitorResult.pizzasSold),
      };
    const withResidents = advanceResidents(withVisitorSales, deltaMs, now);
    const progress = withProgress(withResidents);
    const requestProgress = advanceResidentRequest(
      progress.game,
      { type: "coins-earned", amount: economy.coinsEarned + visitorResult.coinsEarned },
      now,
    );
    const requestStart = maybeStartResidentRequest(requestProgress.state, now);
    const requestEvent = requestProgress.event ?? requestStart.event;
    const requestNotice = requestEvent ? describeResidentRequestEvent(requestEvent) : null;
    const nextNotice = combineNotices(progress.notice, requestNotice);
    const nextGame = nextNotice || factory !== current.game || visitorResult.pizzasSold > 0
      ? persist(requestStart.state)
      : requestStart.state;
    set({
      game: nextGame,
      economyRemainderMs: economy.remainderMs,
      visitorSimulation: visitorResult.simulation,
      notice: nextNotice ?? current.notice,
    });
  },

  setBuildMenuOpen: (open) => set({ isBuildMenuOpen: open }),
  setResidentPanelOpen: (open) => set({ isResidentPanelOpen: open }),

  travelToMap: (mapId, now = Date.now()) => {
    const current = get();
    const game = travelToMapSystem(current.game, mapId, now);
    if (game === current.game) return;
    set({
      game: persist(game),
      interactionMode: "inspect",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      selectedResidentId: null,
      notice: mapId === "sea-and-river" ? "海と川へ移動しました。" : "村へ戻りました。",
    });
  },

  beginBuild: (buildingId) =>
    set({
      interactionMode: "build",
      selectedBuildingId: buildingId,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      notice: null,
    }),

  beginMove: (buildingId) =>
    set({
      interactionMode: "move",
      selectedBuildingId: buildingId,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      isBuildMenuOpen: false,
      notice: "移動先のセルをクリックしてください。",
    }),

  beginFarming: () =>
    set({
      interactionMode: "farm",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      notice: "種を選んで畑をタップしてください。成熟した作物は村画面でタップすると収穫できます。",
    }),

  selectCropType: (cropType) => set({
    selectedCropType: cropType,
    notice: null,
  }),

  cancelInteraction: () =>
    set({
      interactionMode: "inspect",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      notice: null,
    }),

  interactCrop: (gridX, gridY, now = Date.now()) => {
    const current = get();
    if (current.interactionMode !== "farm") return null;
    const result = performCropAction(
      current.game,
      "plant",
      current.selectedCropType,
      gridX,
      gridY,
      now,
    );
    if (result.state === current.game) {
      if (result.outcome === "not-field") {
        set({ notice: "作物は畑の中にだけ植えられます。" });
      } else if (result.outcome === "no-seeds") {
        set({ notice: `${getCropName(current.selectedCropType)}の種がありません。収穫して種を増やしましょう。` });
      } else if (result.outcome === "growing" && result.cropType) {
        set({ notice: `${getCropName(result.cropType)}はまだ成長中です。` });
      }
      return result.outcome;
    }
    const harvestedCropName = result.cropType ? getCropName(result.cropType) : "作物";
    set({
      game: result.state,
      notice: result.outcome === "harvested"
        ? `${harvestedCropName}1個と、${harvestedCropName}の種2個を収穫しました！`
        : current.notice,
    });
    return result.outcome;
  },

  harvestCrop: (gridX, gridY, now = Date.now()) => {
    const current = get();
    if (current.interactionMode !== "inspect" && current.interactionMode !== "farm") return null;
    const result = performCropAction(
      current.game,
      "harvest",
      current.selectedCropType,
      gridX,
      gridY,
      now,
    );
    if (result.state === current.game) {
      if (result.outcome === "growing" && result.cropType) {
        set({ notice: `${getCropName(result.cropType)}はまだ成長中です。` });
      }
      return result.outcome;
    }
    const harvestedCropName = result.cropType ? getCropName(result.cropType) : "作物";
    set({
      game: persist(result.state),
      notice: result.outcome === "harvested"
        ? `${harvestedCropName}1個と、${harvestedCropName}の種2個を収穫しました！`
        : current.notice,
    });
    return result.outcome;
  },

  placeSelectedBuilding: (gridX, gridY) => {
    const current = get();
    if (current.interactionMode !== "build" || !current.selectedBuildingId) return false;
    const result = placeBuilding(current.game, current.selectedBuildingId, gridX, gridY);
    if (!result.success) {
      set({ notice: getBuildingOperationMessage(result.reason) });
      return false;
    }
    const progress = withProgress(result.state);
    const request = advanceResidentRequest(
      progress.game,
      { type: "building-placed", buildingId: current.selectedBuildingId },
      Date.now(),
    );
    const requestNotice = request.event ? describeResidentRequestEvent(request.event) : null;
    const saved = persist(request.state);
    set({
      game: saved,
      interactionMode: "inspect",
      selectedBuildingId: null,
      notice: combineNotices(progress.notice, requestNotice),
    });
    return true;
  },

  moveSelectedBuilding: (gridX, gridY) => {
    const current = get();
    if (current.interactionMode !== "move" || !current.selectedBuildingId) return false;
    const result = moveBuilding(current.game, current.selectedBuildingId, gridX, gridY);
    if (!result.success) {
      set({ notice: getBuildingOperationMessage(result.reason) });
      return false;
    }
    set({
      game: persist(result.state),
      interactionMode: "inspect",
      notice: "建物を移動しました。",
    });
    return true;
  },

  removeSelectedBuilding: () => {
    const current = get();
    if (!current.selectedBuildingId) return false;
    const result = removeBuilding(current.game, current.selectedBuildingId);
    if (!result.success) {
      set({ notice: getBuildingOperationMessage(result.reason) });
      return false;
    }
    set({
      game: persist(result.state),
      interactionMode: "inspect",
      selectedBuildingId: null,
      notice: "建物を撤去しました。",
    });
    return true;
  },

  collectCowMilk: (buildingInstanceId, now = Date.now()) => {
    const current = get();
    if (current.interactionMode !== "inspect") return null;
    const result = collectMilkFromCow(current.game, buildingInstanceId, now);
    if (result.state === current.game) return result.outcome;
    set({
      game: persist(result.state),
      selectedBuildingId: null,
      notice: "牛乳を2個しぼりました！",
    });
    return result.outcome;
  },

  collectPigPork: (buildingInstanceId, now = Date.now()) => {
    const current = get();
    if (current.interactionMode !== "inspect") return null;
    const result = collectPorkFromPig(current.game, buildingInstanceId, now);
    if (result.state === current.game) return result.outcome;
    set({
      game: persist(result.state),
      selectedBuildingId: null,
      notice: "豚肉を2個収穫しました！",
    });
    return result.outcome;
  },

  collectChickenEggs: (buildingInstanceId, now = Date.now()) => {
    const current = get();
    if (current.interactionMode !== "inspect") return null;
    const result = collectEggsFromChicken(current.game, buildingInstanceId, now);
    if (result.state === current.game) return result.outcome;
    set({
      game: persist(result.state),
      selectedBuildingId: null,
      notice: "卵を2個収穫しました！",
    });
    return result.outcome;
  },

  openMilkFactoryPanel: (buildingInstanceId) => {
    const current = get();
    if (!current.game.buildings.some(
      (building) => building.id === buildingInstanceId && building.buildingId === "milk-factory",
    )) return;
    set({
      interactionMode: "inspect",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: buildingInstanceId,
      porkFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      notice: null,
    });
  },

  closeMilkFactoryPanel: () => set({ milkFactoryPanelBuildingId: null }),

  configureMilkFactory: (buildingInstanceId, productType, now = Date.now()) => {
    const current = get();
    const result = configureFactory(current.game, buildingInstanceId, productType, now);
    if (result.outcome !== "configured") {
      set({ notice: "牛乳工場を設定できませんでした。" });
      return false;
    }
    set({
      game: persist(result.state),
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      notice: `${getMilkFactoryProductName(productType)}の生産を始めました！`,
    });
    return true;
  },

  openPorkFactoryPanel: (buildingInstanceId) => {
    const current = get();
    if (!current.game.buildings.some(
      (building) => building.id === buildingInstanceId && building.buildingId === "pork-factory",
    )) return;
    set({
      interactionMode: "inspect",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: buildingInstanceId,
      pizzaShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      notice: null,
    });
  },

  closePorkFactoryPanel: () => set({ porkFactoryPanelBuildingId: null }),

  configurePorkFactory: (buildingInstanceId, productType, now = Date.now()) => {
    const current = get();
    const result = configurePorkFactorySystem(current.game, buildingInstanceId, productType, now);
    if (result.outcome !== "configured") {
      set({ notice: "豚肉工場を設定できませんでした。" });
      return false;
    }
    set({
      game: persist(result.state),
      porkFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      notice: `${getPorkFactoryProductName(productType)}の生産を始めました！`,
    });
    return true;
  },

  openPizzaShopPanel: (buildingInstanceId) => {
    const current = get();
    if (!current.game.buildings.some(
      (building) => building.id === buildingInstanceId && building.buildingId === "pizza-shop",
    )) return;
    set({
      interactionMode: "inspect",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: buildingInstanceId,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      notice: null,
    });
  },

  closePizzaShopPanel: () => set({ pizzaShopPanelBuildingId: null }),

  craftPizza: (buildingInstanceId, quantity) => {
    const current = get();
    if (!current.game.buildings.some(
      (building) => building.id === buildingInstanceId && building.buildingId === "pizza-shop",
    )) return false;
    const result = craftPizzaSystem(current.game, quantity);
    if (result.outcome !== "crafted") {
      set({ notice: result.outcome === "not-enough-materials"
        ? "ピザの材料が足りません。"
        : "ピザの作る数を確認してください。" });
      return false;
    }
    set({
      game: persist(result.state),
      pizzaShopPanelBuildingId: null,
      notice: `ピザを${result.quantity}枚作りました！`,
    });
    return true;
  },

  selectBuilding: (building) => {
    if (!building) {
      set({
        selectedBuildingId: null,
        milkFactoryPanelBuildingId: null,
        porkFactoryPanelBuildingId: null,
        pizzaShopPanelBuildingId: null,
        selectedResidentId: null,
        isResidentPanelOpen: false,
      });
      return;
    }

    const current = get();
    const collection = createBuildingCollection(current.game.buildings);
    const selectedBuildingId = collection.idFor(building);
    if (!selectedBuildingId) {
      set({
        selectedBuildingId: null,
        milkFactoryPanelBuildingId: null,
        porkFactoryPanelBuildingId: null,
        pizzaShopPanelBuildingId: null,
        selectedResidentId: null,
        isResidentPanelOpen: false,
      });
      return;
    }

    const game = collection.buildings === current.game.buildings
      ? current.game
      : persist({ ...current.game, buildings: collection.buildings });
    set({
      game,
      selectedBuildingId,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      selectedResidentId: null,
      isResidentPanelOpen: false,
    });
  },

  selectResident: (residentId) =>
    set({
      selectedResidentId: residentId,
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      isResidentPanelOpen: residentId !== null,
    }),

  save: () => set({ game: persist(get().game) }),
  dismissNotice: () => set({ notice: null }),
  resetForDevelopment: () =>
    set({
      game: createInitialGameState(),
      economyRemainderMs: 0,
      visitorSimulation: createShopVisitorSimulation(),
      interactionMode: "inspect",
      selectedCropType: "wheat",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      selectedResidentId: null,
      notice: "新しい村を始めました。",
    }),
  };
});
