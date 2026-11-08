import { HugeiconsIcon } from "@hugeicons/react"
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon"
import ViewOffSlashIcon from "@hugeicons/core-free-icons/ViewOffSlashIcon"
import { estateImage, estatePosition } from "./estateImages"
import { WeatherFx } from "./WeatherFx"
import { useLocale } from "@/hooks/useLocale"
import "./estate.css"
import "./estateEffects.css"

/** Fotoğrafın hava ve ışığı hazır sahneden gelir; ön yüzdeki simgelere dokunmaz. */
export function EstateLayer({ weather, kind, night }) {
  return (
    <div className="sky-estate" aria-hidden="true">
      <div className="sky-estate__scene">
        <img
          className="sky-estate__photo"
          src={estateImage(kind === "partly" && !night ? "sunny" : weather, night)}
          style={{ objectPosition: estatePosition(kind === "partly" && !night ? "sunny" : weather, night) }}
          alt=""
          decoding="async"
          draggable={false}
        />
      </div>
      <div className="sky-estate__tone" />
      <WeatherFx weather={weather} />
      <div className="sky-estate__scrim" />
    </div>
  )
}

/** Sağ üstteki göz: köşkü gizler/geri getirir (simge şu anki hâli gösterir). */
export function EstateToggle({ on, onToggle }) {
  const { t } = useLocale()
  const label = t(on ? "myspace.weather.estateHide" : "myspace.weather.estateShow")
  return (
    <button
      type="button"
      className="sky-estate-toggle"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onToggle}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <HugeiconsIcon icon={on ? ViewIcon : ViewOffSlashIcon} strokeWidth={1.8} aria-hidden="true" />
    </button>
  )
}
