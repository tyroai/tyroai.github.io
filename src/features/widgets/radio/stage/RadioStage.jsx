import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import LeftToRightListBulletIcon from "@hugeicons/core-free-icons/LeftToRightListBulletIcon"
import { useRadioPlace, useRadioPrefs, useRadioStations } from "@/features/widgets/hooks/useRadio"
import { useLocale } from "@/hooks/useLocale"
import { useRadioPlayer } from "@/hooks/useRadioPlayer"
import { bcp47 } from "@/lib/intl-cache"
import { rankStations } from "@/lib/radio"
import { playStation, setRadioQueue, toggleRadio } from "@/lib/radioPlayer"
import { toggleFavorite, writeRadioPrefs } from "@/lib/radioPrefs"
import { cn } from "@/lib/utils"
import { nextStageArt } from "./stageArt"
import { StageBackdrop, StageHalo } from "./StageBackdrop"
import { StageDial } from "./StageDial"
import { StageRing } from "./StageRing"
import { StageStations } from "./StageStations"
import { stageLines, stageUpper, titleLineSize, titleSize } from "./stageModel"
import { useStageLayout } from "./useStageLayout"
import "../radio.css"
import "./stage.css"

/**
 * TYROFY SAHNESİ — header'daki Tyrofy'a basınca açılan kart (Spotify'ın "Daily Mix"
 * kartının dili): bulanık müzik görseli ve gren, üstte aralıklı "TYROFY", altında iki tonlu
 * büyük istasyon adı; ortada çalanın halkası, solda önceki, sağda sonraki (kenarlarda küçük
 * çiftler); en altta sesi ayarlayan kadran. Sağ üstteki düğme istasyon listesini (yer, favoriler)
 * kartın içinde açar. Sıra Pano kartınınkiyle aynı (`rankStations`), çalar ortak
 * (`lib/radioPlayer`): sonraki/önceki ve medya tuşları aynı sırada yürür.
 *
 * `variant`: `panel` header penceresi (sabit oran, squircle köşe, dışa taşan hale) · `card`
 * panonun "Tyrofy Sahne" widget'ı (hücreyi doldurur, panonun köşesi, hale yok). Düzen kartın
 * oranından (`useStageLayout`): mini kartta dikey sahne, büyük kartta yatay sahne şeridi.
 */
export default function RadioStage({ variant = "panel", className }) {
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

  // Başka yerin listesinden çalan istasyon halkanın başına: sonraki listenin ilki, önceki sonuncusu.
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
  const [sheet, setSheet] = useState(false)
  const listBtn = useRef(null)
  // Liste kapanınca odak listeyi açan düğmeye döner.
  const closeSheet = useCallback(() => {
    setSheet(false)
    listBtn.current?.focus({ preventScroll: true })
  }, [])
  const loading = !place.ready || data.status === "loading"
  // Arka plan koleksiyondan, tekrarsız rastgele: açılışta bir, istasyon her değiştiğinde yenisi.
  const [art, setArt] = useState(nextStageArt)
  const artFor = useRef(current?.id ?? null)
  useEffect(() => {
    const id = current?.id ?? null
    if (artFor.current === id) return
    // Liste yüklenip ilk istasyon gelince açılıştaki görsel kalır (iki görsel art arda inmesin).
    const first = artFor.current === null
    artFor.current = id
    if (!first) setArt(nextStageArt())
  }, [current?.id])

  const step = (n) => {
    if (!ring.length) return
    playStation(ring[(index + n + ring.length * 4) % ring.length])
  }
  const favorite = (st) => writeRadioPrefs({ favorites: toggleFavorite(prefs.favorites, st) })
  const root = useRef(null)
  const layout = useStageLayout(root)

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={root}
        aria-label={t("widgets.radio.title")}
        data-variant={variant}
        data-layout={layout}
        className={cn("stage", className)}
        aria-busy={loading || undefined}
      >
        {variant === "panel" && <StageHalo src={art.src} />}
        <div className="stage-card">
          <StageBackdrop art={art} />
          <span aria-hidden="true" className="stage-shade" />
          <span aria-hidden="true" className="stage-grain" />
          <header className="stage-head">
            <p className="stage-eyebrow">
              {t("widgets.radio.title").toLocaleUpperCase(bcp47(locale))}
            </p>
            <StageTitle station={current} loading={loading} radio={radio} />
          </header>
          {loading ? (
            <StageSkeleton />
          ) : !ring.length ? (
            <StageEmpty error={data.status === "error"} onRetry={data.retry} />
          ) : (
            <StageRing
              ring={ring}
              index={index}
              radio={radio}
              layout={layout}
              onToggle={() => toggleRadio(current)}
              onPick={(st) => playStation(st)}
              onStep={step}
            />
          )}
          <StageDial radio={radio} />
          {!loading && list.length > 0 && (
            <button
              ref={listBtn}
              type="button"
              onClick={() => setSheet(true)}
              aria-label={t("widgets.radio.stations")}
              aria-expanded={sheet}
              className="stage-round stage-list-btn"
            >
              <HugeiconsIcon
                icon={LeftToRightListBulletIcon}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </button>
          )}
          <AnimatePresence>
            {sheet && (
              <StageStations
                list={list}
                radio={radio}
                place={place}
                placeId={prefs.place}
                onPlace={(id) => writeRadioPrefs({ place: id })}
                onFavorite={favorite}
                onClose={closeSheet}
              />
            )}
          </AnimatePresence>
        </div>
      </section>
    </MotionConfig>
  )
}

/**
 * İki tonlu istasyon adı (tasarımın "ENDLESS / VIBES"i): ilk satır beyaz, ikincisi soluk; uzun ad
 * küçülür. İstasyon değişince eskisi yukarı süzülüp solar, yenisi alttan gelir. Yayın düşerse altında
 * kısa not.
 */
function StageTitle({ station, loading, radio }) {
  const { t } = useLocale()
  if (loading || !station)
    return <span aria-hidden="true" className="stage-title-skeleton ms-skeleton" />
  const lines = stageLines(stageUpper(station.name, station.cc))
  const failed = radio.station?.id === station.id && radio.status === "error"
  return (
    <div aria-live="polite" className="stage-title-box">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.h2
          key={station.id}
          className="stage-title"
          // Dikey sahnede iki satır, yatayda tek satır (iki ton yan yana): boyu `stage.css` seçer.
          style={{ "--title-n": titleSize(lines), "--line-n": titleLineSize(lines.join(" ")) }}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
          transition={{ type: "spring", bounce: 0, duration: 0.45 }}
        >
          {/* Satırlar arasında gerçek boşluk: yatay sahnede yan yana, ekran okuyucu tek ad okur. */}
          {lines.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && " "}
              <span className="stage-title-line">{line}</span>
            </Fragment>
          ))}
        </motion.h2>
      </AnimatePresence>
      {failed && <p className="stage-note">{t("widgets.radio.unavailableShort")}</p>}
    </div>
  )
}

function StageSkeleton() {
  return (
    <div aria-hidden="true" className="stage-ring stage-ring--skeleton">
      <span className="stage-skel stage-skel--mid ms-skeleton" />
      <span className="stage-skel stage-skel--big ms-skeleton" />
      <span className="stage-skel stage-skel--mid ms-skeleton" />
    </div>
  )
}

function StageEmpty({ error, onRetry }) {
  const { t } = useLocale()
  return (
    <div className="stage-empty">
      <p>{t(error ? "widgets.radio.error" : "widgets.radio.empty")}</p>
      {error && (
        <button type="button" onClick={onRetry} className="stage-pill">
          {t("widgets.radio.retry")}
        </button>
      )}
    </div>
  )
}
