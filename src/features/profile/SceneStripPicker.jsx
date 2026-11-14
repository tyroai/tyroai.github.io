import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useSyncExternalStore } from "react"
import { useLocale } from "@/hooks/useLocale"
import {
  DEFAULT_SCENE_STRIP,
  SCENE_STRIPS,
  readSceneStrip,
  subscribeSceneStrip,
  writeSceneStrip,
} from "@/lib/sceneStrip"
import { useRadioRoving } from "./ProfilePage/useRadioRoving"
import "./pageLayoutPicker.css"
import "./sceneStripPicker.css"

/** Şeridin küçük şeması: yazı yok, biçimin iskeleti (okuyucuya gizli). */
function Sketch({ id }) {
  if (id === "picker")
    return (
      <span className="ssp-row">
        <span className="ssp-orb" />
        <span className="ssp-bar ssp-strong" />
        <span className="ssp-chev" />
        <span className="ssp-bar ssp-note" />
      </span>
    )
  if (id === "tabs")
    return (
      <span className="ssp-row ssp-tabs">
        <span className="ssp-bar" />
        <span className="ssp-bar ssp-strong ssp-on" />
        <span className="ssp-bar" />
        <span className="ssp-bar" />
      </span>
    )
  return (
    <span className="ssp-row ssp-pill">
      <span className="ssp-dot" />
      <span className="ssp-chip">
        <span className="ssp-dot ssp-tint" />
        <span className="ssp-bar ssp-strong" />
      </span>
      <span className="ssp-dot" />
      <span className="ssp-dot" />
    </span>
  )
}

/**
 * Profil › Görünüm › Sahne şeridi: Anasayfa'daki sahne seçicisinin biçimi (seçici, sekmeler,
 * simgeler). Seçim anında uygulanır (`lib/sceneStrip`).
 */
export function SceneStripPicker() {
  const { t } = useLocale()
  const chosen = useSyncExternalStore(subscribeSceneStrip, readSceneStrip, readSceneStrip)
  const radio = useRadioRoving(SCENE_STRIPS, chosen, writeSceneStrip)
  const name = t("profile.prefs.sceneStrip")
  return (
    <div className="plp">
      <div role="radiogroup" aria-label={name} className="plp-grid">
        {SCENE_STRIPS.map((id, index) => {
          const selected = id === chosen
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              {...radio(id, index)}
              onClick={() => writeSceneStrip(id)}
              className="plp-tile"
            >
              <span aria-hidden="true" className="plp-sketch ssp-sketch">
                <span className="ssp-strip">
                  <Sketch id={id} />
                </span>
                <span className="ssp-cards">
                  <span className="plp-box plp-tint" />
                  <span className="plp-box" />
                  <span className="plp-box" />
                </span>
              </span>
              <span className="plp-foot">
                <span className="plp-label">{t(`profile.prefs.sceneStrip.${id}`)}</span>
                {id === DEFAULT_SCENE_STRIP && (
                  <span className="plp-trial">{t("profile.prefs.sceneStrip.default")}</span>
                )}
                {selected && (
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    aria-hidden="true"
                    className="plp-tick"
                    strokeWidth={2.4}
                  />
                )}
              </span>
              <span className="plp-hint">{t(`profile.prefs.sceneStrip.${id}Hint`)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
