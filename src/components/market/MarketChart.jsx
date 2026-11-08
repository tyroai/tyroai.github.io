import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useTheme } from "@/hooks/useTheme"
import { FX_DAYS, fetchFxHistory } from "@/lib/fxHistory"
import { getDateTimeFormat, getNumberFormat } from "@/lib/intl-cache"
import { useRest } from "@/lib/restMode"

// Grafiğin kodu kendi parçasında: yalnız Piyasa penceresi açılınca iner.
const Liveline = lazy(() => import("liveline").then((m) => ({ default: m.Liveline })))

const HEIGHT = 136
// Sağda canlı noktanın halesi kesilmesin; solda çizgi kenara yapışmasın. Kartta (`compact`) eksen
// yazısı yok: tarih aralığı başlıkta, yükseklik çizgiye kalsın.
const PAD = { top: 12, right: 18, bottom: 28, left: 6 }
const PAD_COMPACT = { top: 8, right: 18, bottom: 6, left: 4 }
const noTime = () => ""
const DAY_S = 86_400

const luminance = (rgb) => {
  const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) ?? []).map(Number)
  return Number.isFinite(b) ? (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 : 0
}

/**
 * Grafiğin renkleri bulunduğu yüzeyden: yazı açıksa koyu tema; vurgu paletin mürekkebi
 * (`--brand-text`). Kartın görünümü (Koyu, Renkli, Cam …) ne olursa olsun yüzeye uyar.
 */
function useSurfaceColors(ref) {
  const { theme } = useTheme()
  const [colors, setColors] = useState(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const probe = document.createElement("span")
    probe.style.color = "var(--brand-text)"
    el.appendChild(probe)
    const accent = getComputedStyle(probe).color
    probe.remove()
    const ink = getComputedStyle(el).color
    setColors({ theme: luminance(ink) > 0.5 ? "dark" : "light", accent })
  }, [ref, theme])
  return colors
}

/** Animasyonsuz çizgi: kod inene kadar ve dinlenme kipinde (grafiğin kendi kare döngüsü durur). */
function StillLine({ points, color }) {
  if (points.length < 2) return null
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const t0 = points[0].time
  const tSpan = points.at(-1).time - t0 || 1
  const d = points
    .map((p, i) => {
      const x = ((p.time - t0) / tSpan) * 100
      const y = 36 - ((p.value - min) / span) * 30
      return `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="size-full" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={color ?? "currentColor"}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * Seçili kurun son 30 günü (Liveline — Benji Taylor, MIT): Avrupa Merkez Bankası'nın günlük
 * kurları ve en sağda canlı değer (karttaki); üstüne gelince gün gün okunur. Piyasa penceresinde
 * (header, Denetim Merkezi) ve Piyasa kartında. Kod ilk çizimde iner; dinlenme kipinde grafik yerine
 * aynı çizgi durağan (`StillLine`). Tuvale ekran okuyucu ulaşamaz: başlığın yanında ilk ve son değer.
 * Değer rozeti yok (değer zaten karoda ya da satırda): rozetin payı çizgiyi daraltıyor, eksene
 * gelecekteki bir gün yazdırıyordu. `named`: başlıkta kurun adı (kartta grafik kur değiştirir);
 * `compact`: eksen yazısız, kartın içinde.
 */
export function MarketChart({
  row,
  name,
  named = false,
  compact = false,
  height = HEIGHT,
  className = "mt-3",
}) {
  const { t, locale } = useLocale()
  const rest = useRest()
  const box = useRef(null)
  const colors = useSurfaceColors(box)
  // `at`: verinin geldiği an — canlı nokta o ana konur (çizim saf kalsın).
  const [history, setHistory] = useState({ key: null, points: [], at: 0 })
  useEffect(() => {
    let alive = true
    fetchFxHistory(row)
      .then((points) => alive && setHistory({ key: row.key, points, at: Date.now() }))
      .catch(() => alive && setHistory({ key: row.key, points: [], at: Date.now() }))
    return () => {
      alive = false
    }
  }, [row])
  const digits = row.unit ? 2 : 4
  const fmt = useMemo(
    () => getNumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }),
    [locale, digits],
  )
  const day = useMemo(() => getDateTimeFormat(locale, { day: "numeric", month: "short" }), [locale])
  const own = history.key === row.key
  const data = useMemo(
    () =>
      own && history.points.length
        ? [...history.points, { time: history.at / 1000, value: row.value }]
        : [],
    [own, history, row.value],
  )
  if (own && !history.points.length) return null
  const ready = data.length > 1 && colors
  // Eksende bugünden sonrası yazılmaz (sağ kenar canlı noktanın biraz ötesinde).
  const lastTime = data.length ? data[data.length - 1].time : 0
  const title = t("widgets.market.chartTitle")
  return (
    <figure ref={box} className={className}>
      <figcaption className="flex min-w-0 items-baseline justify-between gap-2 text-[0.71875rem] text-muted-foreground">
        <span className="truncate font-medium">{named ? `${name} · ${title}` : title}</span>
        {ready && (
          <span className="shrink-0 tabular-nums">
            {!named && <span className="sr-only">{`${name}: `}</span>}
            {fmt.format(data[0].value)} → {fmt.format(row.value)}
          </span>
        )}
      </figcaption>
      <div className="mt-1.5" style={{ height }} aria-hidden="true">
        {!ready ? (
          <span className="ms-skeleton block size-full rounded-xl" />
        ) : rest ? (
          <StillLine points={data} color={colors.accent} />
        ) : (
          <Suspense fallback={<StillLine points={data} color={colors.accent} />}>
            <Liveline
              data={data}
              value={row.value}
              theme={colors.theme}
              color={colors.accent}
              window={(FX_DAYS + 1) * DAY_S}
              grid={false}
              badge={false}
              momentum={false}
              padding={compact ? PAD_COMPACT : PAD}
              degen={false}
              formatValue={(v) => fmt.format(v)}
              formatTime={
                compact ? noTime : (s) => (s > lastTime + DAY_S / 2 ? "" : day.format(s * 1000))
              }
            />
          </Suspense>
        )}
      </div>
    </figure>
  )
}
