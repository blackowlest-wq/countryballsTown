import type {
  MiningInventory,
  MiningResourceCategory,
  MiningResourceType,
} from "../types/Mining";

export interface MiningResourceDefinition {
  type: MiningResourceType;
  category: MiningResourceCategory;
  name: string;
  icon: string;
  description: string;
  hardness: number;
}

export const miningResourceDefinitions: readonly MiningResourceDefinition[] = [
  {
    type: "copper",
    category: "mineral",
    name: "銅",
    icon: "🟤",
    description: "洞窟の浅い場所で見つかる赤茶色の鉱物。",
    hardness: 1,
  },
  {
    type: "iron",
    category: "mineral",
    name: "鉄",
    icon: "⚙️",
    description: "道具や建物の材料になる重い鉱物。",
    hardness: 2,
  },
  {
    type: "gold",
    category: "mineral",
    name: "金",
    icon: "🟡",
    description: "深い場所で見つかる輝く鉱物。",
    hardness: 3,
  },
  {
    type: "diamond",
    category: "mineral",
    name: "ダイヤモンド",
    icon: "💎",
    description: "最も硬い岩の奥に眠る貴重な鉱物。",
    hardness: 4,
  },
  {
    type: "fossil",
    category: "fossil",
    name: "化石",
    icon: "🦴",
    description: "大昔の生き物の姿を残した化石。",
    hardness: 2,
  },
  {
    type: "crystal",
    category: "mineral",
    name: "水晶",
    icon: "🔷",
    description: "洞窟の壁に育った透明な結晶。",
    hardness: 2,
  },
  {
    type: "amber",
    category: "fossil",
    name: "琥珀",
    icon: "🟠",
    description: "遠い昔の樹液が固まった黄金色の石。",
    hardness: 3,
  },
  {
    type: "ancient-relic",
    category: "artifact",
    name: "古代遺物",
    icon: "🏺",
    description: "洞窟の奥に残された、用途不明の遺物。",
    hardness: 3,
  },
  {
    type: "glowing-mushroom",
    category: "cave-life",
    name: "光るキノコ",
    icon: "🍄",
    description: "暗い洞窟の中で淡く光るキノコ。",
    hardness: 1,
  },
];

const miningResourceTypes = miningResourceDefinitions.map((definition) => definition.type);

export function createInitialMiningInventory(): MiningInventory {
  return miningResourceDefinitions.reduce<MiningInventory>((inventory, definition) => {
    inventory[definition.type] = 0;
    return inventory;
  }, {} as MiningInventory);
}

function normalizeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

export function normalizeMiningInventory(value: unknown): MiningInventory {
  const candidate = value && typeof value === "object"
    ? value as Partial<Record<MiningResourceType, unknown>>
    : {};
  return miningResourceTypes.reduce<MiningInventory>((inventory, type) => {
    inventory[type] = normalizeCount(candidate[type]);
    return inventory;
  }, {} as MiningInventory);
}

export function getMiningResourceDefinition(
  resourceType: MiningResourceType,
): MiningResourceDefinition {
  return miningResourceDefinitions.find((definition) => definition.type === resourceType)
    ?? miningResourceDefinitions[0];
}
