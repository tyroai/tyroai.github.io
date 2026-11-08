import { useEffect, useMemo, useRef } from "react"
import { MotionConfig } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon"
import { useRadioPlace, useRadioPrefs, useRadioStations } from "@/features/widgets/hooks/useRadio"
import { useLocale } from "@/hooks/useLocale"
import { useRadioPlayer } from "@/hooks/useRadioPlayer"
import { bcp47 } from "@/lib/intl-cache"
import { rankStations } from "@/lib/radio"
import { playStation, setRadioQueue, toggleRadio } from "@/lib/radioPlayer"
import { cn } from "@/lib/utils"
import { MeterBars } from "../MeterBars"
import { FILLED } from "../radioStyles"
import { DiscArt } from "./DiscArt"
import { DiscTime } from "./DiscTime"
import { metaOf } from "./discText"
import { useDiscBox } from "./useDiscBox"
import { useSwipeStep } from "./useSwipeStep"
import "../radio.css"
import "./disc.css"

/**
 * TYROFY DİSK — kompakt, hareketli radyo kartı. Çalarken istasyonun görseli kartın kenarından
 * taşan, sürekli dönen bir CD; altında ses dalgası, tür ve yer, istasyonun adı, dinleme süresi
 * (kayan rakamlar) ve "/ CANLI". Karta basmak çalar ya da duraklatır. Çalmıyorken disk yarım
 * plaktır (kanal görseli değil: logolar çoğu zaman düşük çözünürlüklü); hiç istasyon seçilmediyse
 * altında "Tyrofy · İstasyon seç". Yana kaydırmak, ok tuşları ve üzerine gelince görünen oklar
 * istasyon değiştirir. Sıra sahneyle aynı (`rankStations`), çalar ortak (`lib/radioPlayer`).
 * Düzen kartın oranından (`useDiscBox`): dar ya da kareye yakın kartta disk üstte, geniş kartta solda.
 */
export default function RadioDisc({ className }) {
  const { t, locale } = useLocale()
  const prefs = useRadioPrefs()
  const place = useRadioPlace(prefs.place)
  const data = useRadioStations(place.ready ? place.cc : "")
  const radio = useRadioPlayer()
  const list = useMemo(
    () => rankStations(data.stations, { place, favorites: prefs.favorites }),
    [data.stations, place, prefs.favorites],
  )
  useEffect(() => {
    if (list.length) setRadioQueue(list)
  }, [list])

  // Başka yerin listesinden çalan istasyon sıranın başına (sahnedeki gibi).
  const playing = radio.station
  const ring = useMemo(
    () => (!playing || list.some((s) => s.id === playing.id) ? list : [playing, ...list]),
    [list, playing],
  )
  const index = playing
    ? Math.max(
        0,
        ring.findIndex((s) => s.id === playing.id),
      )
    : 0
  const current = ring[index] ?? null
  const status = current && radio.station?.id === current.id ? radio.status : "idle"
  const active = status === "playing" || status === "loading"
  const spinning = status === "playing"
  // İlk açılış: henüz istasyon seçilmedi (karta basınca sıranın başı çalar).
  const fresh = !radio.station
  const loading = !place.ready || data.status === "loading"

  const root = useRef(null)
  const box = useDiscBox(root)
  const step = (n) => {
    if (!ring.length) return
    playStation(ring[(index + n + ring.length * 4) % ring.length])
  }
  const swipe = useSwipeStep(step)
  const lang = bcp47(locale)

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={root}
        aria-label={t("widgets.tyroDisc.title")}
        aria-busy={loading || undefined}
        data-layout={box.layout}
        data-rest={(current && !active) || undefined}
        data-spin={spinning || undefined}
        className={cn("disc", className)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
          e.preventDefault()
          step(e.key === "ArrowLeft" ? -1 : 1)
        }}
        {...swipe}
      >
        <div className="disc-card">
          {loading ? (
            <span aria-hidden="true" className="disc-skel" />
          ) : !current ? (
            <div className="disc-empty">
              <p>{t(data.status === "error" ? "widgets.radio.error" : "widgets.radio.empty")}</p>
              {data.status === "error" && (
                <button type="button" className="disc-retry" onClick={data.retry}>
                  {t("widgets.radio.retry")}
                </button>
              )}
            </div>
          ) : (
            <>
              <DiscArt station={current} box={box} rest={!active} spinning={spinning} />
              {fresh && !active ? (
                <div aria-hidden="true" className="disc-info">
                  <p className="disc-name disc-brand">{t("widgets.radio.title")}</p>
                  <p className="disc-meta">{t("widgets.tyroDisc.pick")}</p>
                </div>
              ) : (
                <div aria-hidden="true" className="disc-info">
                  <MeterBars playing={spinning} className="disc-waves" bar="disc-bar" />
                  <p className="disc-meta">{metaOf(current, t, lang)}</p>
                  <p className="disc-name">{current.name}</p>
                  <DiscTime
                    since={radio.since}
                    playing={spinning}
                    live={t("widgets.radio.live").toLocaleUpperCase(lang)}
                  />
                </div>
              )}
              <button
                type="button"
                className="disc-hit"
                aria-label={t(active ? "widgets.radio.pauseNamed" : "widgets.radio.playNamed", {
                  name: current.name,
                })}
                onClick={() => toggleRadio(current)}
              />
              <span aria-hidden="true" className="disc-play">
                <HugeiconsIcon icon={PlayIcon} className={FILLED} strokeWidth={2} />
              </span>
              <button
                type="button"
                data-dir="prev"
                className="disc-step"
                aria-label={t("widgets.radio.prev")}
                onClick={() => step(-1)}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                data-dir="next"
                className="disc-step"
                aria-label={t("widgets.radio.next")}
                onClick={() => step(1)}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.2} />
              </button>
            </>
          )}
        </div>
      </section>
    </MotionConfig>
  )
}
