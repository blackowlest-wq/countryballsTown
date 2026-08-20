import { getMilkFactoryProductName } from "../game/systems/MilkFactorySystem";
import type { MilkFactoryProductType } from "../game/types/MilkFactory";
import { useGameStore } from "../store/gameStore";

const products: Array<{ type: MilkFactoryProductType; icon: string }> = [
  { type: "butter", icon: "🧈" },
  { type: "cheese", icon: "🧀" },
];

export function MilkFactoryPanel(): JSX.Element | null {
  const buildingId = useGameStore((store) => store.milkFactoryPanelBuildingId);
  const production = useGameStore((store) => store.game.milkFactoryProductions.find(
    (candidate) => candidate.buildingInstanceId === buildingId,
  ));
  const configure = useGameStore((store) => store.configureMilkFactory);
  const close = useGameStore((store) => store.closeMilkFactoryPanel);
  if (!buildingId || !production) return null;

  return (
    <section className="floating-panel milk-factory-panel" aria-label="牛乳工場の設定">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">MILK FACTORY</p>
          <h2>牛乳工場</h2>
        </div>
        <button className="icon-button" type="button" onClick={close} aria-label="閉じる">×</button>
      </div>
      <p className="panel-hint">
        {production.productType
          ? `${getMilkFactoryProductName(production.productType)}を作っています。作るものを変更できます。`
          : "何を作るか選んでください。牛乳1個から20秒ごとに1個作ります。"}
      </p>
      <div className="factory-product-options" role="group" aria-label="作る加工物を選ぶ">
        {products.map(({ type, icon }) => (
          <button
            key={type}
            type="button"
            className="factory-product-option"
            data-product={type}
            aria-pressed={production.productType === type}
            onClick={() => configure(buildingId, type)}
          >
            <span className="factory-product-icon" aria-hidden="true">{icon}</span>
            <span>{getMilkFactoryProductName(type)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
