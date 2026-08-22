import { useGameStore } from "../store/gameStore";
import { getCropName } from "../game/systems/CropSystem";
import type { CropType } from "../game/types/Crop";

const cropOptions: Array<{ type: CropType; icon: string }> = [
  { type: "wheat", icon: "🌾" },
  { type: "tomato", icon: "🍅" },
];

export function FarmControls(): JSX.Element | null {
  const interactionMode = useGameStore((store) => store.interactionMode);
  const selectedCropType = useGameStore((store) => store.selectedCropType);
  const game = useGameStore((store) => store.game);
  const selectCropType = useGameStore((store) => store.selectCropType);
  if (interactionMode !== "farm") return null;

  return (
    <section className="farm-controls" aria-label="作物の操作">
      <div className="crop-inventory" role="group" aria-label="種を選ぶ">
        {cropOptions.map(({ type, icon }) => {
          const seeds = type === "wheat" ? game.wheatSeeds : game.tomatoSeeds;
          const harvested = type === "wheat" ? game.wheat : game.tomatoes;
          return (
            <button
              key={type}
              type="button"
              className="crop-choice-button"
              data-crop={type}
              aria-pressed={selectedCropType === type}
              aria-label={`${getCropName(type)}の種を選ぶ。種 ${seeds}、収穫 ${harvested}`}
              onClick={() => selectCropType(type)}
            >
              <span className="crop-choice-icon" aria-hidden="true">{icon}</span>
              <span className="crop-choice-copy">
                <strong>{getCropName(type)}</strong>
                <span className="crop-stock-row">
                  <span>種 <b>{seeds.toLocaleString("ja-JP")}</b></span>
                  <span>収穫 <b>{harvested.toLocaleString("ja-JP")}</b></span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="processing-stock" aria-label="素材と加工物">
        <div className="processing-stock-group">
          <span className="processing-stock-heading">素材</span>
          <div className="processing-stock-items">
            <span className="processing-stock-item" aria-label={`牛乳 ${game.milk}`}>
              <span className="processing-stock-icon milk-stock-icon" aria-hidden="true">🥛</span>
              <span>牛乳</span>
              <strong>{game.milk.toLocaleString("ja-JP")}</strong>
            </span>
            <span className="processing-stock-item" aria-label={`豚肉 ${game.pork}`}>
              <span className="processing-stock-icon pork-stock-icon" aria-hidden="true">🍖</span>
              <span>豚肉</span>
              <strong>{game.pork.toLocaleString("ja-JP")}</strong>
            </span>
            <span className="processing-stock-item" aria-label={`卵 ${game.eggs}`}>
              <span className="processing-stock-icon egg-stock-icon" aria-hidden="true">🥚</span>
              <span>卵</span>
              <strong>{game.eggs.toLocaleString("ja-JP")}</strong>
            </span>
          </div>
        </div>
        <div className="processing-stock-group">
          <span className="processing-stock-heading">加工物</span>
          <div className="processing-stock-items">
            <span className="processing-stock-item" aria-label={`バター ${game.butter}`}>
              <span className="processing-stock-icon" aria-hidden="true">🧈</span>
              <span>バター</span>
              <strong>{game.butter.toLocaleString("ja-JP")}</strong>
            </span>
            <span className="processing-stock-item" aria-label={`チーズ ${game.cheese}`}>
              <span className="processing-stock-icon" aria-hidden="true">🧀</span>
              <span>チーズ</span>
              <strong>{game.cheese.toLocaleString("ja-JP")}</strong>
            </span>
            <span className="processing-stock-item" aria-label={`ハム ${game.ham}`}>
              <span className="processing-stock-icon" aria-hidden="true">🍖</span>
              <span>ハム</span>
              <strong>{game.ham.toLocaleString("ja-JP")}</strong>
            </span>
            <span className="processing-stock-item" aria-label={`ソーセージ ${game.sausage}`}>
              <span className="processing-stock-icon" aria-hidden="true">🌭</span>
              <span>ソーセージ</span>
              <strong>{game.sausage.toLocaleString("ja-JP")}</strong>
            </span>
            <span className="processing-stock-item" aria-label={`ベーコン ${game.bacon}`}>
              <span className="processing-stock-icon" aria-hidden="true">🥓</span>
              <span>ベーコン</span>
              <strong>{game.bacon.toLocaleString("ja-JP")}</strong>
            </span>
            <span className="processing-stock-item" aria-label={`ピザ ${game.pizzas}`}>
              <span className="processing-stock-icon" aria-hidden="true">🍕</span>
              <span>ピザ</span>
              <strong>{game.pizzas.toLocaleString("ja-JP")}</strong>
            </span>
            <span className="processing-stock-item" aria-label={`小麦粉 ${game.wheatFlour}`}>
              <span className="processing-stock-icon" aria-hidden="true">🌾</span>
              <span>小麦粉</span>
              <strong>{game.wheatFlour.toLocaleString("ja-JP")}</strong>
            </span>
            <span className="processing-stock-item" aria-label={`パン ${game.bread}`}>
              <span className="processing-stock-icon" aria-hidden="true">🍞</span>
              <span>パン</span>
              <strong>{game.bread.toLocaleString("ja-JP")}</strong>
            </span>
            <span className="processing-stock-item" aria-label={`ホットドック ${game.hotDogs}`}>
              <span className="processing-stock-icon" aria-hidden="true">🌭</span>
              <span>ホットドック</span>
              <strong>{game.hotDogs.toLocaleString("ja-JP")}</strong>
            </span>
            <span className="processing-stock-item" aria-label={`クロワッサン ${game.croissants}`}>
              <span className="processing-stock-icon" aria-hidden="true">🥐</span>
              <span>クロワッサン</span>
              <strong>{game.croissants.toLocaleString("ja-JP")}</strong>
            </span>
            <span className="processing-stock-item" aria-label={`ハムサンド ${game.hamSandwiches}`}>
              <span className="processing-stock-icon" aria-hidden="true">🥪</span>
              <span>ハムサンド</span>
              <strong>{game.hamSandwiches.toLocaleString("ja-JP")}</strong>
            </span>
          </div>
        </div>
      </div>
      <div className="farm-control-row">
        <span className="farm-action-copy">
          {`${getCropName(selectedCropType)}の種を空の畑へ（種を1個使用）。成熟した作物は村画面でタップまたはスワイプして収穫`}
        </span>
      </div>
    </section>
  );
}
