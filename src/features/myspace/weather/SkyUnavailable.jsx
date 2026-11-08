import { HugeiconsIcon } from "@hugeicons/react"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import { useLocale } from "@/hooks/useLocale"
import "./skyUnavailable.css"

/**
 * Hava alınamadığında kartın ortası (derecenin yeri): kısa not + "Yeniden dene". Kart yine o
 * saatin göğüyle çizilir (selamlama, saat, yay); boş beyaz bir kutuya düşmez. Konum zinciri
 * merkez ofise kadar iniyor (`homePlace`), yani bu yüz pratikte yalnız tahmin servisi
 * engelliyken görünür.
 */
export function SkyUnavailable({ onRetry }) {
  const { t } = useLocale()
  return (
    <span className="sky-weather__reading sky-weather__unavailable">
      <span role="status" className="sky-weather__unavailable-text">
        {t("myspace.weather.unavailable")}
      </span>
      <button type="button" className="sky-weather__retry" onClick={onRetry}>
        <HugeiconsIcon icon={RefreshIcon} strokeWidth={1.9} aria-hidden="true" />
        {t("myspace.weather.retry")}
      </button>
    </span>
  )
}
