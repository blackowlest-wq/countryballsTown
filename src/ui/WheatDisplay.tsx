interface WheatDisplayProps {
  wheatSeeds: number;
  wheat: number;
}

export function WheatDisplay({ wheatSeeds, wheat }: WheatDisplayProps): JSX.Element {
  return (
    <div
      className="resource-pill wheat-inventory-pill"
      aria-label={`小麦の種 ${wheatSeeds}、小麦 ${wheat}`}
    >
      <span className="resource-icon wheat-seed-icon" aria-hidden="true">●</span>
      <span className="wheat-resource-copy">
        <span className="resource-label">
          <span className="resource-label-prefix">小麦の</span>種
        </span>
        <strong className="resource-value">{wheatSeeds.toLocaleString("ja-JP")}</strong>
      </span>
      <span className="wheat-resource-divider" aria-hidden="true" />
      <span className="resource-icon wheat-icon" aria-hidden="true">🌾</span>
      <span className="wheat-resource-copy">
        <span className="resource-label">小麦</span>
        <strong className="resource-value">{wheat.toLocaleString("ja-JP")}</strong>
      </span>
    </div>
  );
}
