import { useId, useMemo } from "react"
import { usePalette } from "@/hooks/usePalette"
import { useTheme } from "@/hooks/useTheme"
import { useLogoOrb } from "@/lib/logoOrb"
import { wordStops } from "@/lib/wordColor"
import { cn } from "@/lib/utils"
import { SUFFIX, WORD_RIGHT } from "./tyroLogoPaths"
import { OrbGlyph } from "./TyroOrbGlyph"
import { TYR, WORDMARK } from "./tyroWordmark"

/**
 * Yeni "tyro" yazı logosu: "tyr" harfleri + "o" yerinde küre (demo/overlay; kaynaktaki eski
 * `BrandText`in yerine geçer, imzası aynı). Kutu eski logonun kutusuyla aynı oranda, yani çağrı
 * yerlerindeki boy sınıfları (`h-5`, `h-7`…) aynı harf boyunu verir; "y"nin kuyruğu kutunun altına
 * taşar, satır yüksekliğini büyütmez. suffix: bölüm adı ("RM"), eski düzlemden ölçeklenip kürenin
 * sağına konur.
 * Harf rengi Profil › Görünüm'deki seçim (`wordColor`), her zaman DÜZ renk (degrade palette orta
 * durak); seçim yoksa metin rengi (açıkta mürekkep, koyuda beyaz). Kürenin görünümü ayrı bir seçim (`useLogoOrb`: renkli ya da obsidyen).
 */
export function BrandText({ className, suffix }) {
  const { wordColor } = usePalette()
  const { theme } = useTheme()
  const orbStyle = useLogoOrb()
  const uid = `tyro-word-${useId().replace(/:/g, "")}`
  const stops = useMemo(() => wordStops(wordColor, theme === "dark"), [wordColor, theme])
  const extra = suffix ? SUFFIX[suffix] : null
  const { box, scale, right, orb } = WORDMARK
  const width = (extra ? right + (extra.right - WORD_RIGHT) * scale : right) - box.x
  // Yazı HER ZAMAN düz renk: degrade palet seçilse de orta durağı alınır (logo yazısı geçişli olmaz).
  const fill = !stops ? undefined : stops[Math.floor(stops.length / 2)]
  return (
    <svg
      viewBox={`${box.x} ${box.y} ${width} ${box.h}`}
      role="img"
      aria-label={`tyro${suffix ?? ""}`}
      className={cn("h-7 w-auto shrink-0 overflow-visible", className)}
      style={{ aspectRatio: `${width} / ${box.h}` }}
    >
      <path d={TYR} className={fill ? undefined : "fill-foreground"} fill={fill} />
      <OrbGlyph cx={orb.cx} cy={orb.cy} r={orb.r} id={uid} variant={orbStyle} />
      {extra ? (
        <g transform={`translate(${right - WORD_RIGHT * scale} ${box.y + 30 * scale}) scale(${scale})`}>
          <path d={extra.d} className="fill-brand" fillRule="evenodd" />
        </g>
      ) : null}
    </svg>
  )
}
