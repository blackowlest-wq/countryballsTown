import type { BuildingInstance } from "../types/Building";
import type { ChickenProduction } from "../types/Chicken";
import type { CowProduction } from "../types/Cow";
import type { PigProduction } from "../types/Pig";
import type { GameState } from "../types/Village";

export interface LivestockProductionRecord {
  buildingInstanceId: string;
}

export type LivestockStateKey<TProduction extends LivestockProductionRecord> = {
  [Key in keyof GameState]-?: GameState[Key] extends TProduction[] ? Key : never;
}[keyof GameState] & string;

export type LivestockNumberFieldKey<TProduction extends LivestockProductionRecord> = {
  [Key in keyof TProduction]-?: TProduction[Key] extends number ? Key : never;
}[keyof TProduction] & string;

export type LivestockInventoryKey = "milk" | "pork" | "eggs";

type LivestockBuildingIdFor<TProduction extends LivestockProductionRecord> =
  TProduction extends CowProduction ? "cow" :
    TProduction extends PigProduction ? "pig" :
      TProduction extends ChickenProduction ? "chicken" :
        "cow" | "pig" | "chicken";

type LivestockInventoryKeyFor<TProduction extends LivestockProductionRecord> =
  TProduction extends CowProduction ? "milk" :
    TProduction extends PigProduction ? "pork" :
      TProduction extends ChickenProduction ? "eggs" :
        LivestockInventoryKey;

export interface LivestockProductionDefinition<
  TProduction extends LivestockProductionRecord,
> {
  buildingId: LivestockBuildingIdFor<TProduction>;
  stateKey: LivestockStateKey<TProduction>;
  readyAtKey: LivestockNumberFieldKey<TProduction>;
  inventoryKey: LivestockInventoryKeyFor<TProduction>;
  intervalMs: number;
  amount: number;
}

export interface LivestockCollectionResult {
  outcome: "collected" | "not-ready" | "not-found";
  state: GameState;
}

export interface LivestockProductionModule<TProduction extends LivestockProductionRecord> {
  register(state: GameState, buildingInstanceId: string, now: number): GameState;
  remove(state: GameState, buildingInstanceId: string): GameState;
  collect(state: GameState, buildingInstanceId: string, now: number): LivestockCollectionResult;
  isReady(production: TProduction, now: number): boolean;
  normalize(value: unknown, buildings: readonly BuildingInstance[], now: number): TProduction[];
}

function getProductions<TProduction extends LivestockProductionRecord>(
  state: GameState,
  definition: LivestockProductionDefinition<TProduction>,
): TProduction[] {
  return state[definition.stateKey] as unknown as TProduction[];
}

export function createLivestockProductionModule<
  TProduction extends LivestockProductionRecord,
>(
  definition: LivestockProductionDefinition<TProduction>,
): LivestockProductionModule<TProduction> {
  const isReady = (production: TProduction, now: number): boolean =>
    now >= Number(
      (production as unknown as Record<string, unknown>)[definition.readyAtKey],
    );

  return {
    register: (state, buildingInstanceId, now) => {
      const productions = getProductions<TProduction>(state, definition);
      if (productions.some((production) => production.buildingInstanceId === buildingInstanceId)) {
        return state;
      }
      const production = {
        buildingInstanceId,
        [definition.readyAtKey]: now + definition.intervalMs,
      } as unknown as TProduction;
      return {
        ...state,
        [definition.stateKey]: [...productions, production],
      } as GameState;
    },

    remove: (state, buildingInstanceId) => {
      const productions = getProductions<TProduction>(state, definition);
      const nextProductions = productions.filter(
        (production) => production.buildingInstanceId !== buildingInstanceId,
      );
      return nextProductions.length === productions.length
        ? state
        : { ...state, [definition.stateKey]: nextProductions } as GameState;
    },

    collect: (state, buildingInstanceId, now) => {
      const productions = getProductions<TProduction>(state, definition);
      const production = productions.find(
        (candidate) => candidate.buildingInstanceId === buildingInstanceId,
      );
      if (!production) return { outcome: "not-found", state };
      if (!isReady(production, now)) return { outcome: "not-ready", state };

      const nextProductions = productions.map((candidate) =>
        candidate === production
          ? {
            ...candidate,
            [definition.readyAtKey]: now + definition.intervalMs,
          }
          : candidate
      );
      return {
        outcome: "collected",
        state: {
          ...state,
          [definition.inventoryKey]: state[definition.inventoryKey] + definition.amount,
          [definition.stateKey]: nextProductions,
        } as GameState,
      };
    },

    isReady,

    normalize: (value, buildings, now) => {
      const buildingIds = buildings
        .filter((building) => building.buildingId === definition.buildingId)
        .map((building) => building.id);
      const buildingIdSet = new Set(buildingIds);
      const source = Array.isArray(value) ? value : [];
      const productionsByBuildingId = new Map<string, TProduction>();

      for (const item of source) {
        if (!item || typeof item !== "object") continue;
        const candidate = item as Partial<TProduction>;
        const readyAt = (candidate as Record<string, unknown>)[definition.readyAtKey];
        if (
          typeof candidate.buildingInstanceId !== "string" ||
          !buildingIdSet.has(candidate.buildingInstanceId) ||
          typeof readyAt !== "number" ||
          !Number.isFinite(readyAt) ||
          productionsByBuildingId.has(candidate.buildingInstanceId)
        ) {
          continue;
        }
        productionsByBuildingId.set(
          candidate.buildingInstanceId,
          candidate as TProduction,
        );
      }

      const normalized = buildingIds.map((buildingInstanceId) =>
        productionsByBuildingId.get(buildingInstanceId) ?? {
          buildingInstanceId,
          [definition.readyAtKey]: now + definition.intervalMs,
        } as unknown as TProduction
      );
      const canReuseSource =
        Array.isArray(value) &&
        source.length === normalized.length &&
        normalized.every((production, index) => production === source[index]);
      return canReuseSource ? source as TProduction[] : normalized;
    },
  };
}
