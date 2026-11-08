import { useId } from "react"
import { EDGE_NOTCH_DESIGN_ATTR } from "@/lib/edgeNotchDesign"
import { NOTCH_BLEED_REM } from "@/lib/edgeNotchGeometry"
import { cn } from "@/lib/utils"

/**
 * Referansın silüeti, BİREBİR (`nova-right-edge-panel-react 2`,
 * `.edge-rail::before`): 90×420'lik tek yol, `preserveAspectRatio="none"`
 * ile rayın kutusuna + `NOTCH_BLEED_REM` üst/alt taşmaya gerilir. Duvardan (90,0) dikey
 * teğetle çıkar, iki kübikle sola akıp (0,116)'da yine dikey teğetle
 * gövdeye girer; alt yarısı aynanın aynısı. Gövde 116→304 düz.
 */
const SILHOUETTE =
  "M90 0 C90 42 81 49 48 58 C15 67 0 80 0 116 L0 304 C0 340 15 353 48 362 C81 371 90 378 90 420 Z"
const SILHOUETTE_W = 90
const SILHOUETTE_H = 420

/**
 * Aynı yol 0..1 birimine indirgenmiş — `clipPathUnits="objectBoundingBox"`
 * için. Cam kabuk `backdrop-filter`li bir HTML katmanı istiyor ve o katman
 * silüete `clip-path: url(#…)` ile kırpılıyor; px'lik `path()` gerilmez,
 * bounding-box birimli SVG clipPath ise `preserveAspectRatio="none"` gibi
 * kutuyla birlikte gerilir. Her sayı sırayla x/90, y/420.
 */
const SILHOUETTE_UNIT = SILHOUETTE.replace(
  /-?\d+(\.\d+)?/g,
  (() => {
    let i = 0
    return (n) => {
      const v = Number(n) / (i++ % 2 === 0 ? SILHOUETTE_W : SILHOUETTE_H)
      return String(Math.round(v * 10000) / 10000)
    }
  })(),
)

/**
 * Çentiğin KABUĞU — silüet katmanları + token kapsamı; içeriği çocuklar.
 *
 * Ray (`EdgeNotch`) da Tercihler'deki önizleme (`EdgeNotchDesignPicker`) da
 * bunu çizer: seçilen şey tam olarak görülecek şey, ikinci bir "küçük
 * resim" zamanla kabuktan ayrışırdı (WhatsNewCardPicker'ın kararı).
 *
 *   palette      → silüet dolu SVG yol (`--notch-bg`), gölge yolda
 *   glass-light  → (1) gölge: silüetin bulanık, kaydırılmış kopyası
 *                  (2) cam: `backdrop-filter` + süt dolgu, silüete kırpık
 *                  (3) parıltı: ağır ağır kayan sheen, silüete kırpık
 *                  (4) kenar: silüetin 1px ışık çizgisi (`non-scaling-stroke`)
 *   glass-brand  → aynı + (2b) paletin gradyan tint'i
 *
 * ⚠️ GÖLGE NEDEN AYRI KATMAN: `filter: drop-shadow` kırpılmış bir elemanda
 * kırpmadan ÖNCE uygulanır, yani gölge de kırpılır ve dışarı hiç çıkmaz;
 * kenar çizgisinin (fill yok) gölgesi ise ipince olur. Klasik çare: silüetin
 * kendisini gölge renginde, bulanık ve kaydırılmış olarak bir kez daha
 * çizmek.
 *
 * `clipPath` kimliği `useId` — aynı sayfada üç önizleme + ray birden var.
 */
export function NotchShell({ design = "palette", cardVariant, className, children, ...props }) {
  const uid = useId()
  const clipId = `notch-clip-${uid.replace(/:/g, "")}`
  const glass = design !== "palette"
  const layer = { top: `-${NOTCH_BLEED_REM}rem`, height: `calc(100% + ${NOTCH_BLEED_REM * 2}rem)` }
  return (
    <div
      className={cn("notch-skin relative isolate", className)}
      data-design={EDGE_NOTCH_DESIGN_ATTR[design] ?? "palette"}
      data-card={glass ? undefined : cardVariant}
      {...props}
    >
      {glass ? (
        <>
          <svg aria-hidden="true" className="absolute size-0">
            <defs>
              <clipPath id={clipId} clipPathUnits="objectBoundingBox">
                <path d={SILHOUETTE_UNIT} />
              </clipPath>
            </defs>
          </svg>
          {/* (1) gölge — silüetin bulanık kopyası, sola-aşağı kaydırılmış */}
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${SILHOUETTE_W} ${SILHOUETTE_H}`}
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 -z-10 w-full translate-x-[-0.4375rem] translate-y-[0.625rem] overflow-visible blur-[11px]"
            style={layer}
          >
            <path d={SILHOUETTE} className="fill-[var(--notch-glass-shadow)]" />
          </svg>
          {/* (2) cam */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -z-10 bg-[var(--notch-glass-fill)] backdrop-blur-[22px] backdrop-saturate-[1.55]"
            style={{ ...layer, clipPath: `url(#${clipId})` }}
          />
          {/* (2b) paletin tint'i — yalnız glass-brand */}
          {design === "glassBrand" && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -z-10 bg-[linear-gradient(168deg,var(--notch-tint-1)_0%,var(--notch-tint-2)_52%,var(--notch-tint-3)_100%)]"
              style={{ ...layer, clipPath: `url(#${clipId})` }}
            />
          )}
          {/* (3) parıltı */}
          <div
            aria-hidden="true"
            className="notch-sheen pointer-events-none absolute inset-x-0 -z-10 mix-blend-screen"
            style={{ ...layer, clipPath: `url(#${clipId})` }}
          />
          {/* (4) kenar çizgisi — yolun kendisi, gerilmeden etkilenmeyen 1px */}
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${SILHOUETTE_W} ${SILHOUETTE_H}`}
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 -z-10 w-full overflow-visible"
            style={layer}
          >
            <path
              d={SILHOUETTE}
              fill="none"
              stroke="var(--notch-glass-rim-soft)"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
              className="blur-[1.5px]"
            />
            <path
              d={SILHOUETTE}
              fill="none"
              stroke="var(--notch-glass-rim)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </>
      ) : (
        /* palette — referansın yolu, dolu; gölge yolda (kutuya box-shadow
           yazılsa kavislerin dışına dikdörtgen gölge çizerdi) */
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${SILHOUETTE_W} ${SILHOUETTE_H}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 -z-10 w-full [filter:drop-shadow(-9px_10px_16px_rgb(20_25_31/0.14))]"
          style={layer}
        >
          <path d={SILHOUETTE} className="fill-[var(--notch-bg)]" />
        </svg>
      )}
      {children}
    </div>
  )
}
