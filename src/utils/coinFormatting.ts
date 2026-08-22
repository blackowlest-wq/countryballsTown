export function formatCoinAmount(coins: number): string {
  return Math.max(0, Math.floor(coins)).toLocaleString("ja-JP");
}
