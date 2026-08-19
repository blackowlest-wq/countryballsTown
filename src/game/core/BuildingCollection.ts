import type { BuildingInstance } from "../types/Building";

export interface BuildingCollectionEntry {
  source: BuildingInstance;
  building: BuildingInstance;
}

export type BuildingLookupResult =
  | { status: "found"; building: BuildingInstance; index: number }
  | { status: "not-found" }
  | { status: "duplicate-id" };

export interface BuildingCollection {
  entries: readonly BuildingCollectionEntry[];
  buildings: BuildingInstance[];
  nextId: () => string;
  findUnique: (instanceId: string) => BuildingLookupResult;
  idFor: (source: BuildingInstance) => string | undefined;
}

function isUsableId(id: unknown): id is string {
  return typeof id === "string" && id.trim().length > 0;
}

export function createBuildingCollection(source: BuildingInstance[]): BuildingCollection {
  const reservedIds = new Set(
    source.map((building) => building.id).filter(isUsableId),
  );
  const seenIds = new Set<string>();
  let nextSequence = source.length + 1;
  let changed = false;

  const nextId = (): string => {
    while (reservedIds.has(`building-${nextSequence}`)) nextSequence += 1;
    const id = `building-${nextSequence}`;
    nextSequence += 1;
    reservedIds.add(id);
    return id;
  };

  const entries = source.map((sourceBuilding): BuildingCollectionEntry => {
    if (isUsableId(sourceBuilding.id) && !seenIds.has(sourceBuilding.id)) {
      seenIds.add(sourceBuilding.id);
      return { source: sourceBuilding, building: sourceBuilding };
    }

    const building = { ...sourceBuilding, id: nextId() };
    seenIds.add(building.id);
    changed = true;
    return { source: sourceBuilding, building };
  });
  const buildings = changed ? entries.map((entry) => entry.building) : source;

  return {
    entries,
    buildings,
    nextId,
    findUnique: (instanceId) => {
      const sourceMatches = entries
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => entry.source.id === instanceId);
      if (sourceMatches.length > 1) return { status: "duplicate-id" };
      if (sourceMatches.length === 1) {
        const [{ entry, index }] = sourceMatches;
        return { status: "found", building: entry.building, index };
      }

      const normalizedIndex = entries.findIndex(
        (entry) => entry.building.id === instanceId,
      );
      if (normalizedIndex < 0) return { status: "not-found" };
      return {
        status: "found",
        building: entries[normalizedIndex].building,
        index: normalizedIndex,
      };
    },
    idFor: (sourceBuilding) => entries.find(
      (entry) => entry.source === sourceBuilding,
    )?.building.id,
  };
}
