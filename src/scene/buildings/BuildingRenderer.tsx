import { useMemo, type ComponentType } from "react";
import { useGameStore } from "../../store/gameStore";
import { createBuildingCollection } from "../../game/core/BuildingCollection";
import { getBuildingDefinition } from "../../game/data/buildings";
import type { BuildingInstance } from "../../game/types/Building";
import { buildingToWorldPosition } from "../../utils/grid";
import { House } from "./House";
import { Cow } from "./Cow";
import { Pig } from "./Pig";
import { MilkFactory } from "./MilkFactory";
import { PorkFactory } from "./PorkFactory";
import { Field } from "./Field";
import { Onsen } from "./Onsen";
import { PizzaShop } from "./PizzaShop";
import { Torii } from "./Torii";
import { CherryTree } from "../environment/CherryTree";
import { Flower } from "../environment/Flower";
import { Fountain } from "../environment/Fountain";
import { Tree } from "../environment/Tree";

const buildingRenderers: Record<string, ComponentType> = {
  house: House,
  fountain: Fountain,
  field: Field,
  tree: Tree,
  "cherry-tree": CherryTree,
  flower: Flower,
  onsen: Onsen,
  torii: Torii,
  "pizza-shop": PizzaShop,
};

interface BuildingInstanceRendererProps {
  instance: BuildingInstance;
  selectionSource: BuildingInstance;
}

function BuildingInstanceRenderer({
  instance,
  selectionSource,
}: BuildingInstanceRendererProps): JSX.Element | null {
  const definition = getBuildingDefinition(instance.buildingId);
  const Renderer = definition ? buildingRenderers[instance.buildingId] : undefined;
  const selectedBuildingId = useGameStore((store) => store.selectedBuildingId);
  const interactionMode = useGameStore((store) => store.interactionMode);
  const selectBuilding = useGameStore((store) => store.selectBuilding);
  const openMilkFactoryPanel = useGameStore((store) => store.openMilkFactoryPanel);
  const openPorkFactoryPanel = useGameStore((store) => store.openPorkFactoryPanel);
  const collectCowMilk = useGameStore((store) => store.collectCowMilk);
  const collectPigPork = useGameStore((store) => store.collectPigPork);
  const cowProduction = useGameStore((store) => store.game.cowProductions.find(
    (production) => production.buildingInstanceId === instance.id,
  ));
  const isCow = instance.buildingId === "cow";
  const isPig = instance.buildingId === "pig";
  const isMilkFactory = instance.buildingId === "milk-factory";
  const isPorkFactory = instance.buildingId === "pork-factory";
  const milkFactoryProduction = useGameStore((store) => store.game.milkFactoryProductions.find(
    (production) => production.buildingInstanceId === instance.id,
  ));
  const pigProduction = useGameStore((store) => store.game.pigProductions.find(
    (production) => production.buildingInstanceId === instance.id,
  ));
  const porkFactoryProduction = useGameStore((store) => store.game.porkFactoryProductions.find(
    (production) => production.buildingInstanceId === instance.id,
  ));
  if (!definition || (!Renderer && !isCow && !isPig && !isMilkFactory && !isPorkFactory)) return null;
  const position = buildingToWorldPosition(instance, definition.width, definition.height);
  const selected = selectedBuildingId === instance.id && interactionMode !== "build";

  return (
    <group
      position={[position.x, 0, position.z]}
      onClick={(event) => {
        if (interactionMode !== "inspect") return;
        event.stopPropagation();
        if (isCow && collectCowMilk(instance.id) === "collected") return;
        if (isPig && collectPigPork(instance.id) === "collected") return;
        if (isMilkFactory && !milkFactoryProduction?.productType) {
          openMilkFactoryPanel(instance.id);
          return;
        }
        if (isPorkFactory && !porkFactoryProduction?.productType) {
          openPorkFactoryPanel(instance.id);
          return;
        }
        selectBuilding(selectionSource);
      }}
      onPointerOver={(event) => {
        if (interactionMode !== "inspect") return;
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      {isCow
        ? <Cow milkReadyAt={cowProduction?.milkReadyAt} wanderSeed={instance.id} />
        : isPig
          ? <Pig porkReadyAt={pigProduction?.porkReadyAt} wanderSeed={instance.id} />
        : isMilkFactory
          ? <MilkFactory productType={milkFactoryProduction?.productType} />
          : isPorkFactory
            ? <PorkFactory productType={porkFactoryProduction?.productType} />
          : Renderer && <Renderer />}
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
  const sourceBuildings = useGameStore((store) => store.game.buildings);
  const collection = useMemo(
    () => createBuildingCollection(sourceBuildings),
    [sourceBuildings],
  );
  return (
    <group>
      {collection.entries.map(({ building, source }) => (
        <BuildingInstanceRenderer
          key={building.id}
          instance={building}
          selectionSource={source}
        />
      ))}
    </group>
  );
}
