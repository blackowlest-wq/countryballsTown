import type { MapId } from "../types/Map";

export interface MapDefinition {
  id: MapId;
  name: string;
  icon: string;
  description: string;
}

export const mapDefinitions: readonly MapDefinition[] = [
  {
    id: "village",
    name: "村",
    icon: "🏡",
    description: "建物を置いて、住民と暮らせます。",
  },
  {
    id: "sea-and-river",
    name: "海と川",
    icon: "🌊",
    description: "海岸で釣り、川辺で遊べます。",
  },
  {
    id: "cave",
    name: "洞窟",
    icon: "⛰️",
    description: "静かな洞窟の中を探検できます。",
  },
];

export function getMapDefinition(mapId: MapId): MapDefinition {
  return mapDefinitions.find((definition) => definition.id === mapId) ?? mapDefinitions[0];
}
