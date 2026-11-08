import { useRef } from "react"
import { MotionConfig } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import PauseIcon from "@hugeicons/core-free-icons/PauseIcon"
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon"
import { useLocale } from "@/hooks/useLocale"
import { useRadioPlayer } from "@/hooks/useRadioPlayer"
import { bcp47 } from "@/lib/intl-cache"
import { toggleRadio } from "@/lib/radioPlayer"
import { cn } from "@/lib/utils"
import { MeterBars } from "../MeterBars"
import { FILLED } from "../radioStyles"
import { DiscArt } from "./DiscArt"
import { DiscTime } from "./DiscTime"
import { metaOf } from "./discText"
import { useDiscBox } from "./useDiscBox"
import "../radio.css"
import "./disc.css"
import "./discTile.css"

// Kutucukta disk kartınkinden küçük: alttaki dört satıra yer kalsın, üstte yarım plak görünsün.
// Yatay kutucukta (orta boy) kartın yatay düzeni: disk soldan taşar, çapı kutucuğun boyu.
const tileDisc = (box) =>
  box.layout === "row"
    ? box
    : { w: Math.round(Math.min(box.w * 0.72, box.h * 0.88)), h: box.h, layout: "column" }

/**
 * Denetim Merkezi'nin Tyrofy kutucuğu — Disk kartının küçük hâli: kutucuğun üst kenarından yarım
 * disk taşar. Çalarken kanalın görseli döner, altında ses dalgası, tür · yer, ad ve süre; çalmıyorken
 * paletin etiketli plağı, hiç istasyon seçilmediyse "Tyrofy · İstasyon seç". Kutucuğa dokunmak
 * radyonun sahnesini panelde açar (`onOpen`, eskisi gibi); sağ üstteki düğme çalar ya da duraklatır.
 */
export default function DiscTile({ onOpen, onIntent, still = false }) {
  const { t, locale } = useLocale()
  const radio = useRadioPlayer()
  const st = radio.station
  const playing = radio.status === "playing"
  // `still`: canlı yüz durgun (Denetim Merkezi'nin cam görünümü) — disk dönmez, dalga oynamaz.
  const moving = playing && !still
  const busy = radio.status === "loading"
  const active = Boolean(st) && (playing || busy)
  const brand = t("widgets.radio.title")
  const lang = bcp47(locale)
  const root = useRef(null)
  const box = useDiscBox(root)
  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={root}
        className="disc disc-tile"
        data-layout={box.layout}
        data-spin={moving || undefined}
        data-rest={!active || undefined}
      >
        <div className="disc-card">
          <DiscArt station={st} box={tileDisc(box)} rest={!active} spinning={moving} />
          {st ? (
            <div aria-hidden="true" className="disc-info">
              <MeterBars playing={moving} className="disc-waves" bar="disc-bar" />
              <p className="disc-meta">{metaOf(st, t, lang)}</p>
              <p className="disc-name">{st.name}</p>
              <DiscTime
                since={radio.since}
                playing={playing}
                live={t("widgets.radio.live").toLocaleUpperCase(lang)}
              />
            </div>
          ) : (
            <div aria-hidden="true" className="disc-info">
              <p className="disc-name disc-brand">{brand}</p>
              <p className="disc-meta">{t("widgets.tyroDisc.pick")}</p>
            </div>
          )}
          <button
            type="button"
            className="disc-hit"
            aria-label={st ? `${st.name}, ${brand}` : `${brand}, ${t("widgets.tyroDisc.pick")}`}
            onClick={onOpen}
            onPointerEnter={onIntent}
            onFocus={onIntent}
          />
          {st && (
            <button
              type="button"
              className="disc-toggle"
              aria-label={t(active ? "widgets.radio.pauseNamed" : "widgets.radio.playNamed", {
                name: st.name,
              })}
              onClick={() => toggleRadio()}
            >
              <HugeiconsIcon
                icon={busy ? Loading03Icon : playing ? PauseIcon : PlayIcon}
                strokeWidth={2}
                aria-hidden="true"
                className={cn(busy ? "animate-spin motion-reduce:animate-none" : FILLED)}
              />
            </button>
          )}
        </div>
      </div>
    </MotionConfig>
  )
}
