interface WheatDisplayProps {
  wheat: number;
}

export function WheatDisplay({ wheat }: WheatDisplayProps): JSX.Element {
  return (
    <div className="resource-pill wheat-pill" aria-label={`小麦 ${wheat}`}>
      <span className="resource-icon wheat-icon">🌾</span>
      <span className="resource-value">{wheat.toLocaleString("ja-JP")}</span>
    </div>
  );
}
