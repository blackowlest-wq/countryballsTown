import type { ResidentRequestDefinition } from "../types/ResidentRequest";

export const residentRequestDefinitions: ResidentRequestDefinition[] = [
  {
    id: "poland-tree-shade",
    countryId: "poland",
    message: "木陰がもっとほしい",
    goal: {
      type: "building-count",
      buildingIds: ["tree", "cherry-tree"],
      target: 2,
      progressLabel: "木をそろえる",
    },
    rewardCoins: 4,
  },
  {
    id: "poland-flower-field",
    countryId: "poland",
    message: "花畑を見てみたい",
    goal: {
      type: "building-count",
      buildingIds: ["flower"],
      target: 3,
      progressLabel: "花をそろえる",
    },
    rewardCoins: 5,
  },
  {
    id: "poland-village-savings",
    countryId: "poland",
    message: "村のお金をためたい",
    goal: {
      type: "earn-coins",
      target: 20,
      progressLabel: "コインを集める",
    },
    rewardCoins: 3,
  },
  {
    id: "japan-more-flowers",
    countryId: "japan",
    message: "花がもっとほしい",
    goal: {
      type: "building-count",
      buildingIds: ["flower"],
      target: 3,
      progressLabel: "花をそろえる",
    },
    rewardCoins: 5,
  },
  {
    id: "japan-torii-view",
    countryId: "japan",
    message: "鳥居のある景色が見たい",
    goal: {
      type: "building-count",
      buildingIds: ["torii"],
      target: 1,
      progressLabel: "鳥居を建てる",
    },
    rewardCoins: 7,
  },
  {
    id: "japan-hot-spring",
    countryId: "japan",
    message: "温泉であたたまりたい",
    goal: {
      type: "building-count",
      buildingIds: ["onsen"],
      target: 1,
      progressLabel: "温泉を建てる",
    },
    rewardCoins: 10,
  },
  {
    id: "japan-green-walk",
    countryId: "japan",
    message: "緑の散歩道がほしい",
    goal: {
      type: "building-count",
      buildingIds: ["tree", "cherry-tree", "flower"],
      target: 3,
      progressLabel: "木か花をそろえる",
    },
    rewardCoins: 6,
  },
  {
    id: "italy-pizza-work",
    countryId: "italy",
    message: "ピザ屋で働きたい",
    goal: {
      type: "building-count",
      buildingIds: ["pizza-shop"],
      target: 1,
      progressLabel: "ピザ屋を建てる",
    },
    rewardCoins: 12,
  },
  {
    id: "italy-shop-flowers",
    countryId: "italy",
    message: "お店のまわりを花で飾りたい",
    goal: {
      type: "building-count",
      buildingIds: ["flower"],
      target: 2,
      progressLabel: "花をそろえる",
    },
    rewardCoins: 5,
  },
  {
    id: "italy-festival-savings",
    countryId: "italy",
    message: "お祭りのためにコインを集めたい",
    goal: {
      type: "earn-coins",
      target: 40,
      progressLabel: "コインを集める",
    },
    rewardCoins: 7,
  },
  {
    id: "china-restaurant-work",
    countryId: "china",
    message: "中華食堂で腕をふるいたい",
    goal: {
      type: "building-count",
      buildingIds: ["chinese-restaurant"],
      target: 1,
      progressLabel: "中華食堂を建てる",
    },
    rewardCoins: 13,
  },
  {
    id: "usa-burger-shop",
    countryId: "usa",
    message: "ハンバーガーを売りたい",
    goal: {
      type: "building-count",
      buildingIds: ["burger-shop"],
      target: 1,
      progressLabel: "ハンバーガーショップを建てる",
    },
    rewardCoins: 14,
  },
];

export const residentRequestsById = Object.fromEntries(
  residentRequestDefinitions.map((definition) => [definition.id, definition]),
) as Record<string, ResidentRequestDefinition>;

export function getResidentRequestDefinition(
  definitionId: string,
): ResidentRequestDefinition | undefined {
  return residentRequestsById[definitionId];
}
