export type PorkFactoryProductType = "ham" | "sausage" | "bacon";

export interface PorkFactoryProduction {
  buildingInstanceId: string;
  productType: PorkFactoryProductType | null;
  nextProductionAt: number | null;
}
