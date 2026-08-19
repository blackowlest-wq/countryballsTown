import type { BuildingDefinition } from "../types/Building";

export const buildingDefinitions: BuildingDefinition[] = [
  {
    id: "house",
    name: "家",
    width: 2,
    height: 2,
    cost: 0,
    category: "building",
    residentCollision: "blocking",
    residentCollisionPadding: { x: 0.9, z: 0.75 },
    description: "ポーランドの小さな住まい。",
    movable: false,
    removable: false,
  },
  {
    id: "fountain",
    name: "噴水",
    width: 2,
    height: 2,
    cost: 0,
    category: "decoration",
    residentCollision: "blocking",
    residentCollisionPadding: { x: 0.95, z: 0.95 },
    description: "村の中央で水音を奏でる噴水。",
    movable: false,
    removable: false,
  },
  {
    id: "tree",
    name: "木",
    width: 1,
    height: 1,
    cost: 20,
    category: "decoration",
    residentCollision: "blocking",
    residentCollisionPadding: { x: 1.1, z: 1.1 },
    description: "村に緑を増やす木。",
    removable: true,
  },
  {
    id: "flower",
    name: "花",
    width: 1,
    height: 1,
    cost: 10,
    category: "decoration",
    residentCollision: "passable",
    description: "カラフルな小さな花。",
    removable: true,
  },
  {
    id: "onsen",
    name: "温泉",
    width: 3,
    height: 2,
    cost: 100,
    category: "building",
    residentCollision: "passable",
    countryId: "japan",
    interactionType: "onsen",
    description: "日本の旅人がひと休みできる温泉。",
    removable: true,
  },
  {
    id: "torii",
    name: "鳥居",
    width: 1,
    height: 1,
    cost: 50,
    category: "decoration",
    residentCollision: "passable",
    countryId: "japan",
    description: "日本エリアの入口を彩る鳥居。",
    removable: true,
  },
  {
    id: "pizza-shop",
    name: "ピザ屋",
    width: 3,
    height: 2,
    cost: 150,
    category: "building",
    residentCollision: "blocking",
    residentCollisionPadding: { x: 0.7, z: 0.7 },
    countryId: "italy",
    interactionType: "pizza-shop",
    description: "イタリアの旅人が働く小さなピザ屋。",
    removable: true,
  },
];

export const buildingsById = Object.fromEntries(
  buildingDefinitions.map((building) => [building.id, building]),
) as Record<string, BuildingDefinition>;

export function getBuildingDefinition(buildingId: string): BuildingDefinition | undefined {
  return buildingsById[buildingId];
}

export const playerBuildingIds = ["tree", "flower", "onsen", "torii", "pizza-shop"];
