interface ProduceDisplayProps {
  wheatSeeds: number;
  wheat: number;
  milk: number;
}

export function ProduceDisplay({
  wheatSeeds,
  wheat,
  milk,
}: ProduceDisplayProps): JSX.Element {
  return (
    <div
      className="resource-pill produce-inventory-pill"
      aria-label={`小麦の種 ${wheatSeeds}、小麦 ${wheat}、牛乳 ${milk}`}
    >
      <span className="resource-icon wheat-seed-icon" aria-hidden="true">●</span>
      <span className="produce-resource-copy">
        <span className="resource-label">
          <span className="resource-label-prefix">小麦の</span>種
        </span>
        <strong className="resource-value">{wheatSeeds.toLocaleString("ja-JP")}</strong>
      </span>
      <span className="produce-resource-divider" aria-hidden="true" />
      <span className="resource-icon wheat-icon" aria-hidden="true">🌾</span>
      <span className="produce-resource-copy">
        <span className="resource-label">小麦</span>
        <strong className="resource-value">{wheat.toLocaleString("ja-JP")}</strong>
      </span>
      <span className="produce-resource-divider" aria-hidden="true" />
      <span className="resource-icon milk-icon" aria-hidden="true">🥛</span>
      <span className="produce-resource-copy">
        <span className="resource-label">牛乳</span>
        <strong className="resource-value">{milk.toLocaleString("ja-JP")}</strong>
      </span>
    </div>
  );
}
