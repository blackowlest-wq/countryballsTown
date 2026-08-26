import type { FoodProductType } from "./Product";

/** One food product and quantity requested by a market order. */
export interface MarketOrderItem {
  productType: FoodProductType;
  quantity: number;
}

/** A permanent delivery request shown on the order board. */
export interface MarketOrder {
  id: string;
  items: MarketOrderItem[];
  rewardCoins: number;
}
