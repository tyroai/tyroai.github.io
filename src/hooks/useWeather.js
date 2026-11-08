import { useCallback, useEffect, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { WEATHER } from "@/lib/weatherPolicy"
import { worstWeather } from "@/dev/worstCase/home"
import {
  currentPosition,
  fetchForecast,
  geolocationGranted,
  homePlace,
  lookupPlace,
  parseForecast,
} from "@/lib/weather"
import { onSessionClear } from "@/lib/sessionCache"

/**
 * Hava durumu — konum + tahmin (gerekçeler `lib/weather.js`te).
 *
 * ⚠️ ÖNBELLEK YALNIZ BELLEKTE (30 dk, `WEATHER.ttlMs`) ve çıkışta düşer
 * (`lib/sessionCache`): kişinin kendi konumu da bir kişisel veri,
 * paylaşılan bir tarayıcıda bir sonraki kullanıcıya kalmasın. Diske hiçbir
 * şey yazılmaz — konum iznini tarayıcı zaten hatırlıyor.
 * ⚠️ Uçuştaki tur paylaşılır: StrictMode'un çift efekti iki istek atmasın.
 */
let cache = null // { at, locale, place, forecast }
const inflight = new Map() // dil → uçuştaki tur: yer adı o dilde, başka dil kendi turunu atar
let failed = null // { at, locale } — az önce düşen tur
let preferPrecise = false
// Çıkıştan sonra biten tur önbelleğe yazılmasın (bir sonraki kullanıcıya konum kalmasın).
let generation = 0
// Tur düştüyse bu süre içinde ne kanca ne önyükleme ikinci tur atar ("Yeniden dene" atar).
const FAIL_MS = 5000
// Tekdüze saat: sistem saati geri alınsa da not süresinde biter.
const clock = () => performance.now()

export function clearWeatherCache() {
  cache = null
  inflight.clear()
  failed = null
  preferPrecise = false
  generation += 1
}
onSessionClear(clearWeatherCache)

async function resolvePlace(locale, precise) {
  if (precise || preferPrecise || (await geolocationGranted())) {
    try {
      const pos = await currentPosition()
      // Yer adı ile tahmin aynı anda: ikisi de yalnız koordinat ister; art arda beklemek
      // sıcaklığı (Anasayfa'nın LCP öğesi) bir istek boyu geciktiriyordu.
      const forecast = fetchForecast(pos.lat, pos.lon)
      forecast.catch(() => {})
      const place = await lookupPlace({ ...pos, locale }).catch(() => ({ name: "" }))
      return { place: { ...place, lat: pos.lat, lon: pos.lon, approx: false }, forecast }
    } catch (e) {
      // Kullanıcı bastıysa reddi söyle; kendiliğinden denendiyse IP'ye düş.
      if (precise) throw e
    }
  }
  // IP'den şehir; o da olmazsa merkez ofis (`homePlace`) — kart hiç boş kalmasın.
  try {
    const place = await lookupPlace({ locale })
    if (Number.isFinite(place.lat) && Number.isFinite(place.lon)) return { place }
  } catch {
    // IP servisi engelli ya da kapalı.
  }
  return { place: homePlace(locale) }
}

async function load(locale, precise = false) {
  const { place, forecast: early } = await resolvePlace(locale, precise)
  if (!Number.isFinite(place.lat) || !Number.isFinite(place.lon)) throw new Error("noplace")
  const forecast = parseForecast(await (early ?? fetchForecast(place.lat, place.lon)))
  if (!forecast) throw new Error("noforecast")
  return { at: Date.now(), locale, place, forecast }
}

/** Turu başlatır ya da aynı dildeki uçuştakine katılır; sonuç (ya da düşüşü) hatırlanır. */
function start(locale) {
  const running = inflight.get(locale)
  if (running) return running
  const gen = generation
  const promise = load(locale)
    .then((v) => {
      if (gen === generation) {
        cache = v
        failed = null
      }
      return v
    })
    .catch((e) => {
      if (gen === generation) failed = { at: clock(), locale }
      throw e
    })
    .finally(() => {
      if (gen === generation && inflight.get(locale) === promise) inflight.delete(locale)
    })
  inflight.set(locale, promise)
  return promise
}

const recentlyFailed = (locale) => failed?.locale === locale && clock() - failed.at < FAIL_MS

/**
 * Anasayfa açılırken kapıdan (`AuthGate` › `WarmHome`), oturum belli olur olmaz: sıcaklık sayfanın
 * en büyük içeriği (LCP) ve konum + tahmin App ile sayfa parçası inene kadar beklemesin. Tazeyse,
 * uçuştaysa ya da az önce düştüyse bir şey yapmaz — düşen turdan sonra kart hatayı göstermiştir,
 * sessizce başlayan yeni turu görmezdi (kart "Yeniden dene"de kalırdı).
 */
export function prefetchWeather(locale) {
  if (!WEATHER.enabled || fresh(locale) || recentlyFailed(locale)) return
  start(locale).catch(() => {})
}

const HOUR = 60 * 60 * 1000
// ⚠️ "Taze" İKİ şart: önbellek ömrü (30 dk) VE tahminin "şimdi"si bitmemiş olmalı.
// Ömür tek başına yetmiyordu: saat dönünce hap ve "Şimdi" hücresi geçen saati
// anlatıyordu (ölçüldü: 19:55'te alınan tahmin 20:20'de hâlâ 19:00'u gösteriyordu).
const fresh = (locale) =>
  cache &&
  cache.locale === locale &&
  Date.now() - cache.at < WEATHER.ttlMs &&
  Date.now() < cache.forecast.current.at.getTime() + HOUR

/**
 * @returns {{ status: "off"|"loading"|"ready"|"error", place?, forecast?,
 *   locating: boolean, notice: ""|"denied"|"unavailable", locateMe: () => Promise<void>,
 *   retry: () => void }}
 */
/**
 * `enabled: false` → hiç istek yok, durum `off`. Çağıran kancayı KOŞULSUZ
 * çağırır. (2026-10-03'e kadar Akışım kutlama günü kapatıyordu; artık tebrik
 * hava kartının içinde ve kart o gün de çizilir — bugün tüketicisi yok.)
 */
export function useWeather({ enabled = true } = {}) {
  const on = WEATHER.enabled && enabled
  const { locale } = useLocale()
  // Başka dildeki önbellek ilk çizimde gösterilmez (yer adı o dilde).
  const [state, setState] = useState(() =>
    !WEATHER.enabled
      ? { status: "off" }
      : cache?.locale === locale
        ? { status: "ready", ...cache }
        : { status: "loading" },
  )
  const [nonce, setNonce] = useState(0)
  const [locating, setLocating] = useState(false)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (!on) return undefined
    let alive = true
    // Taze önbellek de buradan: önyükleme (`prefetchWeather`) ilk çizimle efekt arasında
    // bitmiş olabilir — kart "yükleniyor"da kalmasın. Önyükleme az önce düştüyse (sağlayıcı
    // kapalı) ikinci tur atılmaz, hata gösterilir; "Yeniden dene" (`nonce`) yine dener.
    const job = fresh(locale)
      ? Promise.resolve(cache)
      : nonce === 0 && recentlyFailed(locale)
        ? Promise.reject(new Error("recent"))
        : start(locale)
    job.then(
      (v) => {
        if (alive)
          setState((s) => (s.status === "ready" && s.at === v.at ? s : { status: "ready", ...v }))
      },
      () => {
        if (alive) setState((s) => (s.status === "ready" ? s : { status: "error" }))
      },
    )
    return () => {
      alive = false
    }
  }, [locale, nonce, on])

  // Sayfa açık ve GÖRÜNÜR kaldıkça "şimdi" ilerlesin: tahminin şimdisi bitince bir
  // kez tazele (en geç bir saat). Gizli sekmede tetiklenmez — dönüşte aşağıdaki
  // `visibilitychange` zaten soruyor. Uçuştaki tur paylaşıldığı için iki tüketici
  // iki istek atmaz.
  const currentAt = state.status === "ready" ? state.forecast.current.at.getTime() : 0
  useEffect(() => {
    if (!on || !currentAt) return undefined
    const id = setTimeout(
      () => {
        if (document.visibilityState === "visible" && !fresh(locale)) setNonce((n) => n + 1)
      },
      Math.max(0, currentAt + HOUR - Date.now()) + 15_000,
    )
    return () => clearTimeout(id)
  }, [currentAt, locale, on])

  // Sekmeye dönüşte bayatsa tazele (sayfa gün boyu açık kalabiliyor).
  useEffect(() => {
    if (!on) return undefined
    const onVisible = () => {
      if (document.visibilityState === "visible" && !fresh(locale)) setNonce((n) => n + 1)
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [locale, on])

  // Hava alınamadıysa kartın "Yeniden dene"si: aynı zincir baştan.
  const retry = useCallback(() => {
    setState({ status: "loading" })
    setNonce((n) => n + 1)
  }, [])

  const locateMe = useCallback(async () => {
    setLocating(true)
    setNotice("")
    // İzin penceresi açıkken çıkış yapılabilir: biten konum bir sonraki kullanıcıya yazılmaz.
    const gen = generation
    try {
      const v = await load(locale, true)
      if (gen !== generation) return
      preferPrecise = true
      cache = v
      setState({ status: "ready", ...v })
    } catch (e) {
      if (gen === generation) setNotice(e?.code === "denied" ? "denied" : "unavailable")
    } finally {
      setLocating(false)
    }
  }, [locale])

  // DEV: `?data=worst` en kötü veri (src/dev/worstCase); üretimde ölü kod.
  const worst = import.meta.env.DEV && on ? worstWeather(state) : null
  if (worst) return { ...worst, locating, notice, locateMe, retry }
  return on
    ? { ...state, locating, notice, locateMe, retry }
    : { status: "off", locating: false, notice: "", locateMe, retry }
}
