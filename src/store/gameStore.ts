import { create } from "zustand";
import { createBuildingCollection } from "../game/core/BuildingCollection";
import { createInitialGameState } from "../game/core/GameState";
import {
  getBuildingOperationMessage,
  moveBuilding,
  placeBuilding,
  removeBuilding,
} from "../game/systems/BuildingSystem";
import { advanceGameProgress } from "../game/systems/GameProgressSystem";
import {
  collectCowMilk as collectMilkFromCow,
  type CowMilkOutcome,
} from "../game/systems/CowSystem";
import {
  collectPigPork as collectPorkFromPig,
  type PigPorkOutcome,
} from "../game/systems/PigSystem";
import {
  collectChickenEggs as collectEggsFromChicken,
  type ChickenEggOutcome,
} from "../game/systems/ChickenSystem";
import {
  configureMilkFactory as configureFactory,
  getMilkFactoryProductName,
} from "../game/systems/MilkFactorySystem";
import {
  configurePorkFactory as configurePorkFactorySystem,
  getPorkFactoryProductName,
} from "../game/systems/PorkFactorySystem";
import {
  configureWheatFactory as configureWheatFactorySystem,
  getWheatFactoryProductName,
} from "../game/systems/WheatFactorySystem";
import {
  craftProduct,
  getCraftingProductName,
} from "../game/systems/CraftingSystem";
import { BAKERY_PRODUCT_TYPES } from "../game/systems/BakerySystem";
import { RICE_SHOP_PRODUCT_TYPES } from "../game/systems/RiceShopSystem";
import { FISH_SHOP_PRODUCT_TYPES } from "../game/systems/FishShopSystem";
import {
  createShopVisitorSimulation,
} from "../game/systems/ShopVisitorSystem";
import {
  advanceResidentRequest,
  describeResidentRequestEvent,
} from "../game/systems/ResidentRequestSystem";
import { describeProgressEvent, evaluateVillageProgress } from "../game/systems/VillageProgressSystem";
import { travelToMap as travelToMapSystem } from "../game/systems/MapSystem";
import { getMapDefinition } from "../game/data/maps";
import { getMiningResourceDefinition } from "../game/data/mining";
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
import type { WheatFactoryProductType } from "../game/types/WheatFactory";
import type { CraftingProductType } from "../game/types/Crafting";
import type { FishType } from "../game/types/Fish";
import type { ShopVisitorSimulation } from "../game/types/ShopVisitor";
import type { MapId } from "../game/types/Map";
import type { GameState } from "../game/types/Village";
import {
  canStartFishing,
  purchaseFishingRod as purchaseFishingRodSystem,
} from "../game/systems/FishingSystem";
import {
  digCave as digCaveSystem,
  purchaseCaveFuel as purchaseCaveFuelSystem,
  resetCaveMining as resetCaveMiningSystem,
  upgradeCave as upgradeCaveSystem,
  type CaveDigOutcome,
  type CaveUpgradeKind,
} from "../game/systems/CaveMiningSystem";
import type { DigDirection } from "../game/types/Mining";

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
  fishShopPanelBuildingId: string | null;
  selectedResidentId: string | null;
  isBuildMenuOpen: boolean;
  isResidentPanelOpen: boolean;
  isMapTravelOpen: boolean;
  isEncyclopediaOpen: boolean;
  isFishingPromptOpen: boolean;
  isFishingGameOpen: boolean;
  isCaveMiningGameOpen: boolean;
  notice: string | null;
  tick: (deltaMs: number, now: number) => void;
  setBuildMenuOpen: (open: boolean) => void;
  setResidentPanelOpen: (open: boolean) => void;
  openMapTravel: () => void;
  closeMapTravel: () => void;
  openEncyclopedia: () => void;
  closeEncyclopedia: () => void;
  openFishingPrompt: () => void;
  closeFishingPrompt: () => void;
  purchaseFishingRod: () => boolean;
  startFishingGame: () => boolean;
  closeFishingGame: () => void;
  recordFishCatch: (fishType: FishType) => void;
  openCaveMiningGame: () => boolean;
  closeCaveMiningGame: () => void;
  digCave: (direction: DigDirection) => CaveDigOutcome | null;
  resetCaveMining: () => boolean;
  purchaseCaveFuel: () => boolean;
  upgradeCave: (kind: CaveUpgradeKind) => boolean;
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
  openFishShopPanel: (buildingInstanceId: string) => void;
  closeFishShopPanel: () => void;
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

function persist(state: GameState): GameState {
  return saveGameState(state);
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
    setState(update);
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
  fishShopPanelBuildingId: null,
  selectedResidentId: null,
  isBuildMenuOpen: false,
  isResidentPanelOpen: false,
  isMapTravelOpen: false,
  isEncyclopediaOpen: false,
  isFishingPromptOpen: false,
  isFishingGameOpen: false,
  isCaveMiningGameOpen: false,
  notice: null,

  tick: (deltaMs, now) => {
    const current = get();
    const progress = advanceGameProgress({
      game: current.game,
      economyRemainderMs: current.economyRemainderMs,
      visitorSimulation: current.visitorSimulation,
    }, deltaMs, now, Math.random);
    const nextGame = progress.shouldPersist ? persist(progress.game) : progress.game;
    set({
      game: nextGame,
      economyRemainderMs: progress.economyRemainderMs,
      visitorSimulation: progress.visitorSimulation,
      notice: progress.notice ?? current.notice,
    });
  },

  setBuildMenuOpen: (open) => set(open
    ? {
      isBuildMenuOpen: true,
      isMapTravelOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
      isCaveMiningGameOpen: false,
    }
    : { isBuildMenuOpen: false }),
  setResidentPanelOpen: (open) => set(open
    ? {
      isResidentPanelOpen: true,
      isMapTravelOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
      isCaveMiningGameOpen: false,
    }
    : { isResidentPanelOpen: false }),

  openMapTravel: () => set({
    interactionMode: "inspect",
    selectedBuildingId: null,
    milkFactoryPanelBuildingId: null,
    porkFactoryPanelBuildingId: null,
    wheatFactoryPanelBuildingId: null,
    pizzaShopPanelBuildingId: null,
    bakeryPanelBuildingId: null,
    riceShopPanelBuildingId: null,
    fishShopPanelBuildingId: null,
    selectedResidentId: null,
    isBuildMenuOpen: false,
    isResidentPanelOpen: false,
    isMapTravelOpen: true,
    isEncyclopediaOpen: false,
    isFishingPromptOpen: false,
    isFishingGameOpen: false,
    isCaveMiningGameOpen: false,
    notice: null,
  }),

  closeMapTravel: () => set({ isMapTravelOpen: false }),

  openEncyclopedia: () => set({
    interactionMode: "inspect",
    selectedBuildingId: null,
    milkFactoryPanelBuildingId: null,
    porkFactoryPanelBuildingId: null,
    wheatFactoryPanelBuildingId: null,
    pizzaShopPanelBuildingId: null,
    bakeryPanelBuildingId: null,
    riceShopPanelBuildingId: null,
    fishShopPanelBuildingId: null,
    selectedResidentId: null,
    isBuildMenuOpen: false,
    isResidentPanelOpen: false,
    isMapTravelOpen: false,
    isEncyclopediaOpen: true,
    isFishingPromptOpen: false,
    isFishingGameOpen: false,
    isCaveMiningGameOpen: false,
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
    fishShopPanelBuildingId: null,
    selectedResidentId: null,
    isBuildMenuOpen: false,
    isResidentPanelOpen: false,
    isMapTravelOpen: false,
    isEncyclopediaOpen: false,
    isFishingPromptOpen: true,
    isFishingGameOpen: false,
    isCaveMiningGameOpen: false,
    notice: null,
  }),

  closeFishingPrompt: () => set({ isFishingPromptOpen: false }),

  purchaseFishingRod: () => {
    const current = get();
    const result = purchaseFishingRodSystem(current.game);
    if (!result.ok) {
      set({ notice: result.reason === "not-enough-coins" ? "コインが足りません。" : null });
      return false;
    }
    set({ game: persist(result.state), notice: null });
    return true;
  },

  startFishingGame: () => {
    const current = get();
    if (!canStartFishing(current.game)) {
      set({ notice: "釣り竿を購入すると釣りをプレイできます。" });
      return false;
    }
    set({
      isFishingPromptOpen: false,
      isFishingGameOpen: true,
      isCaveMiningGameOpen: false,
      notice: null,
    });
    return true;
  },

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

  openCaveMiningGame: () => {
    const current = get();
    if (current.game.currentMap !== "cave") {
      set({ notice: "洞窟で地面採掘ゲームを開けます。" });
      return false;
    }
    set({
      interactionMode: "inspect",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      fishShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
      isCaveMiningGameOpen: true,
      notice: null,
    });
    return true;
  },

  closeCaveMiningGame: () => set({ isCaveMiningGameOpen: false }),

  resetCaveMining: () => {
    const current = get();
    if (current.game.currentMap !== "cave" || !current.isCaveMiningGameOpen) return false;
    set({
      game: persist(resetCaveMiningSystem(current.game)),
      notice: "新しい地層を用意しました。強化・材料・図鑑はそのままです。",
    });
    return true;
  },

  digCave: (direction) => {
    const current = get();
    if (current.game.currentMap !== "cave" || !current.isCaveMiningGameOpen) return null;
    const result = digCaveSystem(current.game, direction);
    if (!result.ok) {
      const notice = result.outcome === "no-fuel"
        ? "燃料が切れています。燃料を購入して補給してください。"
        : result.outcome === "capacity-full"
          ? "採掘物がいっぱいです。採掘物容量を強化してください。"
          : "ここから先には掘れる地面がありません。";
      set({ notice });
      return result.outcome;
    }
    const resourceName = result.resourceType
      ? getMiningResourceDefinition(result.resourceType).name
      : null;
    set({
      game: persist(result.state),
      notice: resourceName
        ? `${resourceName}を1個見つけました！`
        : result.outcome === "moved"
          ? null
          : result.isCracked
            ? `地面を削りました（${result.cellDamage}/${result.cellDurability}）。ヒビが入りました。`
            : `地面を削りました（${result.cellDamage}/${result.cellDurability}）。`,
    });
    return result.outcome;
  },

  purchaseCaveFuel: () => {
    const current = get();
    const result = purchaseCaveFuelSystem(current.game);
    if (!result.ok) {
      set({
        notice: result.reason === "fuel-not-empty"
          ? "燃料が残っているため、まだ購入できません。"
          : "コインが足りません。",
      });
      return false;
    }
    set({ game: persist(result.state), notice: "燃料を補給しました！" });
    return true;
  },

  upgradeCave: (kind) => {
    const current = get();
    const upgradeName = kind === "drill"
      ? "ドリル硬度"
      : kind === "fuel-tank"
        ? "燃料タンク"
        : "採掘物容量";
    const result = upgradeCaveSystem(current.game, kind);
    if (!result.ok) {
      set({
        notice: result.reason === "max-level"
          ? `${upgradeName}は最大レベルです。`
          : "コインが足りません。",
      });
      return false;
    }
    set({
      game: persist(result.state),
      notice: `${upgradeName}を強化しました！`,
    });
    return true;
  },

  travelToMap: (mapId, now = Date.now()) => {
    const current = get();
    const game = travelToMapSystem(current.game, mapId, now);
    if (game === current.game) {
      set({ isMapTravelOpen: false });
      return;
    }
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
      fishShopPanelBuildingId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
      isEncyclopediaOpen: false,
    isFishingPromptOpen: false,
    isFishingGameOpen: false,
    isCaveMiningGameOpen: false,
      selectedResidentId: null,
      notice: mapId === "village"
        ? "村へ戻りました。"
        : `${getMapDefinition(mapId).name}へ移動しました。`,
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
      fishShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
      isCaveMiningGameOpen: false,
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
      fishShopPanelBuildingId: null,
      isBuildMenuOpen: false,
      isMapTravelOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
      isCaveMiningGameOpen: false,
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
      fishShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
      isCaveMiningGameOpen: false,
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
      fishShopPanelBuildingId: null,
      notice: null,
      isEncyclopediaOpen: false,
      isMapTravelOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
      isCaveMiningGameOpen: false,
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
      fishShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
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
      fishShopPanelBuildingId: null,
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
      fishShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
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
      fishShopPanelBuildingId: null,
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
      fishShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
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
      fishShopPanelBuildingId: null,
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
      fishShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
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
      fishShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
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
      fishShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
      notice: null,
    });
  },

  closeRiceShopPanel: () => set({ riceShopPanelBuildingId: null }),

  openFishShopPanel: (buildingInstanceId) => {
    const current = get();
    if (!current.game.buildings.some(
      (building) => building.id === buildingInstanceId && building.buildingId === "fish-shop",
    )) return;
    set({
      interactionMode: "inspect",
      selectedBuildingId: null,
      milkFactoryPanelBuildingId: null,
      porkFactoryPanelBuildingId: null,
      wheatFactoryPanelBuildingId: null,
      pizzaShopPanelBuildingId: null,
      bakeryPanelBuildingId: null,
      riceShopPanelBuildingId: null,
      fishShopPanelBuildingId: buildingInstanceId,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
      notice: null,
    });
  },

  closeFishShopPanel: () => set({ fishShopPanelBuildingId: null }),

  craftShopProduct: (buildingInstanceId, productType, quantity) => {
    const current = get();
    const building = current.game.buildings.find((candidate) => candidate.id === buildingInstanceId);
    const allowedProducts = building?.buildingId === "pizza-shop"
      ? ["pizza"] as const
      : building?.buildingId === "bakery"
        ? BAKERY_PRODUCT_TYPES
          : building?.buildingId === "rice-shop"
            ? RICE_SHOP_PRODUCT_TYPES
            : building?.buildingId === "fish-shop"
              ? FISH_SHOP_PRODUCT_TYPES
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
      fishShopPanelBuildingId: null,
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
        fishShopPanelBuildingId: null,
        selectedResidentId: null,
        isResidentPanelOpen: false,
        isMapTravelOpen: false,
        isEncyclopediaOpen: false,
        isFishingPromptOpen: false,
        isFishingGameOpen: false,
        isCaveMiningGameOpen: false,
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
        fishShopPanelBuildingId: null,
        selectedResidentId: null,
        isResidentPanelOpen: false,
        isEncyclopediaOpen: false,
        isFishingPromptOpen: false,
        isFishingGameOpen: false,
        isCaveMiningGameOpen: false,
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
      fishShopPanelBuildingId: null,
      selectedResidentId: null,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
      isCaveMiningGameOpen: false,
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
      fishShopPanelBuildingId: null,
      isResidentPanelOpen: residentId !== null,
      isMapTravelOpen: false,
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
      fishShopPanelBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      isMapTravelOpen: false,
      isEncyclopediaOpen: false,
      isFishingPromptOpen: false,
      isFishingGameOpen: false,
      isCaveMiningGameOpen: false,
      notice: "新しい村を始めました。",
    }),
  };
});
