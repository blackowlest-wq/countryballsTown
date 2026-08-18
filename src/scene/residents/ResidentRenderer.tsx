import { useGameStore } from "../../store/gameStore";
import { CountryBall } from "./CountryBall";

export function ResidentRenderer(): JSX.Element {
  const residents = useGameStore((store) => store.game.residents);
  return (
    <group>
      {residents.map((resident) => (
        <CountryBall key={resident.id} resident={resident} />
      ))}
    </group>
  );
}
