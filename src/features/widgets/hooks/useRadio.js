import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { OFFICE_CITIES } from "@/data/worldCities"
import { useLocale } from "@/hooks/useLocale"
import { useWeather } from "@/hooks/useWeather"
import { fetchStations, playableStations, withFeatured } from "@/lib/radio"
import { getRadioPrefs, subscribeRadioPrefs } from "@/lib/radioPrefs"

/** Radyo tercihleri (yer, favoriler, ses) — kartlar arasında ortak (`lib/radioPrefs.js`). */
export function useRadioPrefs() {
  return useSyncExternalStore(subscribeRadioPrefs, getRadioPrefs, getRadioPrefs)
}

// İstasyon listesi herkese açık veri: bellekte ülke başına 6 saat (kişisel veri değil).
const TTL_MS = 6 * 60 * 60 * 1000
const cache = new Map()
const inflight = new Map()
let hls = null

/** Tarayıcı HLS'yi kendisi çalabiliyor mu (Safari, güncel Chrome/Edge evet; Firefox hayır). */
export function canHls() {
  if (hls === null) {
    try {
      hls = Boolean(document.createElement("audio").canPlayType("application/vnd.apple.mpegurl"))
    } catch {
      hls = false
    }
  }
  return hls
}

function load(cc) {
  const hit = cache.get(cc)
  if (hit && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit.list)
  if (!inflight.has(cc)) {
    const flight = fetchStations(cc)
      .then((raw) => {
        const list = withFeatured(playableStations(raw, { hls: canHls() }), cc, { hls: canHls() })
        cache.set(cc, { at: Date.now(), list })
        return list
      })
      .finally(() => inflight.delete(cc))
    inflight.set(cc, flight)
  }
  return inflight.get(cc)
}

/** Ülkenin çalınabilir istasyonları — `{ status, stations, retry }`. */
export function useRadioStations(cc) {
  const [state, setState] = useState({ cc: null, status: "loading", stations: [] })
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    if (!cc) return undefined
    let alive = true
    load(cc).then(
      (stations) => alive && setState({ cc, status: "ready", stations }),
      () => alive && setState({ cc, status: "error", stations: [] }),
    )
    return () => {
      alive = false
    }
  }, [cc, nonce])
  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: "loading" }))
    setNonce((n) => n + 1)
  }, [])
  const value = state.cc === cc ? state : { cc, status: "loading", stations: [] }
  return { ...value, retry }
}

/** Hava okunamazsa ülke: saat dilimi bir ofisinkiyse o, yoksa dilin bölgesi, yoksa TR. */
export function fallbackCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const office = OFFICE_CITIES.find((c) => c.tz === tz)
    if (office) return office.cc
  } catch {
    // saat dilimi okunamadı
  }
  const region = String(globalThis.navigator?.language ?? "").split("-")[1] ?? ""
  return /^[a-z]{2}$/i.test(region) ? region.toUpperCase() : "TR"
}

/**
 * Radyonun yeri: kişi bir ofis seçtiyse o (ülke + şehir adı); yoksa hava kartının yeri
 * (IP'den yaklaşık şehir, izin verilmişse tam konum — `useWeather`, aynı önbellek).
 * `{ cc, city, region, lat, lon, approx, source, ready, locateMe, locating, notice }`
 */
export function useRadioPlace(placeId) {
  const { locale } = useLocale()
  const office = placeId && placeId !== "auto" ? OFFICE_CITIES.find((c) => c.id === placeId) : null
  const weather = useWeather({ enabled: !office })
  const { status, place, locateMe, locating, notice } = weather
  const value = useMemo(() => {
    if (office)
      return {
        source: "office",
        id: office.id,
        cc: office.cc,
        city: office.names[locale] ?? office.names.en,
        region: "",
        ready: true,
      }
    if (status === "loading") return { source: "auto", cc: "", city: "", ready: false }
    const p = status === "ready" ? place : null
    return {
      source: "auto",
      cc: p?.countryCode || fallbackCountry(),
      city: p?.name ?? "",
      region: p?.region ?? "",
      lat: p?.lat,
      lon: p?.lon,
      approx: p ? p.approx : true,
      ready: true,
    }
  }, [office, locale, status, place])
  return useMemo(
    () => ({ ...value, locateMe, locating, notice }),
    [value, locateMe, locating, notice],
  )
}
