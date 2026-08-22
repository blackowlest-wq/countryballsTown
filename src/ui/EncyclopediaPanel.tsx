import { useState } from "react";
import {
  encyclopediaCategories,
  encyclopediaEntries,
  type EncyclopediaCategoryId,
} from "../game/data/encyclopedia";
import { useGameStore } from "../store/gameStore";

export function EncyclopediaPanel(): JSX.Element | null {
  const open = useGameStore((store) => store.isEncyclopediaOpen);
  const collectedIds = useGameStore((store) => store.game.encyclopediaCollectedIds);
  const close = useGameStore((store) => store.closeEncyclopedia);
  const [selectedCategory, setSelectedCategory] = useState<EncyclopediaCategoryId>("building");

  if (!open) return null;

  const collected = new Set(collectedIds);
  const visibleEntries = encyclopediaEntries.filter((entry) => entry.category === selectedCategory);
  const collectedCount = encyclopediaEntries.filter((entry) => collected.has(entry.id)).length;
  const isComplete = collectedCount === encyclopediaEntries.length;

  return (
    <section className="floating-panel encyclopedia-panel" aria-label="図鑑">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">ENCYCLOPEDIA</p>
          <h2>図鑑</h2>
        </div>
        <button className="icon-button" type="button" onClick={close} aria-label="閉じる">×</button>
      </div>
      <p className="panel-hint">村で作ったものや出会ったものを確認できます。</p>
      <div className="encyclopedia-progress" aria-label={`図鑑の収集数 ${collectedCount}/${encyclopediaEntries.length}`}>
        <span>収集した項目</span>
        <strong>☆ {collectedCount} / {encyclopediaEntries.length}</strong>
      </div>
      {isComplete && <p className="encyclopedia-complete">図鑑コンプリート！</p>}

      <div className="encyclopedia-category-tabs" role="tablist" aria-label="図鑑の分類">
        {encyclopediaCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            className="encyclopedia-category-tab"
            aria-selected={selectedCategory === category.id}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span aria-hidden="true">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      <div className="encyclopedia-list" role="tabpanel">
        {visibleEntries.map((entry) => {
          const isCollected = collected.has(entry.id);
          return (
            <article
              key={entry.id}
              className={`encyclopedia-entry ${isCollected ? "is-collected" : ""}`}
              data-entry={entry.id}
            >
              <span className="encyclopedia-entry-icon" aria-hidden="true">{entry.icon}</span>
              <span className="encyclopedia-entry-copy">
                <strong>{entry.name}</strong>
                <small>{entry.description}</small>
              </span>
              <span
                className="encyclopedia-entry-star"
                aria-label={isCollected ? "収集済み" : "未収集"}
              >
                {isCollected ? "☆" : "・"}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
