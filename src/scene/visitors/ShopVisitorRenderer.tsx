import { useGameStore } from "../../store/gameStore";
import { ShopVisitorCharacter } from "./ShopVisitorCharacter";

export function ShopVisitorRenderer(): JSX.Element {
  const visitors = useGameStore((store) => store.visitorSimulation.visitors);
  return (
    <group>
      {visitors.map((visitor) => (
        <ShopVisitorCharacter key={visitor.id} visitor={visitor} />
      ))}
    </group>
  );
}
