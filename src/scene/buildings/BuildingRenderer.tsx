import { useLayoutEffect, useMemo, useRef, type ComponentType } from "react";
import type { Group, Material, Object3D } from "three";
import { useGameStore } from "../../store/gameStore";
import { createBuildingCollection } from "../../game/core/BuildingCollection";
import { getBuildingDefinition } from "../../game/data/buildings";
import type { BuildingInstance } from "../../game/types/Building";
import { buildingToWorldPosition } from "../../utils/grid";
import { House } from "./House";
import { Cow } from "./Cow";
import { Pig } from "./Pig";
import { Chicken } from "./Chicken";
import { Fence } from "./Fence";
import { Road } from "./Road";
import { MilkFactory } from "./MilkFactory";
import { PorkFactory } from "./PorkFactory";
import { WheatFactory } from "./WheatFactory";
import { Bakery } from "./Bakery";
import { RiceShop } from "./RiceShop";
import { FishShop } from "./FishShop";
import { Field } from "./Field";
import { Onsen } from "./Onsen";
import { PizzaShop } from "./PizzaShop";
import { Torii } from "./Torii";
import { CherryTree } from "../environment/CherryTree";
import { Flower } from "../environment/Flower";
import { Fountain } from "../environment/Fountain";
import { Tree } from "../environment/Tree";
import type { AnimalWanderFence } from "./animalWander";

const buildingRenderers: Record<string, ComponentType> = {
  house: House,
  fountain: Fountain,
  field: Field,
  tree: Tree,
  "cherry-tree": CherryTree,
  flower: Flower,
  onsen: Onsen,
  torii: Torii,
  fence: Fence,
  road: Road,
  "pizza-shop": PizzaShop,
  bakery: Bakery,
  "rice-shop": RiceShop,
  "fish-shop": FishShop,
};

interface BuildingInstanceRendererProps {
  instance: BuildingInstance;
  selectionSource: BuildingInstance;
  fencePositions: readonly AnimalWanderFence[];
}

const PLACEMENT_BUILDING_OPACITY = 0.28;

function getBuildingRenderKey(building: BuildingInstance): string {
  // Legacy saves may reuse an ID; include the rendered content so a removed
  // building's Three.js subtree cannot be reused for another entry.
  return JSON.stringify([
    building.id,
    building.buildingId,
    building.gridX,
    building.gridY,
  ]);
}

interface OriginalMaterialState {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
}

type MaterialObject = Object3D & {
  material?: Material | Material[];
};

function setPlacementVisibility(
  root: Group,
  faded: boolean,
  materialStates: Map<Material, OriginalMaterialState>,
): void {
  if (typeof root.traverse !== "function") return;

  root.traverse((object) => {
    const material = (object as MaterialObject).material;
    if (!material) return;
    const materials = Array.isArray(material) ? material : [material];

    materials.forEach((currentMaterial) => {
      if (faded) {
        if (!materialStates.has(currentMaterial)) {
          materialStates.set(currentMaterial, {
            opacity: currentMaterial.opacity,
            transparent: currentMaterial.transparent,
            depthWrite: currentMaterial.depthWrite,
          });
        }
        currentMaterial.transparent = true;
        currentMaterial.opacity = Math.min(
          currentMaterial.opacity,
          PLACEMENT_BUILDING_OPACITY,
        );
        currentMaterial.depthWrite = false;
        currentMaterial.needsUpdate = true;
        return;
      }

      const original = materialStates.get(currentMaterial);
      if (!original) return;
      currentMaterial.opacity = original.opacity;
      currentMaterial.transparent = original.transparent;
      currentMaterial.depthWrite = original.depthWrite;
      currentMaterial.needsUpdate = true;
    });
  });

  if (!faded) materialStates.clear();
}

function BuildingInstanceRenderer({
  instance,
  selectionSource,
  fencePositions,
}: BuildingInstanceRendererProps): JSX.Element | null {
  const definition = getBuildingDefinition(instance.buildingId);
  const Renderer = definition ? buildingRenderers[instance.buildingId] : undefined;
  const selectedBuildingId = useGameStore((store) => store.selectedBuildingId);
  const interactionMode = useGameStore((store) => store.interactionMode);
  const group = useRef<Group>(null);
  const materialStates = useRef(new Map<Material, OriginalMaterialState>());
  const selectBuilding = useGameStore((store) => store.selectBuilding);
  const openMilkFactoryPanel = useGameStore((store) => store.openMilkFactoryPanel);
  const openPorkFactoryPanel = useGameStore((store) => store.openPorkFactoryPanel);
  const openWheatFactoryPanel = useGameStore((store) => store.openWheatFactoryPanel);
  const collectCowMilk = useGameStore((store) => store.collectCowMilk);
  const collectPigPork = useGameStore((store) => store.collectPigPork);
  const collectChickenEggs = useGameStore((store) => store.collectChickenEggs);
  const cowProduction = useGameStore((store) => store.game.cowProductions.find(
    (production) => production.buildingInstanceId === instance.id,
  ));
  const isCow = instance.buildingId === "cow";
  const isPig = instance.buildingId === "pig";
  const isChicken = instance.buildingId === "chicken";
  const isMilkFactory = instance.buildingId === "milk-factory";
  const isPorkFactory = instance.buildingId === "pork-factory";
  const isWheatFactory = instance.buildingId === "wheat-factory";
  const milkFactoryProduction = useGameStore((store) => store.game.milkFactoryProductions.find(
    (production) => production.buildingInstanceId === instance.id,
  ));
  const pigProduction = useGameStore((store) => store.game.pigProductions.find(
    (production) => production.buildingInstanceId === instance.id,
  ));
  const chickenProduction = useGameStore((store) => store.game.chickenProductions.find(
    (production) => production.buildingInstanceId === instance.id,
  ));
  const porkFactoryProduction = useGameStore((store) => store.game.porkFactoryProductions.find(
    (production) => production.buildingInstanceId === instance.id,
  ));
  const wheatFactoryProduction = useGameStore((store) => store.game.wheatFactoryProductions.find(
    (production) => production.buildingInstanceId === instance.id,
  ));
  const isPlacementMode = interactionMode === "build" || interactionMode === "move";

  useLayoutEffect(() => {
    if (!group.current) return;
    setPlacementVisibility(group.current, isPlacementMode, materialStates.current);
    return () => {
      if (group.current) {
        setPlacementVisibility(group.current, false, materialStates.current);
      }
    };
  }, [isPlacementMode]);

  if (!definition || (!Renderer && !isCow && !isPig && !isChicken && !isMilkFactory && !isPorkFactory && !isWheatFactory)) return null;
  const position = buildingToWorldPosition(instance, definition.width, definition.height);
  const selected = selectedBuildingId === instance.id && interactionMode !== "build";

  return (
    <group
      ref={group}
      position={[position.x, 0, position.z]}
      onClick={(event) => {
        if (interactionMode !== "inspect") return;
        event.stopPropagation();
        if (isCow && collectCowMilk(instance.id) === "collected") return;
        if (isPig && collectPigPork(instance.id) === "collected") return;
        if (isChicken && collectChickenEggs(instance.id) === "collected") return;
        if (isMilkFactory && !milkFactoryProduction?.productType) {
          openMilkFactoryPanel(instance.id);
          return;
        }
        if (isPorkFactory && !porkFactoryProduction?.productType) {
          openPorkFactoryPanel(instance.id);
          return;
        }
        if (isWheatFactory && !wheatFactoryProduction?.productType) {
          openWheatFactoryPanel(instance.id);
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
        ? <Cow milkReadyAt={cowProduction?.milkReadyAt} wanderSeed={instance.id} wanderOrigin={position} wanderFences={fencePositions} />
        : isPig
          ? <Pig porkReadyAt={pigProduction?.porkReadyAt} wanderSeed={instance.id} wanderOrigin={position} wanderFences={fencePositions} />
          : isChicken
            ? <Chicken eggReadyAt={chickenProduction?.eggReadyAt} wanderSeed={instance.id} wanderOrigin={position} wanderFences={fencePositions} />
        : isMilkFactory
          ? <MilkFactory productType={milkFactoryProduction?.productType} />
          : isPorkFactory
            ? <PorkFactory productType={porkFactoryProduction?.productType} />
          : isWheatFactory
            ? <WheatFactory productType={wheatFactoryProduction?.productType} />
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
  const fencePositions = useMemo(
    () => collection.buildings
      .filter((building) => building.buildingId === "fence")
      .map((building) => buildingToWorldPosition(building, 1, 1)),
    [collection],
  );
  return (
    <group>
      {collection.entries.map(({ building, source }) => (
        <BuildingInstanceRenderer
          key={getBuildingRenderKey(building)}
          instance={building}
          selectionSource={source}
          fencePositions={fencePositions}
        />
      ))}
    </group>
  );
}
