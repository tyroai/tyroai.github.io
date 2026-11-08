import { useEffect, useRef } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { useLocale } from "@/hooks/useLocale"
import { toggleRadio } from "@/lib/radioPlayer"
import { LocationMenu } from "../LocationMenu"
import { StationList } from "../StationList"
import { useStationScroll } from "../useStationScroll"

/**
 * Sahnenin istasyon listesi: kartın içinde buzlu katman — yer seçimi, bütün istasyonlar ve
 * favori kalpleri (Pano kartının listesi, aynı kurallar). Satıra basmak çalar ve katmanı kapatır
 * (halka o istasyona süzülür). Escape önce katmanı kapatır, pencereyi değil.
 */
export function StageStations({ list, radio, place, placeId, onPlace, onFavorite, onClose }) {
  const { t } = useLocale()
  const scroll = useStationScroll(list.length, 6, `${place.cc}|${placeId}`)
  const close = useRef(null)

  useEffect(() => {
    close.current?.focus({ preventScroll: true })
    // Pencere Escape'i belgede dinliyor (Radix): pencere aşamasında önce davranıp yayılmayı kes.
    const onKey = (e) => {
      if (e.key !== "Escape") return
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [onClose])

  return (
    <motion.div
      role="dialog"
      aria-label={t("widgets.radio.stations")}
      data-tone="dark"
      className="radio-card stage-sheet"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
    >
      <header className="stage-sheet-head">
        <h3 className="stage-sheet-title">{t("widgets.radio.stations")}</h3>
        <LocationMenu place={place} value={placeId} onChange={onPlace} tight />
        <button
          ref={close}
          type="button"
          onClick={onClose}
          aria-label={t("sheet.close")}
          className="stage-round stage-round--sm"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </header>
      <StationList
        stations={list}
        // Dokunmatikte liste dikey kayar (Pano kartında yatay çekme sayfa çevirir; burada yok).
        scroll={{ ...scroll, swipe: {} }}
        radio={radio}
        onPlay={(st) => {
          toggleRadio(st)
          if (radio.station?.id !== st.id) onClose()
        }}
        onFavorite={onFavorite}
        className="stage-list"
      />
    </motion.div>
  )
}
