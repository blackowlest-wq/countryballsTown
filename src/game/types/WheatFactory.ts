export type WheatFactoryProductType = "wheat-flour";

export interface WheatFactoryProduction {
  buildingInstanceId: string;
  productType: WheatFactoryProductType | null;
  nextProductionAt: number | null;
}
