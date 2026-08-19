import type { ResidentRequestDefinition } from "../types/ResidentRequest";

export const residentRequestDefinitions: ResidentRequestDefinition[] = [
  {
    id: "poland-tree-shade",
    countryId: "poland",
    message: "木陰がもっとほしい",
    goal: {
      type: "place-building",
      buildingIds: ["tree"],
      target: 2,
      progressLabel: "木を置く",
    },
    rewardCoins: 40,
  },
  {
    id: "poland-flower-field",
    countryId: "poland",
    message: "花畑を見てみたい",
    goal: {
      type: "place-building",
      buildingIds: ["flower"],
      target: 3,
      progressLabel: "花を置く",
    },
    rewardCoins: 50,
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
    rewardCoins: 30,
  },
  {
    id: "japan-more-flowers",
    countryId: "japan",
    message: "花がもっとほしい",
    goal: {
      type: "place-building",
      buildingIds: ["flower"],
      target: 3,
      progressLabel: "花を置く",
    },
    rewardCoins: 50,
  },
  {
    id: "japan-torii-view",
    countryId: "japan",
    message: "鳥居のある景色が見たい",
    goal: {
      type: "place-building",
      buildingIds: ["torii"],
      target: 1,
      progressLabel: "鳥居を置く",
    },
    rewardCoins: 70,
  },
  {
    id: "japan-hot-spring",
    countryId: "japan",
    message: "温泉であたたまりたい",
    goal: {
      type: "place-building",
      buildingIds: ["onsen"],
      target: 1,
      progressLabel: "温泉を置く",
    },
    rewardCoins: 100,
  },
  {
    id: "japan-green-walk",
    countryId: "japan",
    message: "緑の散歩道がほしい",
    goal: {
      type: "place-building",
      buildingIds: ["tree", "flower"],
      target: 3,
      progressLabel: "木か花を置く",
    },
    rewardCoins: 60,
  },
  {
    id: "italy-pizza-work",
    countryId: "italy",
    message: "ピザ屋で働きたい",
    goal: {
      type: "place-building",
      buildingIds: ["pizza-shop"],
      target: 1,
      progressLabel: "ピザ屋を置く",
    },
    rewardCoins: 120,
  },
  {
    id: "italy-shop-flowers",
    countryId: "italy",
    message: "お店のまわりを花で飾りたい",
    goal: {
      type: "place-building",
      buildingIds: ["flower"],
      target: 2,
      progressLabel: "花を置く",
    },
    rewardCoins: 50,
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
    rewardCoins: 70,
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
