interface MilkDisplayProps {
  milk: number;
}

export function MilkDisplay({ milk }: MilkDisplayProps): JSX.Element {
  return (
    <div className="resource-pill milk-resource-pill" aria-label={`牛乳 ${milk}`}>
      <span className="resource-icon milk-icon" aria-hidden="true">🥛</span>
      <span className="resource-summary-copy">
        <span className="resource-label">牛乳</span>
        <strong className="resource-value">{milk.toLocaleString("ja-JP")}</strong>
      </span>
    </div>
  );
}
