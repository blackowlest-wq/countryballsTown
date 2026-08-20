import { useGameStore } from "../store/gameStore";

export function FarmControls(): JSX.Element | null {
  const interactionMode = useGameStore((store) => store.interactionMode);
  const wheatAction = useGameStore((store) => store.wheatAction);
  const setWheatAction = useGameStore((store) => store.setWheatAction);
  if (interactionMode !== "farm") return null;

  return (
    <section className="farm-controls" aria-label="小麦の操作">
      <div className="farm-action-buttons" role="group" aria-label="栽培操作を選ぶ">
        <button
          type="button"
          className="farm-action-button"
          data-action="plant"
          aria-pressed={wheatAction === "plant"}
          onClick={() => setWheatAction("plant")}
        >
          <span aria-hidden="true">🌱</span>
          種まき
        </button>
        <button
          type="button"
          className="farm-action-button"
          data-action="harvest"
          aria-pressed={wheatAction === "harvest"}
          onClick={() => setWheatAction("harvest")}
        >
          <span aria-hidden="true">🧺</span>
          収穫
        </button>
      </div>
      <span className="farm-action-copy">
        {wheatAction === "plant"
          ? "空の畑をなぞる（種を1個使用）"
          : "茶色の小麦を収穫（種を2個獲得）"}
      </span>
    </section>
  );
}
