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
import { loadGameState, saveGameState } from "../game/systems/SaveSystem";
import {
  getCropName,
  performCropAction,
  type CropAction,
  type CropActionOutcome,
} from "../game/systems/CropSystem";
import type { BuildingInstance } from "../game/types/Building";
import type { CropType } from "../game/types/Crop";
import type { ShopVisitorSimulation } from "../game/types/ShopVisitor";
import type { GameState } from "../game/types/Village";

export type InteractionMode = "inspect" | "build" | "move" | "farm";

interface GameStore {
  game: GameState;
  economyRemainderMs: number;
  visitorSimulation: ShopVisitorSimulation;
  interactionMode: InteractionMode;
  cropAction: CropAction;
  selectedCropType: CropType;
  selectedBuildingId: string | null;
  selectedResidentId: string | null;
  isBuildMenuOpen: boolean;
  isResidentPanelOpen: boolean;
  notice: string | null;
  tick: (deltaMs: number, now: number) => void;
  setBuildMenuOpen: (open: boolean) => void;
  setResidentPanelOpen: (open: boolean) => void;
  beginBuild: (buildingId: string) => void;
  beginMove: (buildingId: string) => void;
  beginFarming: () => void;
  setCropAction: (action: CropAction) => void;
  selectCropType: (cropType: CropType) => void;
  cancelInteraction: () => void;
  interactCrop: (
    gridX: number,
    gridY: number,
    now?: number,
  ) => CropActionOutcome | null;
  placeSelectedBuilding: (gridX: number, gridY: number) => boolean;
  moveSelectedBuilding: (gridX: number, gridY: number) => boolean;
  removeSelectedBuilding: () => boolean;
  collectCowMilk: (buildingInstanceId: string, now?: number) => CowMilkOutcome | null;
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
  return buildings === state.buildings && cowProductions === state.cowProductions
    ? state
    : { ...state, buildings, cowProductions };
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
  cropAction: "harvest",
  selectedCropType: "wheat",
  selectedBuildingId: null,
  selectedResidentId: null,
  isBuildMenuOpen: false,
  isResidentPanelOpen: false,
  notice: null,

  tick: (deltaMs, now) => {
    const current = get();
    const economy = advanceEconomy(current.game, deltaMs, current.economyRemainderMs);
    const visitorResult = advanceShopVisitors(
      economy.state,
      current.visitorSimulation,
      deltaMs,
      now,
    );
    const withVisitorSales = visitorResult.coinsEarned === 0
      ? economy.state
      : { ...economy.state, coins: economy.state.coins + visitorResult.coinsEarned };
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
    const nextGame = nextNotice ? persist(requestStart.state) : requestStart.state;
    set({
      game: nextGame,
      economyRemainderMs: economy.remainderMs,
      visitorSimulation: visitorResult.simulation,
      notice: nextNotice ?? current.notice,
    });
  },

  setBuildMenuOpen: (open) => set({ isBuildMenuOpen: open }),
  setResidentPanelOpen: (open) => set({ isResidentPanelOpen: open }),

  beginBuild: (buildingId) =>
    set({
      interactionMode: "build",
      selectedBuildingId: buildingId,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      notice: null,
    }),

  beginMove: (buildingId) =>
    set({
      interactionMode: "move",
      selectedBuildingId: buildingId,
      isBuildMenuOpen: false,
      notice: "移動先のセルをクリックしてください。",
    }),

  beginFarming: () =>
    set({
      interactionMode: "farm",
      cropAction: "harvest",
      selectedBuildingId: null,
      selectedResidentId: null,
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      notice: "畑で操作してください。安全のため「収穫」から始まります。",
    }),

  setCropAction: (action) => set({ cropAction: action, notice: null }),

  selectCropType: (cropType) => set({
    selectedCropType: cropType,
    cropAction: "plant",
    notice: null,
  }),

  cancelInteraction: () =>
    set({ interactionMode: "inspect", selectedBuildingId: null, notice: null }),

  interactCrop: (gridX, gridY, now = Date.now()) => {
    const current = get();
    if (current.interactionMode !== "farm") return null;
    const result = performCropAction(
      current.game,
      current.cropAction,
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

  selectBuilding: (building) => {
    if (!building) {
      set({ selectedBuildingId: null, selectedResidentId: null, isResidentPanelOpen: false });
      return;
    }

    const current = get();
    const collection = createBuildingCollection(current.game.buildings);
    const selectedBuildingId = collection.idFor(building);
    if (!selectedBuildingId) {
      set({ selectedBuildingId: null, selectedResidentId: null, isResidentPanelOpen: false });
      return;
    }

    const game = collection.buildings === current.game.buildings
      ? current.game
      : persist({ ...current.game, buildings: collection.buildings });
    set({
      game,
      selectedBuildingId,
      selectedResidentId: null,
      isResidentPanelOpen: false,
    });
  },

  selectResident: (residentId) =>
    set({
      selectedResidentId: residentId,
      selectedBuildingId: null,
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
      cropAction: "harvest",
      selectedCropType: "wheat",
      selectedBuildingId: null,
      selectedResidentId: null,
      notice: "新しい村を始めました。",
    }),
  };
});
