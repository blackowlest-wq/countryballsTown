import { getWheatFactoryProductName } from "../game/systems/WheatFactorySystem";
import type { WheatFactoryProductType } from "../game/types/WheatFactory";
import { useGameStore } from "../store/gameStore";

const products: Array<{ type: WheatFactoryProductType; icon: string }> = [
  { type: "wheat-flour", icon: "🌾" },
];

export function WheatFactoryPanel(): JSX.Element | null {
  const buildingId = useGameStore((store) => store.wheatFactoryPanelBuildingId);
  const production = useGameStore((store) => store.game.wheatFactoryProductions.find(
    (candidate) => candidate.buildingInstanceId === buildingId,
  ));
  const configure = useGameStore((store) => store.configureWheatFactory);
  const close = useGameStore((store) => store.closeWheatFactoryPanel);
  if (!buildingId || !production) return null;

  return (
    <section className="floating-panel wheat-factory-panel" aria-label="小麦工場の設定">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">WHEAT FACTORY</p>
          <h2>小麦工場</h2>
        </div>
        <button className="icon-button" type="button" onClick={close} aria-label="閉じる">×</button>
      </div>
      <p className="panel-hint">
        {production.productType
          ? `${getWheatFactoryProductName(production.productType)}を作っています。作るものを変更できます。`
          : "何を作るか選んでください。小麦1個から20秒ごとに小麦粉1個を作ります。"}
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
            <span>{getWheatFactoryProductName(type)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
