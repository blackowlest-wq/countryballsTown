import { advanceEconomy, roundCoins } from "./EconomySystem";
import { advanceFactoryProductions } from "./ProductionRegistry";
import { advanceResidents } from "./ResidentSystem";
import {
  advanceResidentRequest,
  describeResidentRequestEvent,
  maybeStartResidentRequest,
} from "./ResidentRequestSystem";
import { consumeCraftedProducts } from "./CraftingSystem";
import { advanceShopVisitors } from "./ShopVisitorSystem";
import {
  describeProgressEvent,
  evaluateVillageProgress,
} from "./VillageProgressSystem";
import { syncEncyclopediaCollection } from "./EncyclopediaSystem";
import type { ShopVisitorSimulation } from "../types/ShopVisitor";
import type { GameState } from "../types/Village";

export type GameProgressRandomSource = () => number;

export interface GameProgressState {
  game: GameState;
  economyRemainderMs: number;
  visitorSimulation: ShopVisitorSimulation;
}

export interface GameProgressResult extends GameProgressState {
  notice: string | null;
  shouldPersist: boolean;
}

function combineNotices(...notices: Array<string | null>): string | null {
  return notices.filter((notice): notice is string => Boolean(notice)).join(" ") || null;
}

/**
 * Advance all time-based game rules without touching the Store or persistence.
 *
 * The order is part of this Interface: production, economy, shop visitors,
 * residents, village progress, and resident requests are advanced as one
 * logical tick. `shouldPersist` is a durability recommendation for the Store
 * Adapter; this Module never performs the write itself.
 */
export function advanceGameProgress(
  current: GameProgressState,
  deltaMs: number,
  now: number,
  random: GameProgressRandomSource,
): GameProgressResult {
  const factory = syncEncyclopediaCollection(
    advanceFactoryProductions(current.game, now),
  );
  const economy = advanceEconomy(factory, deltaMs, current.economyRemainderMs);
  const visitorResult = advanceShopVisitors(
    economy.state,
    current.visitorSimulation,
    deltaMs,
    now,
    random,
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
  const withResidents = advanceResidents(withVisitorSales, deltaMs, now, random);
  const progress = evaluateVillageProgress(withResidents);
  const progressNotice = progress.events.map(describeProgressEvent).join(" ") || null;
  const requestProgress = advanceResidentRequest(
    progress.state,
    { type: "coins-earned", amount: economy.coinsEarned + visitorResult.coinsEarned },
    now,
    random,
  );
  const requestStart = maybeStartResidentRequest(requestProgress.state, now, random);
  const requestEvent = requestProgress.event ?? requestStart.event;
  const requestNotice = requestEvent ? describeResidentRequestEvent(requestEvent) : null;
  const notice = combineNotices(progressNotice, requestNotice);

  return {
    game: requestStart.state,
    economyRemainderMs: economy.remainderMs,
    visitorSimulation: visitorResult.simulation,
    notice,
    shouldPersist: Boolean(notice) || factory !== current.game || hasProductSales,
  };
}
