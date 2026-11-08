import type { BucketId } from "./tibotModel"

/**
 * Kovanın kimlik rengi — sayfada zaten görünen üç belirgin ton: marka mürekkebi (Bana atanan) ve
 * paletin grafik serileri (Tarafımdan açılanlar · Ekibim). Degradenin son durağı bazı paletlerde
 * çok açık (Insta: sarı), beyaz zeminde seçilmiyordu. Tibotlar'ın kova çipleri, halkalı Tibot
 * Talepler kartı ve header yüzü aynı rengi kullanır (biri ötekinin lejantı olur). Gecikme rengi
 * değildir; gecikme sayıyla söylenir.
 */
export const BUCKET_COLOR: Record<BucketId, string> = {
  assigned: "var(--brand-text)",
  mine: "var(--chart-1)",
  team: "var(--chart-2)",
}
