export type MergeProduct = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
};

export type MergePreview = {
  loserPackages: number;
  loserEntries: number;
  loserBarcodes: number;
  winnerBarcodes: number;
  barcodesMoved: number;
  barcodesStay: number;
};