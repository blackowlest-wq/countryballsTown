interface CoinDisplayProps {
  coins: number;
}

export function CoinDisplay({ coins }: CoinDisplayProps): JSX.Element {
  return (
    <div className="resource-pill" aria-label={`コイン ${coins}`}>
      <span className="resource-icon coin-icon">✦</span>
      <span className="resource-value">{coins.toLocaleString("ja-JP")}</span>
    </div>
  );
}
