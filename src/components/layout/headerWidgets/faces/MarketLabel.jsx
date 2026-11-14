import { useMarketData } from "@/features/widgets/market/useMarketData"
import { useLocale } from "@/hooks/useLocale"
import { getNumberFormat } from "@/lib/intl-cache"
import { NAMED_IDS } from "@/lib/marketCatalog"
import { cn } from "@/lib/utils"
import { RollText } from "@/components/common/RollText"
import { HugeiconsIcon } from "@hugeicons/react"
import { trayIcon } from "../trayIcon"
import { MarketIcon } from "./MarketIcon"

const LABEL = "text-[0.8125rem] font-semibold tabular-nums leading-none"
const PCT = { style: "percent", maximumFractionDigits: 2, signDisplay: "exceptZero" }

/** Header'daki kısa ad: kur ISO koduyla ("USD"), altın ve endeks sözlükteki kısa adla ("Gram"). */
function shortName(row, t) {
  return NAMED_IDS.has(row.id) && row.kind !== "fx"
    ? t(`headerWidgets.marketShort.${row.id}`)
    : row.id.toUpperCase()
}

/** Seçilen kurların satırları (veri gelmediyse boş). */
function useRows(codes) {
  const m = useMarketData()
  return codes.map((code) => (m.data?.rows ?? []).find((r) => r.id === code)).filter(Boolean)
}

/**
 * Piyasa yüzü: seçilen kurlar (en çok iki) — kurun simgesi (para, külçe, sikke, borsa karosu;
 * `MarketIcon`), değer (1000 ve üstü küsuratsız) ve yönü (▲ yeşil · ▼ kırmızı; renk tek başına
 * değil). Ad yazılmaz, simge söyler; ekran okuyucu adı okur. Veri Piyasa kartıyla aynı önbellekten
 * (`useMarketData`: dakikada bir bakar, ağa en çok 5 dakikada bir çıkar; herkese açık veri).
 */
export function MarketLabel({ codes }) {
  const { t, locale } = useLocale()
  const rows = useRows(codes)
  if (!rows.length) return null
  return (
    <span className={cn(LABEL, "inline-flex items-center gap-2.5")}>
      {rows.map((row) => {
        const name = shortName(row, t)
        const value = getNumberFormat(locale, {
          minimumFractionDigits: row.value >= 1000 ? 0 : 2,
          maximumFractionDigits: row.value >= 1000 ? 0 : 2,
        }).format(row.value)
        const dir = row.change > 0 ? "up" : row.change < 0 ? "down" : null
        return (
          <span key={row.id} className="inline-flex items-center gap-1">
            <MarketIcon row={row} />
            <span aria-hidden="true">
              <RollText text={value} />
            </span>
            {dir && (
              <span
                aria-hidden="true"
                className={cn(
                  "text-[0.6875rem]",
                  dir === "up" ? "text-success-ink" : "text-danger-ink",
                )}
              >
                {dir === "up" ? "▲" : "▼"}
              </span>
            )}
            <span className="sr-only">
              {t("headerWidgets.marketSr", {
                name,
                value,
                change:
                  row.change == null ? "—" : getNumberFormat(locale, PCT).format(row.change / 100),
              })}
            </span>
          </span>
        )
      })}
    </span>
  )
}

/**
 * Piyasa düğmesinin simgesi: kurlar görünürken grafik ikonu yok (her kurun kendi simgesi var);
 * "yalnız simge" seçildiyse ya da veri henüz gelmediyse grafik ikonu.
 */
export function MarketGlyph({ face }) {
  const rows = useRows(face?.codes ?? [])
  if (face?.show !== "icon" && rows.length) return null
  return (
    <HugeiconsIcon
      icon={trayIcon("market")}
      strokeWidth={1.8}
      aria-hidden="true"
      className="size-5"
    />
  )
}

/**
 * Çentik göstergesi: seçilen ilk kurun değeri ve yönü ("41,23▲"; yön okla, renk tek başına değil).
 * Veri tepsiyle aynı önbellekten.
 */
function useMarketIndicator(codes) {
  const { t, locale } = useLocale()
  const m = useMarketData()
  const row = (m.data?.rows ?? []).find((r) => r.id === codes[0])
  if (!row) return null
  const name = shortName(row, t)
  const digits = row.value >= 1000 ? 0 : 2
  const value = getNumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(row.value)
  const arrow = row.change > 0 ? "▲" : row.change < 0 ? "▼" : ""
  return {
    text: `${value}${arrow}`,
    sr: t("headerWidgets.marketSr", {
      name,
      value,
      change: row.change == null ? "—" : getNumberFormat(locale, PCT).format(row.change / 100),
    }),
  }
}

/** Çentik göstergesinin kaynağı (`notch/SlotIndicator`): değeri çocuğa verir; hook dışa açılmaz. */
export function MarketIndicator({ face, children }) {
  return children(useMarketIndicator(face?.codes ?? []))
}
