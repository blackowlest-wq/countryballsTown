export type MilkFactoryProductType = "butter" | "cheese";

export interface MilkFactoryProduction {
  buildingInstanceId: string;
  productType: MilkFactoryProductType | null;
  nextProductionAt: number | null;
}
