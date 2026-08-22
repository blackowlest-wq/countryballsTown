import {
  GRID_SIZE,
  SHOP_VISITOR_ARRIVAL_MAX_MS,
  SHOP_VISITOR_ARRIVAL_MIN_MS,
  SHOP_VISITOR_INITIAL_DELAY_MS,
  SHOP_VISITOR_MAX_TOTAL,
  SHOP_VISITOR_RETRY_MS,
  SHOP_VISITOR_SERVICE_MS,
  SHOP_VISITOR_WALK_SPEED,
} from "../constants/gameConstants";
import { getBuildingDefinition } from "../data/buildings";
import {
  getCraftedProductStock,
} from "./CraftingSystem";
import type { BuildingDefinition, BuildingInstance } from "../types/Building";
import type {
  CraftingProductSales,
  CraftingProductType,
} from "../types/Crafting";
import type { GridPosition } from "../types/GridPosition";
import type { ShopVisitor, ShopVisitorSimulation } from "../types/ShopVisitor";
import type { GameState } from "../types/Village";
import { distanceBetween, moveTowards } from "./MovementSystem";

type RandomSource = () => number;

interface ActiveShop {
  building: BuildingInstance;
  definition: BuildingDefinition;
}

interface QueueLayout {
  checkout: GridPosition;
  focus: GridPosition;
  outward: GridPosition;
  tangent: GridPosition;
}

export interface ShopVisitorAdvanceResult {
  simulation: ShopVisitorSimulation;
  coinsEarned: number;
  productsSold: CraftingProductSales;
  /** Kept as a compatibility projection for existing pizza shop callers. */
  pizzasSold: number;
}

const VISITOR_COLORS = [
  "#6fa8dc",
  "#b47cc7",
  "#e58f65",
  "#66ad91",
  "#d67f9a",
  "#d4a84f",
];
const MAP_MARGIN = 0.55;
const CHECKOUT_GAP = 0.9;
const QUEUE_SPACING = 0.92;
const ARRIVAL_DISTANCE = 0.08;
const SHOP_MOVED_DISTANCE = 0.35;

function randomBetween(min: number, max: number, random: RandomSource): number {
  return min + (max - min) * random();
}

function clampPosition(position: GridPosition): GridPosition {
  return {
    x: Math.min(GRID_SIZE - MAP_MARGIN, Math.max(MAP_MARGIN, position.x)),
    z: Math.min(GRID_SIZE - MAP_MARGIN, Math.max(MAP_MARGIN, position.z)),
  };
}

function getActiveShops(state: Pick<GameState, "buildings">): ActiveShop[] {
  return state.buildings.flatMap((building) => {
    const definition = getBuildingDefinition(building.buildingId);
    return definition?.visitorService ? [{ building, definition }] : [];
  });
}

function getShopProductTypes(shop: ActiveShop): readonly CraftingProductType[] {
  const service = shop.definition.visitorService;
  if (service?.products && service.products.length > 0) return service.products;
  return service?.product ? [service.product] : [];
}

function getShopProductStock(
  shop: ActiveShop,
  state: GameState,
  productsSold: CraftingProductSales,
): number | null {
  const products = getShopProductTypes(shop);
  if (products.length === 0) return null;
  return products.reduce(
    (stock, productType) => stock + Math.max(
      0,
      getCraftedProductStock(state, productType) - (productsSold[productType] ?? 0),
    ),
    0,
  );
}

function getAvailableShopProduct(
  shop: ActiveShop,
  state: GameState,
  productsSold: CraftingProductSales,
): CraftingProductType | null {
  return getShopProductTypes(shop).find((productType) =>
    getCraftedProductStock(state, productType) - (productsSold[productType] ?? 0) > 0,
  ) ?? null;
}

function getShopFocus(shop: ActiveShop): GridPosition {
  return {
    x: shop.building.gridX + (shop.definition.width - 1) / 2,
    z: shop.building.gridY + (shop.definition.height - 1) / 2,
  };
}

function fitsOnMap(position: GridPosition): boolean {
  return (
    position.x >= MAP_MARGIN &&
    position.x <= GRID_SIZE - MAP_MARGIN &&
    position.z >= MAP_MARGIN &&
    position.z <= GRID_SIZE - MAP_MARGIN
  );
}

function getQueueLayout(shop: ActiveShop, queueLength: number): QueueLayout {
  const focus = getShopFocus(shop);
  const lastQueueOffset = Math.max(0, queueLength - 1) * QUEUE_SPACING;
  const sides: Array<{
    outward: GridPosition;
    tangent: GridPosition;
    edge: GridPosition;
    useDoorOffset: boolean;
  }> = [
    {
      outward: { x: 0, z: 1 },
      tangent: { x: 1, z: 0 },
      edge: { x: focus.x, z: shop.building.gridY + shop.definition.height - 1 },
      useDoorOffset: true,
    },
    {
      outward: { x: 0, z: -1 },
      tangent: { x: -1, z: 0 },
      edge: { x: focus.x, z: shop.building.gridY },
      useDoorOffset: false,
    },
    {
      outward: { x: 1, z: 0 },
      tangent: { x: 0, z: -1 },
      edge: { x: shop.building.gridX + shop.definition.width - 1, z: focus.z },
      useDoorOffset: false,
    },
    {
      outward: { x: -1, z: 0 },
      tangent: { x: 0, z: 1 },
      edge: { x: shop.building.gridX, z: focus.z },
      useDoorOffset: false,
    },
  ];

  for (const side of sides) {
    const doorOffset = side.useDoorOffset ? shop.definition.visitorService?.doorOffset ?? 0 : 0;
    const checkout = {
      x: side.edge.x + side.outward.x * CHECKOUT_GAP + side.tangent.x * doorOffset,
      z: side.edge.z + side.outward.z * CHECKOUT_GAP + side.tangent.z * doorOffset,
    };
    const lastPosition = {
      x: checkout.x + side.outward.x * lastQueueOffset,
      z: checkout.z + side.outward.z * lastQueueOffset,
    };
    if (fitsOnMap(checkout) && fitsOnMap(lastPosition)) {
      return { checkout, focus, outward: side.outward, tangent: side.tangent };
    }
  }

  const fallback = sides[0];
  return {
    checkout: clampPosition({
      x: fallback.edge.x + fallback.outward.x * CHECKOUT_GAP,
      z: fallback.edge.z + fallback.outward.z * CHECKOUT_GAP,
    }),
    focus,
    outward: fallback.outward,
    tangent: fallback.tangent,
  };
}

function getQueuePosition(layout: QueueLayout, index: number): GridPosition {
  return clampPosition({
    x: layout.checkout.x + layout.outward.x * index * QUEUE_SPACING,
    z: layout.checkout.z + layout.outward.z * index * QUEUE_SPACING,
  });
}

function getMapEdgePosition(
  layout: QueueLayout,
  tangentOffset: number,
): GridPosition {
  const position = {
    x: layout.outward.x === 0
      ? layout.checkout.x + layout.tangent.x * tangentOffset
      : layout.outward.x > 0 ? GRID_SIZE - MAP_MARGIN : MAP_MARGIN,
    z: layout.outward.z === 0
      ? layout.checkout.z + layout.tangent.z * tangentOffset
      : layout.outward.z > 0 ? GRID_SIZE - MAP_MARGIN : MAP_MARGIN,
  };
  return clampPosition(position);
}

function getNearestExit(position: GridPosition): GridPosition {
  const distances = [
    { distance: position.x, point: { x: MAP_MARGIN, z: position.z } },
    { distance: GRID_SIZE - position.x, point: { x: GRID_SIZE - MAP_MARGIN, z: position.z } },
    { distance: position.z, point: { x: position.x, z: MAP_MARGIN } },
    { distance: GRID_SIZE - position.z, point: { x: position.x, z: GRID_SIZE - MAP_MARGIN } },
  ];
  distances.sort((left, right) => left.distance - right.distance);
  return clampPosition(distances[0].point);
}

function moveVisitor(visitor: ShopVisitor, destination: GridPosition, deltaMs: number): ShopVisitor {
  const position = moveTowards(
    visitor.position,
    destination,
    deltaMs,
    SHOP_VISITOR_WALK_SPEED,
  );
  return {
    ...visitor,
    position: distanceBetween(position, destination) <= ARRIVAL_DISTANCE ? destination : position,
    destination,
  };
}

function beginLeaving(
  visitor: ShopVisitor,
  destination = getNearestExit(visitor.position),
): ShopVisitor {
  return {
    ...visitor,
    phase: "leaving",
    destination,
    lookAt: undefined,
    serviceUntil: undefined,
  };
}

function createVisitor(
  shop: ActiveShop,
  simulation: ShopVisitorSimulation,
  now: number,
  random: RandomSource,
): ShopVisitor {
  const layout = getQueueLayout(shop, shop.definition.visitorService?.queueCapacity ?? 1);
  const position = getMapEdgePosition(layout, -0.65 + random() * 0.35);
  return {
    id: `visitor-${simulation.nextSequence}`,
    shopBuildingId: shop.building.id,
    color: VISITOR_COLORS[Math.min(
      VISITOR_COLORS.length - 1,
      Math.floor(random() * VISITOR_COLORS.length),
    )],
    position,
    destination: layout.checkout,
    lookAt: layout.focus,
    phase: "arriving",
    joinedAt: now,
  };
}

export function createShopVisitorSimulation(now = Date.now()): ShopVisitorSimulation {
  return {
    visitors: [],
    nextArrivalAt: now + SHOP_VISITOR_INITIAL_DELAY_MS,
    nextSequence: 1,
  };
}

export function advanceShopVisitors(
  state: GameState,
  simulation: ShopVisitorSimulation,
  deltaMs: number,
  now: number,
  random: RandomSource = Math.random,
): ShopVisitorAdvanceResult {
  const shops = getActiveShops(state);
  const shopsById = new Map(shops.map((shop) => [shop.building.id, shop]));
  let coinsEarned = 0;
  const productsSold: CraftingProductSales = {};
  let visitors = simulation.visitors.map((visitor) => {
    if (visitor.phase === "leaving") return visitor;
    const shop = shopsById.get(visitor.shopBuildingId);
    if (!shop) return beginLeaving(visitor);
    if (visitor.phase === "buying" && (visitor.serviceUntil ?? Number.POSITIVE_INFINITY) <= now) {
      const productStock = getShopProductStock(shop, state, productsSold);
      if (productStock !== null && productStock <= 0) {
        return beginLeaving(visitor);
      }
      const productType = getAvailableShopProduct(shop, state, productsSold);
      if (productStock !== null && !productType) return beginLeaving(visitor);
      if (productType) productsSold[productType] = (productsSold[productType] ?? 0) + 1;
      coinsEarned += shop.definition.visitorService?.saleCoins ?? 0;
      const layout = getQueueLayout(shop, shop.definition.visitorService?.queueCapacity ?? 1);
      return beginLeaving(visitor, getMapEdgePosition(layout, 1.25));
    }
    return visitor;
  });

  for (const shop of shops) {
    let queue = visitors
      .filter((visitor) => visitor.shopBuildingId === shop.building.id && visitor.phase !== "leaving")
      .sort((left, right) => left.joinedAt - right.joinedAt || left.id.localeCompare(right.id));
    const productStock = getShopProductStock(shop, state, productsSold);
    const queueCapacity = shop.definition.visitorService?.queueCapacity ?? 0;
    const availableQueueCapacity = productStock === null
      ? queueCapacity
      : Math.min(queueCapacity, productStock);
    if (queue.length > availableQueueCapacity) {
      for (const queuedVisitor of queue.slice(availableQueueCapacity)) {
        const visitorIndex = visitors.findIndex((visitor) => visitor.id === queuedVisitor.id);
        if (visitorIndex >= 0) visitors[visitorIndex] = beginLeaving(visitors[visitorIndex]);
      }
      queue = queue.slice(0, availableQueueCapacity);
    }
    if (queue.length === 0) continue;
    const layout = getQueueLayout(shop, queue.length);
    let buyerAssigned = false;

    for (let index = 0; index < queue.length; index += 1) {
      const queuedVisitor = queue[index];
      const visitorIndex = visitors.findIndex((visitor) => visitor.id === queuedVisitor.id);
      if (visitorIndex < 0) continue;
      let visitor = visitors[visitorIndex];
      const destination = getQueuePosition(layout, index);

      if (visitor.phase === "buying") {
        const stillAtCheckout = index === 0 && distanceBetween(visitor.position, destination) <= SHOP_MOVED_DISTANCE;
        if (stillAtCheckout && !buyerAssigned) {
          visitors[visitorIndex] = {
            ...visitor,
            position: destination,
            destination,
            lookAt: layout.focus,
          };
          buyerAssigned = true;
          continue;
        }
        visitor = { ...visitor, phase: "arriving", serviceUntil: undefined };
      }

      visitor = moveVisitor(visitor, destination, deltaMs);
      const arrived = distanceBetween(visitor.position, destination) <= ARRIVAL_DISTANCE;
      if (arrived && index === 0 && !buyerAssigned) {
        visitor = {
          ...visitor,
          phase: "buying",
          serviceUntil: now + SHOP_VISITOR_SERVICE_MS,
        };
        buyerAssigned = true;
      } else {
        visitor = {
          ...visitor,
          phase: arrived ? "waiting" : "arriving",
          serviceUntil: undefined,
        };
      }
      visitors[visitorIndex] = { ...visitor, lookAt: layout.focus };
    }
  }

  visitors = visitors.flatMap((visitor) => {
    if (visitor.phase !== "leaving") return [visitor];
    const moved = moveVisitor(visitor, visitor.destination, deltaMs);
    return distanceBetween(moved.position, moved.destination) <= ARRIVAL_DISTANCE ? [] : [moved];
  });

  let nextArrivalAt = simulation.nextArrivalAt;
  let nextSequence = simulation.nextSequence;
  if (now >= simulation.nextArrivalAt) {
    const availableShops = shops.filter((shop) => {
      const occupancy = visitors.filter(
        (visitor) => visitor.shopBuildingId === shop.building.id && visitor.phase !== "leaving",
      ).length;
      const productStock = getShopProductStock(shop, state, productsSold);
      const queueCapacity = shop.definition.visitorService?.queueCapacity ?? 0;
      const availableQueueCapacity = productStock === null
        ? queueCapacity
        : Math.min(queueCapacity, productStock);
      return occupancy < availableQueueCapacity;
    });
    if (availableShops.length > 0 && visitors.length < SHOP_VISITOR_MAX_TOTAL) {
      const shop = availableShops[Math.min(
        availableShops.length - 1,
        Math.floor(random() * availableShops.length),
      )];
      visitors = [...visitors, createVisitor(shop, simulation, now, random)];
      nextSequence += 1;
      nextArrivalAt = now + randomBetween(
        SHOP_VISITOR_ARRIVAL_MIN_MS,
        SHOP_VISITOR_ARRIVAL_MAX_MS,
        random,
      );
    } else {
      nextArrivalAt = now + SHOP_VISITOR_RETRY_MS;
    }
  }

  return {
    simulation: { visitors, nextArrivalAt, nextSequence },
    coinsEarned,
    productsSold,
    pizzasSold: productsSold.pizza ?? 0,
  };
}
