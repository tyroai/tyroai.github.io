// Ufukta'nın düzeni kartın iç genişliğinden ve panodaki boyundan (`slotSize`) çıkar.
// Yol haritasında sütun başına en az ~110px: karo, ad ve kalan süre sığar.
const LIST_PX = 240
const ROAD2_PX = 260
const ROAD3_PX = 340
const ROAD4_PX = 480

/**
 * Düzen basamağı (saf, testli):
 * - mini kart: hep alt alta — `stack`, çok darda `compact`;
 * - büyük kart: yatay yol haritası, sayfa başına 2 · 3 · 4 hedef (`road2` … `road4`);
 * - pano dışında (`size` null): 340px'ten genişte yol haritası, darda alt alta;
 * - dar ekranda (dikey telefon, < 768px) yol haritası yalnız dört hedefin sığdığı genişlikte —
 *   adlar alt alta tam okunur. Yatay telefon masaüstü gibi kartın boyuna bakar.
 */
export function horizonTier(width, size, narrowScreen = false) {
  if (size !== "mini") {
    if (width >= ROAD4_PX) return "road4"
    if (!narrowScreen && width >= ROAD3_PX) return "road3"
    if (!narrowScreen && size === "big" && width >= ROAD2_PX) return "road2"
  }
  return width >= LIST_PX ? "stack" : "compact"
}

/** Yol haritasında sayfa başına hedef; alt alta düzende 0 (orada sayfa yok). */
export const roadColumns = (tier) => ({ road2: 2, road3: 3, road4: 4 })[tier] ?? 0
