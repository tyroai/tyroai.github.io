// Arapça soru işareti dahil: cümle zaten bitmişse nokta eklenmez.
const END = /[.!?…:;؟]$/

/**
 * Sesli okunacak metin: parçalar (görünen cümleler) cümle sonu noktalamasıyla birleşir — okuyucu
 * aralarda durur. Metin olmayan parçalar (`cond && "…"` kalıbının `false`u) ve boşlar atlanır.
 */
export function spokenText(parts) {
  return parts
    .filter((part) => typeof part === "string" || typeof part === "number")
    .map((part) => String(part).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((part) => (END.test(part) ? part : `${part}.`))
    .join(" ")
}
