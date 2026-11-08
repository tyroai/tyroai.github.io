import { useId, useMemo } from "react"
import { usePalette } from "@/hooks/usePalette"
import { useTheme } from "@/hooks/useTheme"
import { wordStops } from "@/lib/wordColor"
import { cn } from "@/lib/utils"
import { SUFFIX, WORD, WORD_BOX, WORD_RIGHT } from "./tyroLogoPaths"

/**
 * Logonun "tyro" yazısı (harfler logodan izlendi; yazı tipi ticari). Kutu, işaretin kutusuyla aynı
 * düzlemde: aynı boyda konunca oranlar logodaki gibi; uygulamada yazı işaretin ~%70'i boyda.
 * "y"nin kuyruğu kutunun altına taşar, satır yüksekliğini büyütmez. suffix: bölüm adı ("RM").
 * Renk Profil › Görünüm'deki seçim (`wordColor`): kurumsal ya da bir paletin renkleri.
 */
export function BrandText({ className, suffix }) {
  const { wordColor } = usePalette()
  const { theme } = useTheme()
  const gradId = `tyro-word-${useId().replace(/:/g, "")}`
  const stops = useMemo(() => wordStops(wordColor, theme === "dark"), [wordColor, theme])
  const extra = suffix ? SUFFIX[suffix] : null
  const width = (extra ? extra.right : WORD_RIGHT) - WORD_BOX.left
  const fill = !stops ? undefined : stops.length > 1 ? `url(#${gradId})` : stops[0]
  return (
    <svg
      viewBox={`${WORD_BOX.left} ${WORD_BOX.top} ${width} ${WORD_BOX.height}`}
      role="img"
      aria-label={`tyro${suffix ?? ""}`}
      fillRule="evenodd"
      className={cn("h-7 w-auto shrink-0 overflow-visible", className)}
      style={{ aspectRatio: `${width} / ${WORD_BOX.height}` }}
    >
      {stops && stops.length > 1 ? (
        <defs>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={WORD_BOX.left}
            y1="0"
            x2={WORD_RIGHT}
            y2="0"
          >
            {stops.map((color, i) => (
              <stop key={i} offset={i / (stops.length - 1)} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
      ) : null}
      <path d={WORD} className={fill ? undefined : "fill-brand-word"} fill={fill} />
      {extra ? <path d={extra.d} className="fill-brand" /> : null}
    </svg>
  )
}
