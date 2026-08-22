import { formatCoinAmount } from "../utils/coinFormatting";

interface CoinDisplayProps {
  coins: number;
}

export function CoinDisplay({ coins }: CoinDisplayProps): JSX.Element {
  const formattedCoins = formatCoinAmount(coins);

  return (
    <div className="resource-pill" aria-label={`コイン ${formattedCoins}`}>
      <span className="resource-icon coin-icon">✦</span>
      <span className="resource-value">{formattedCoins}</span>
    </div>
  );
}
