import { create } from "zustand";
import { createBuildingCollection } from "../game/core/BuildingCollection";
import { createInitialGameState } from "../game/core/GameState";
import {
  getBuildingOperationMessage,
  moveBuilding,
  placeBuilding,
  removeBuilding,
} from "../game/systems/BuildingSystem";
import { advanceEconomy, roundCoins } from "../game/systems/EconomySystem";
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
import {
  advanceWheatFactoryProductions,
  configureWheatFactory as configureWheatFactorySystem,
  getWheatFactoryProductName,
  normalizeWheatFactoryProductions,
} from "../game/systems/WheatFactorySystem";
import {
  consumeCraftedProducts,
  craftProduct,
  getCraftingProductName,
} from "../game/systems/CraftingSystem";
import { BAKERY_PRODUCT_TYPES } from "../game/systems/BakerySystem";
import { RICE_SHOP_PRODUCT_TYPES } from "../game/systems/RiceShopSystem";
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
import { syncEncyclopediaCollection } from "../game/systems/EncyclopediaSystem";
import { normalizeFishInventory } from "../game/data/fish";
import {
  getCropName,
  performCropAction,
  type CropActionOutcome,
} from "../game/systems/CropSystem";
import type { BuildingInstance } from "../game/types/Building";
import type { CropType } from "../game/types/Crop";
import type { MilkFactoryProductType } from "../game/types/MilkFactory";
import type { PorkFactoryProductType } from "../game/types/PorkFactory";
import type { WheatFactoryProductType } from "../game/types/WheatFactory";
import type { CraftingProductType } from "../game/types/Crafting";
import type { FishType } from "../game/types/Fish";
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
  wheatFactoryPanelBuildingId: string | null;
  pizzaShopPanelBuildingId: string | null;
  bakeryPanelBuildingId: string | null;
  riceShopPanelBuildingId: string | null;
  selectedResidentId: string | null;
  isBuildMenuOpen: boolean;
  isResidentPanelOpen: boolean;
  isEncyclopediaOpen: boolean;
  isFishingPromptOpen: boolean;
  isFishingGameOpen: boolean;
  notice: string | null;
  tick: (deltaMs: number, now: number) => void;
  setBuildMenuOpen: (open: boolean) => void;
  setResidentPanelOpen: (open: boolean) => void;
  openEncyclopedia: () => void;
  closeEncyclopedia: () => void;
  openFishingPrompt: () => void;
  closeFishingPrompt: () => void;
  startFishingGame: () => void;
  closeFishingGame: () => void;
  recordFishCatch: (fishType: FishType) => void;
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
  openWheatFactoryPanel: (buildingInstanceId: string) => void;
  closeWheatFactoryPanel: () => void;
  configureWheatFactory: (
    buildingInstanceId: string,
    productType: WheatFactoryProductType,
    now?: number,
  ) => boolean;
  openPizzaShopPanel: (buildingInstanceId: string) => void;
  closePizzaShopPanel: () => void;
  openBakeryPanel: (buildingInstanceId: string) => void;
  closeBakeryPanel: () => void;
  openRiceShopPanel: (buildingInstanceId: string) => void;
  closeRiceShopPanel: () => void;
  craftShopProduct: (
    buildingInstanceId: string,
    productType: CraftingProductType,
    quantity: number,
  ) => boolean;
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
  const wheatFactoryProductions = normalizeWheatFactoryProductions(
    state.wheatFactoryProductions,
    buildings,
    Date.now(),
  );
  const fishInventory = normalizeFishInventory(state.fishInventory);
  const encyclopediaState = syncEncyclopediaCollection({ ...state, buildings });
  return buildings === state.buildings &&
    cowProductions === state.cowProductions &&
    milkFactoryProductions === state.milkFactoryProductions &&
    pigProductions === state.pigProductions &&
    chickenProductions === state.chickenProductions &&
    porkFactoryProductions === state.porkFactoryProductions &&
    wheatFactoryProductions === state.wheatFactoryProductions &&
    fishInventory === state.fishInventory &&
    encyclopediaState.encyclopediaCollectedIds === state.encyclopediaCollectedIds
    ? state
    : {
      ...state,
      buildings,
      cowProductions,
      milkFactoryProductions,
      pigProductions,
      chickenProductions,
      porkFactoryProductions,
      wheatFactoryProductions,
      fishInventory,
      encyclopediaCollectedIds: encyclopediaState.encyclopediaCollectedIds,
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
  wheatFactoryPanelBuildingId: null,
  pizzaShopPanelBuildingId: null,
  bakeryPanelBuildingId: null,
  riceShopPanelBuildingId: null,
  selectedResidentId: null,
  isBuildMenuOpen: false,
  isResidentPanelOpen: false,
  isEncyclopediaOpen: false,
  isFishingPromptOpen: false,
  isFishingGameOpen: false,
  notice: null,

  tick: (deltaMs, now) => {
    const current = get();
    const wheatFactory = advanceWheatFactoryProductions(current.game, now);
    const milkFactory = advanceMilkFactoryProductions(wheatFactory, now);
    const factory = syncEncyclopediaCollection(
      advancePorkFactoryProductions(milkFactory, now),
    );
    const economy = advanceEconomy(factory, deltaMs, current.economyRemainderMs);
    const visitorResult = advanceShopVisitors(
      economy.state,
      current.visitorSimulation,
      deltaMs,
      now,
    );
    const hasProductSales = Object.values(visitorResult.productsSold).some(
      (quantity) => (quantity ?? 0) > 0,
    );
    const withVisitorSales = visitorResult.coinsEarned === 0 && !hasProductSales
      ? economy.state
      : consumeCraftedProducts(
        {
          ...economy.state,
          coins: roundCoins(economy.state.coins + visitorResult.coinsEarned),
        },
        visitorResult.productsSold,
      );
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
    const nextGame = nextNotice || factory !== current.game || hasProductSales
      ? persist(requestStart.state)
      : requestStart.state;
    set({
      game: nextGame,
      economyRemainderMs: economy.remainderMs,
      visitorSimulation: visitorResult.simulation,
      notice: nextNotice ?? current.notice,
    });
  },

  setBuildMenuOpen: (open) => set(open
    ? {
      isBuildMenuOpen: true,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
    }
    : { isBuildMenuOpen: false }),
  setResidentPanelOpen: (open) => set(open
    ? {
      isResidentPanelOpen: true,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
    }
    : { isResidentPanelOpen: false }),

  openEncyclopedia: () => set({
    interactionMode: "inspect",
    selectedBuildingId: null,
    milkFactoryPanelBuildingId: null,
    porkFactoryPanelBuildingId: null,
    wheatFactoryPanelBuildingId: null,
    pizzaShopPanelBuildingId: null,
    bakeryPanelBuildingId: null,
    riceShopPanelBuildingId: null,
    selectedResidentId: null,
    isBuildMenuOpen: false,
    isResidentPanelOpen: false,
    isEncyclopediaOpen: true,
    isFishingPromptOpen: false,
    isFishingGameOpen: false,
    notice: null,
  }),

  closeEncyclopedia: () => set({ isEncyclopediaOpen: false }),

  openFishingPrompt: () => set({
    interactionMode: "inspect",
    selectedBuildingId: null,
    milkFactoryPanelBuildingId: null,
    porkFactoryPanelBuildingId: null,
    wheatFactoryPanelBuildingId: null,
    pizzaShopPanelBuildingId: null,
    bakeryPanelBuildingId: null,
    riceShopPanelBuildingId: null,
    selectedResidentId: null,
    isBuildMenuOpen: false,
    isResidentPanelOpen: false,
    isEncyclopediaOpen: false,
    isFishingPromptOpen: true,
    isFishingGameOpen: false,
    notice: null,
  }),

  closeFishingPrompt: () => set({ isFishingPromptOpen: false }),

  startFishingGame: () => set({
    isFishingPromptOpen: false,
    isFishingGameOpen: true,
    notice: null,
  }),

  closeFishingGame: () => set({ isFishingGameOpen: false }),

  recordFishCatch: (fishType) => {
    const current = get();
    const fishInventory = {
      ...current.game.fishInventory,
      [fishType]: (current.game.fishInventory?.[fishType] ?? 0) + 1,
    };
    set({
      game: persist({ ...current.game, fishInventory }),
      notice: null,
    });
  },

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
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
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
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
      notice: null,
    }),

  beginMove: (buildingId) =>
    set({
      interactionMode: "move",
      selectedBuildingId: buildingId,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      isBuildMenuOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
      notice: "移動先のセルをクリックしてください。",
    }),

  beginFarming: () =>
    set({
      interactionMode: "farm",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
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
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      notice: null,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
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
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
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
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
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
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
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
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      notice: `${getPorkFactoryProductName(productType)}の生産を始めました！`,
    });
    return true;
  },

  openWheatFactoryPanel: (buildingInstanceId) => {
    const current = get();
    if (!current.game.buildings.some(
      (building) => building.id === buildingInstanceId && building.buildingId === "wheat-factory",
    )) return;
    set({
      interactionMode: "inspect",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      wheatFactoryPanelBuildingId: buildingInstanceId,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      notice: null,
    });
  },

  closeWheatFactoryPanel: () => set({ wheatFactoryPanelBuildingId: null }),

  configureWheatFactory: (buildingInstanceId, productType, now = Date.now()) => {
    const current = get();
    const result = configureWheatFactorySystem(current.game, buildingInstanceId, productType, now);
    if (result.outcome !== "configured") {
      set({ notice: "小麦工場を設定できませんでした。" });
      return false;
    }
    set({
      game: persist(result.state),
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      notice: `${getWheatFactoryProductName(productType)}の生産を始めました！`,
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
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: buildingInstanceId,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      notice: null,
    });
  },

  closePizzaShopPanel: () => set({ pizzaShopPanelBuildingId: null }),

  openBakeryPanel: (buildingInstanceId) => {
    const current = get();
    if (!current.game.buildings.some(
      (building) => building.id === buildingInstanceId && building.buildingId === "bakery",
    )) return;
    set({
      interactionMode: "inspect",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: buildingInstanceId,
      riceShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      notice: null,
    });
  },

  closeBakeryPanel: () => set({ bakeryPanelBuildingId: null }),

  openRiceShopPanel: (buildingInstanceId) => {
    const current = get();
    if (!current.game.buildings.some(
      (building) => building.id === buildingInstanceId && building.buildingId === "rice-shop",
    )) return;
    set({
      interactionMode: "inspect",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: buildingInstanceId,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      notice: null,
    });
  },

  closeRiceShopPanel: () => set({ riceShopPanelBuildingId: null }),

  craftShopProduct: (buildingInstanceId, productType, quantity) => {
    const current = get();
    const building = current.game.buildings.find((candidate) => candidate.id === buildingInstanceId);
    const allowedProducts = building?.buildingId === "pizza-shop"
      ? ["pizza"] as const
      : building?.buildingId === "bakery"
        ? BAKERY_PRODUCT_TYPES
        : building?.buildingId === "rice-shop"
          ? RICE_SHOP_PRODUCT_TYPES
        : [] as const;
    if (!building || !allowedProducts.includes(productType)) return false;
    const result = craftProduct(current.game, productType, quantity);
    if (result.outcome !== "crafted") {
      const productName = getCraftingProductName(productType);
      set({ notice: result.outcome === "not-enough-materials"
        ? `${productName}の材料が足りません。`
        : `${productName}の作る数を確認してください。` });
      return false;
    }
    const unit = productType === "pizza" ? "枚" : "個";
    set({
      game: persist(result.state),
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      notice: `${getCraftingProductName(productType)}を${result.quantity}${unit}作りました！`,
    });
    return true;
  },

  craftPizza: (buildingInstanceId, quantity) =>
    get().craftShopProduct(buildingInstanceId, "pizza", quantity),

  selectBuilding: (building) => {
    if (!building) {
      set({
        selectedBuildingId: null,
        milkFactoryPanelBuildingId: null,
        porkFactoryPanelBuildingId: null,
        wheatFactoryPanelBuildingId: null,
        pizzaShopPanelBuildingId: null,
        bakeryPanelBuildingId: null,
        riceShopPanelBuildingId: null,
        selectedResidentId: null,
        isResidentPanelOpen: false,
        isEncyclopediaOpen: false,
        isFishingPromptOpen: false,
        isFishingGameOpen: false,
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
        wheatFactoryPanelBuildingId: null,
        pizzaShopPanelBuildingId: null,
        bakeryPanelBuildingId: null,
        riceShopPanelBuildingId: null,
        selectedResidentId: null,
        isResidentPanelOpen: false,
        isEncyclopediaOpen: false,
        isFishingPromptOpen: false,
        isFishingGameOpen: false,
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
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      selectedResidentId: null,
      isResidentPanelOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
    });
  },

  selectResident: (residentId) =>
    set({
      selectedResidentId: residentId,
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
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
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      selectedResidentId: null,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
      notice: "新しい村を始めました。",
    }),
  };
});
