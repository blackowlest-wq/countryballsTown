import { getPorkFactoryProductName } from "../game/systems/PorkFactorySystem";
import type { PorkFactoryProductType } from "../game/types/PorkFactory";
import { useGameStore } from "../store/gameStore";
import { UpgradeControls } from "./UpgradeControls";

const products: Array<{ type: PorkFactoryProductType; icon: string }> = [
  { type: "ham", icon: "🍖" },
  { type: "sausage", icon: "🌭" },
  { type: "bacon", icon: "🥓" },
];

export function PorkFactoryPanel(): JSX.Element | null {
  const buildingId = useGameStore((store) => store.porkFactoryPanelBuildingId);
  const production = useGameStore((store) => store.game.porkFactoryProductions.find(
    (candidate) => candidate.buildingInstanceId === buildingId,
  ));
  const configure = useGameStore((store) => store.configurePorkFactory);
  const close = useGameStore((store) => store.closePorkFactoryPanel);
  if (!buildingId || !production) return null;

  return (
    <section className="floating-panel pork-factory-panel" aria-label="豚肉工場の設定">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">PORK FACTORY</p>
          <h2>豚肉工場</h2>
        </div>
        <button className="icon-button" type="button" onClick={close} aria-label="閉じる">×</button>
      </div>
      <p className="panel-hint">
        {production.productType
          ? `${getPorkFactoryProductName(production.productType)}を作っています。作るものを変更できます。`
          : "何を作るか選んでください。豚肉1個から20秒ごとに3個作ります。"}
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
            <span>{getPorkFactoryProductName(type)}</span>
          </button>
        ))}
      </div>
      <UpgradeControls buildingId={buildingId} upgradeTypes={["production-speed"]} />
    </section>
  );
}
