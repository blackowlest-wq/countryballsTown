import type {
  BuildDistrictId,
  DistrictDefinition,
  DistrictId,
} from "../types/District";

const commercialBuildingIds = [
  "pizza-shop",
  "rice-shop",
  "fish-shop",
  "chinese-restaurant",
  "burger-shop",
] as const;
const factoryBuildingIds = ["milk-factory", "pork-factory", "wheat-factory"] as const;

export const districtDefinitions: readonly (Omit<DistrictDefinition, "id"> & { id: DistrictId })[] = [
  {
    id: "agriculture",
    name: "農業地区",
    icon: "🌾",
    description: "畑とパン屋、倉庫をまとめて食料を育てる地区。",
    allowedBuildingIds: ["field", "bakery", "warehouse"],
    requirements: [
      { type: "building-count", buildingIds: ["field"], target: 3, label: "畑" },
      { type: "building-count", buildingIds: ["bakery"], target: 1, label: "パン屋" },
      { type: "building-count", buildingIds: ["warehouse"], target: 1, label: "倉庫" },
    ],
  },
  {
    id: "commercial",
    name: "商業地区",
    icon: "🏪",
    description: "さまざまな店が集まり、村の品物を届ける地区。",
    allowedBuildingIds: commercialBuildingIds,
    requirements: [
      {
        type: "distinct-building-count",
        buildingIds: commercialBuildingIds,
        target: 3,
        label: "店舗3種類",
      },
    ],
  },
  {
    id: "nature-park",
    name: "自然公園",
    icon: "🌳",
    description: "木々と花に囲まれ、温泉も楽しめる憩いの地区。",
    allowedBuildingIds: ["tree", "cherry-tree", "flower", "onsen"],
    requirements: [
      { type: "building-count", buildingIds: ["tree", "cherry-tree"], target: 5, label: "木" },
      { type: "building-count", buildingIds: ["flower"], target: 8, label: "花" },
      { type: "building-count", buildingIds: ["onsen"], target: 1, label: "温泉" },
    ],
  },
  {
    id: "industrial",
    name: "工業地区",
    icon: "🏭",
    description: "3種類の工場で村の加工品を生産する地区。",
    allowedBuildingIds: factoryBuildingIds,
    requirements: [
      {
        type: "distinct-building-count",
        buildingIds: factoryBuildingIds,
        target: 3,
        label: "工場3種類",
      },
    ],
  },
];

export const commonDistrictDefinition: DistrictDefinition = {
  id: "common",
  name: "共通設備",
  icon: "🧰",
  description: "道や柵、家畜、その他の設備を配置する場所。",
  allowedBuildingIds: [
    "fence",
    "road",
    "ore-workshop",
    "cow",
    "pig",
    "chicken",
    "torii",
    "great-wall",
    "statue-of-liberty",
  ],
  requirements: [],
};

export const buildDistrictDefinitions: readonly DistrictDefinition[] = [
  ...districtDefinitions,
  commonDistrictDefinition,
];

export function getDistrictDefinition(
  districtId: BuildDistrictId,
): DistrictDefinition | undefined {
  return buildDistrictDefinitions.find((definition) => definition.id === districtId);
}

export function getDistrictForBuilding(buildingId: string): BuildDistrictId | undefined {
  return buildDistrictDefinitions.find((definition) =>
    definition.allowedBuildingIds.includes(buildingId),
  )?.id;
}

export function isDistrictId(value: string): value is DistrictId {
  return districtDefinitions.some((definition) => definition.id === value);
}
