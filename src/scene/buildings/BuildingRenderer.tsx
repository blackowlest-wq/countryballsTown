import type { ComponentType } from "react";
import { useGameStore } from "../../store/gameStore";
import { getBuildingDefinition } from "../../game/data/buildings";
import type { BuildingInstance } from "../../game/types/Building";
import { buildingToWorldPosition } from "../../utils/grid";
import { House } from "./House";
import { Onsen } from "./Onsen";
import { PizzaShop } from "./PizzaShop";
import { Torii } from "./Torii";
import { Flower } from "../environment/Flower";
import { Fountain } from "../environment/Fountain";
import { Tree } from "../environment/Tree";

const buildingRenderers: Record<string, ComponentType> = {
  house: House,
  fountain: Fountain,
  tree: Tree,
  flower: Flower,
  onsen: Onsen,
  torii: Torii,
  "pizza-shop": PizzaShop,
};

interface BuildingInstanceRendererProps {
  instance: BuildingInstance;
}

function BuildingInstanceRenderer({ instance }: BuildingInstanceRendererProps): JSX.Element | null {
  const definition = getBuildingDefinition(instance.buildingId);
  const Renderer = definition ? buildingRenderers[instance.buildingId] : undefined;
  const selectedBuildingId = useGameStore((store) => store.selectedBuildingId);
  const interactionMode = useGameStore((store) => store.interactionMode);
  const selectBuilding = useGameStore((store) => store.selectBuilding);
  if (!definition || !Renderer) return null;
  const position = buildingToWorldPosition(instance, definition.width, definition.height);
  const selected = selectedBuildingId === instance.id && interactionMode !== "build";

  return (
    <group
      position={[position.x, 0, position.z]}
      onClick={(event) => {
        event.stopPropagation();
        if (interactionMode === "build") return;
        selectBuilding(instance.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <Renderer />
      {selected && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 0]}>
          <ringGeometry args={[Math.max(definition.width, definition.height) * 0.47, Math.max(definition.width, definition.height) * 0.55, 32]} />
          <meshBasicMaterial color="#f2a65a" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

export function BuildingRenderer(): JSX.Element {
  const buildings = useGameStore((store) => store.game.buildings);
  return (
    <group>
      {buildings.map((instance) => (
        <BuildingInstanceRenderer key={instance.id} instance={instance} />
      ))}
    </group>
  );
}
