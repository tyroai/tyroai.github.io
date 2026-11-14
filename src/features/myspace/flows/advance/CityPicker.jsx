import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { useLocale } from "@/hooks/useLocale"
import { OTHER_LOCATION, locationLabel } from "@/lib/advanceLocations"
import { fold } from "@/lib/fold"
import { cityPhoto } from "./lib/cityPhotos"
import { CITY_COORDS, MAP_H, MAP_W, dotsPath, landDots, project } from "./lib/turkeyMap"

const K = 4.1
const MINI_W = MAP_W * K
const MINI_H = MAP_H * K

/** Şehrin küçük haritası: soluk Türkiye, şehrin yerinde palet noktası (görsel, okuyucuya gizli). */
function MiniMap({ code, land }) {
  const c = CITY_COORDS[code]
  if (!c)
    return (
      <HugeiconsIcon
        icon={MoreHorizontalIcon}
        strokeWidth={2}
        aria-hidden="true"
        className="af-city-more"
      />
    )
  const [x, y] = project(c)
  return (
    <svg viewBox={`0 0 ${MINI_W.toFixed(1)} ${MINI_H.toFixed(1)}`} aria-hidden="true">
      <path d={land} className="af-mini-land" strokeWidth={1.5} />
      <circle cx={x * K} cy={y * K} r="5.2" className="af-mini-halo" />
      <circle cx={x * K} cy={y * K} r="2.9" className="af-mini-dot" />
    </svg>
  )
}

/** Dairenin içi: şehrin fotoğrafı; yoksa ya da inmezse küçük harita ("Diğer"de üç nokta). */
function Disc({ code, land }) {
  const photo = cityPhoto(code)
  const [failed, setFailed] = useState(false)
  if (!photo || failed) return <MiniMap code={code} land={land} />
  return (
    <img
      src={photo.src}
      alt=""
      width="240"
      height="240"
      loading="lazy"
      decoding="async"
      className="af-city-photo"
      onError={() => setFailed(true)}
    />
  )
}

/**
 * Gidilecek yer: arama + ERP'nin lokasyonları, her biri simge yapısının fotoğrafıyla (yapının adı üstüne gelince ipucu)
 * ("Diğer" sonda). Üstüne gelinen şehir kubbede önizlenir (`onPreview`).
 */
export function CityPicker({ options, value, onPick, onPreview }) {
  const { t } = useLocale()
  const [q, setQ] = useState("")
  const land = useMemo(() => dotsPath(landDots(0.42), K), [])
  const list = useMemo(() => {
    const all = options.map((code) => ({ code, name: locationLabel(t, code) }))
    const sorted = [
      ...all.filter((o) => o.code !== OTHER_LOCATION),
      ...all.filter((o) => o.code === OTHER_LOCATION),
    ]
    const needle = fold(q.trim())
    return needle ? sorted.filter((o) => fold(o.name).includes(needle)) : sorted
  }, [options, q, t])
  return (
    <div className="af-city">
      <label className="af-search">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} aria-hidden="true" />
        <input
          data-autofocus=""
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && list.length) {
              e.preventDefault()
              onPick(list[0].code)
            }
          }}
          placeholder={t("advanceFlow.search.city")}
          aria-label={t("advanceFlow.search.city")}
          autoComplete="off"
          enterKeyHint="done"
        />
      </label>
      <p className="af-card-kicker">
        <HugeiconsIcon icon={Location01Icon} strokeWidth={1.9} aria-hidden="true" />
        {t("advanceFlow.cities")}
      </p>
      {list.length ? (
        <div className="af-city-grid" onPointerLeave={() => onPreview(null)}>
          {list.map((o) => (
            <button
              key={o.code}
              type="button"
              className="af-city-item"
              aria-pressed={o.code === value}
              // Fotoğraftaki yapının adı yalnız üstüne gelince (ipucu).
              title={cityPhoto(o.code)?.what}
              onClick={() => onPick(o.code)}
              onPointerEnter={() => onPreview(o.code)}
              onFocus={() => onPreview(o.code)}
            >
              <span className="af-city-disc">
                <Disc code={o.code} land={land} />
              </span>
              <span className="af-city-name">{o.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="af-empty">{t("advanceFlow.empty")}</p>
      )}
    </div>
  )
}
