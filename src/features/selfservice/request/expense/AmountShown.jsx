import { cn } from "@/lib/utils"

/**
 * Tutar alanına eklenen sınıflar, alanın dinlenirken biçimli görünüşü varken: alan `peer`
 * (katman odağı ondan okur) ve odak dışında yazısı saydam — altında yazılan değer durur, katman
 * onun biçimlisini gösterir. Zorlanmış renk kipinde yazı zaten görünür kalır; katman çizilmez.
 */
export const AMOUNT_HIDE = "peer [&:not(:focus)]:text-transparent"

/**
 * Tutar yazı alanının dinlenirken biçimli görünüşü ("1234567,89" → "1.234.567,89"): alanın
 * üstünde, alanın yazısıyla (ölçüler `className`'den: iç boşluk, kenar, yazı boyu). Odakta kalkar
 * (kişi yazdığını görür, imleç doğru yerde); değere yazılmaz, asistana giden cümle değişmez.
 * Fareyi ve dokunuşu geçirir: tıklama alanın kendisine düşer.
 */
export function AmountShown({ text, className }) {
  if (!text) return null
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-end overflow-hidden whitespace-nowrap peer-focus:invisible forced-colors:hidden",
        className,
      )}
    >
      {text}
    </span>
  )
}
