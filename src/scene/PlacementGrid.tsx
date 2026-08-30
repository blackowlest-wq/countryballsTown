import { useMemo } from "react";
import { GRID_SIZE } from "../game/constants/gameConstants";
import { getBuildingDefinition } from "../game/data/buildings";
import { canPlaceBuilding } from "../game/systems/BuildingSystem";
import { useGameStore } from "../store/gameStore";
import { gridToWorld } from "../utils/grid";

export function PlacementGrid(): JSX.Element | null {
  const game = useGameStore((store) => store.game);
  const mode = useGameStore((store) => store.interactionMode);
  const selectedBuildingId = useGameStore((store) => store.selectedBuildingId);
  const selectedDistrictId = useGameStore((store) => store.selectedDistrictId);

  const selectedForMove = useMemo(() => {
    if (mode !== "move" || !selectedBuildingId) return undefined;
    return game.buildings.find((building) => building.id === selectedBuildingId);
  }, [game.buildings, mode, selectedBuildingId]);

  const buildingId = mode === "move" ? selectedForMove?.buildingId : selectedBuildingId;
  const resolvedBuildingId = buildingId ?? "";
  const definition = resolvedBuildingId ? getBuildingDefinition(resolvedBuildingId) : undefined;
  const cells = useMemo(
    () =>
      definition
        ? Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
            const x = index % GRID_SIZE;
            const z = Math.floor(index / GRID_SIZE);
            const result = canPlaceBuilding(
              game,
              resolvedBuildingId,
              x,
              z,
              mode === "move" ? selectedBuildingId ?? undefined : undefined,
              mode === "build" ? selectedDistrictId : undefined,
            );
            return { x, z, valid: result.ok };
          })
        : [],
    [resolvedBuildingId, definition, game, mode, selectedBuildingId, selectedDistrictId],
  );

  if (!definition || (mode !== "build" && mode !== "move")) return null;

  return (
    <group>
      {cells.map((cell) => {
        const position = gridToWorld({ x: cell.x, z: cell.z });
        return (
          <mesh
            key={`${cell.x}-${cell.z}`}
            position={[position.x, 0.012, position.z]}
            rotation-x={-Math.PI / 2}
            renderOrder={10}
          >
            <planeGeometry args={[0.9, 0.9]} />
            <meshBasicMaterial
              color={cell.valid ? "#6fd39a" : "#eb7b7b"}
              transparent
              opacity={0.3}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
