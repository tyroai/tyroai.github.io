import { countClick } from "@/lib/radio"
import { attachMeter, detachMeter } from "@/lib/radioMeter"
import { readRadioPrefs, writeRadioPrefs } from "@/lib/radioPrefs"
import { setRadioActive } from "@/lib/radioSignal"
import { onSessionClear } from "@/lib/sessionCache"

/**
 * Radyo çaları — sayfadan BAĞIMSIZ tek örnek: sayfa değişince yayın kesilmez, header'daki
 * hap ve işletim sisteminin medya denetimleri (Media Session: klavyenin medya tuşları,
 * kilit ekranı) aynı çalara bağlı. Durum `{ station, status, volume, muted, error, since }`;
 * `status`: idle · loading · playing · paused · error; `since` dinlemenin başladığı an.
 *
 * ⚠️ Her istasyon (ve her devam) YENİ bir `Audio`: canlı yayında duraklatıp devam etmek
 * eski tamponu çalardı; eski öğenin olayları da yeni istasyonun durumunu bozamaz.
 * Duraklatınca bağlantı kapanır (veri boşa inmez), devamda canlıya yeniden bağlanılır.
 */
const STALL_MS = 15000
// Kararlı çalmadan (bu kadar) sonra kopan yayına yeniden bağlanılır.
const STABLE_MS = 30000

let state = {
  station: null,
  status: "idle",
  volume: readRadioPrefs().volume,
  muted: false,
  since: null,
}
// Son duyulur düzey: %0'da "sesi aç" buna döner (yalnız bayrağı çevirmek sessiz bırakıyordu).
let audible = state.volume > 0 ? state.volume : null
let current = null // { audio, ctrl }
let queue = []
let stall = null
let retried = false // bu çalma için yeniden denendi mi
let cors = false // çalan öğe CORS'lu mu
let sessionFor = null
const listeners = new Set()
const clicked = new Set()

export function subscribeRadio(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getRadioState() {
  return state
}

function emit(patch) {
  state = { ...state, ...patch }
  setRadioActive(Boolean(state.station))
  syncSession()
  listeners.forEach((fn) => fn())
}

function clearStall() {
  clearTimeout(stall)
  stall = null
}

// Bağlanamayan ya da takılan yayın sonsuza dek "bağlanıyor" demesin.
function armStall() {
  clearStall()
  stall = setTimeout(() => state.status === "loading" && failOrRetry(), STALL_MS)
}

function detach() {
  clearStall()
  if (!current) return
  const { audio, ctrl } = current
  current = null
  ctrl.abort()
  detachMeter()
  audio.pause()
  audio.removeAttribute("src")
  audio.load()
}

function fail() {
  detach()
  emit({ status: "error", error: "unavailable", since: null })
}

// Yayın CORS'lu açılır: header çubukları sesi ancak böyle ölçebiliyor (`radioMeter`), HLS'in
// başka sunucudan gelen parçalarını da Chromium'un yerleşik HLS'i ancak böyle kabul ediyor (ör.
// radyotvonline edge → chunks2). En çok dinlenen 49 yayının hepsi izin veriyor (ölçüldü).
// Düşen bağlantı bir kez yeniden denenir, CORS'SUZ: izin vermeyen yayın da çalsın; ayrıca
// StreamTheWorld'ün yönlendirme sunucusu ara sıra yanıtsız kalıyor, yeni istek genelde hemen
// çalıyor. Uzun süre çaldıktan sonra kopan yayın (mobil ağ) aynı biçimde yeniden bağlanır.
function failOrRetry() {
  const st = state.station
  const stable = state.since != null && Date.now() - state.since >= STABLE_MS
  if (st && (!retried || stable)) playStation(st, { retry: true, cors: stable && cors })
  else fail()
}

function attach(station, withCors) {
  detach()
  cors = withCors
  const audio = new Audio()
  audio.preload = "none"
  if (withCors) audio.crossOrigin = "anonymous"
  audio.volume = state.volume
  audio.muted = state.muted
  const ctrl = new AbortController()
  const on = (ev, fn) => audio.addEventListener(ev, fn, { signal: ctrl.signal })
  on("playing", () => {
    clearStall()
    if (withCors) attachMeter(audio)
    // Tamponlamadan dönüş süreyi sıfırlamaz.
    emit({ status: "playing", error: null, since: state.since ?? Date.now() })
  })
  on("waiting", () => {
    emit({ status: "loading" })
    armStall()
  })
  // Sistemden gelen duraklatma (kulaklık çıktı, başka uygulama sesi aldı).
  on("pause", () => state.status === "playing" && pauseRadio())
  on("error", failOrRetry)
  // Canlı yayında "bitti" = sunucu bağlantıyı kapattı.
  on("ended", failOrRetry)
  audio.src = station.url
  current = { audio, ctrl }
  return audio
}

export async function playStation(station, { retry = false, cors: withCors = true } = {}) {
  if (!station?.url) return
  retried = retry
  const audio = attach(station, withCors)
  emit({ station, status: "loading", error: null, since: null })
  armStall()
  if (!retry && !clicked.has(station.id)) {
    clicked.add(station.id)
    countClick(station.id)
  }
  try {
    await audio.play()
  } catch (e) {
    if (current?.audio !== audio || e?.name === "AbortError") return
    if (e?.name === "NotAllowedError") {
      detach()
      emit({ status: "paused", since: null })
    } else failOrRetry()
  }
}

export function pauseRadio() {
  if (!state.station) return
  detach()
  emit({ status: "paused", since: null })
}

/** Çalıyorsa duraklat, değilse (verilen ya da son) istasyonu çal. */
export function toggleRadio(station = state.station) {
  const busy = state.status === "playing" || state.status === "loading"
  if (busy && (!station || station.id === state.station?.id)) pauseRadio()
  else playStation(station)
}

export function stopRadio() {
  detach()
  queue = []
  emit({ station: null, status: "idle", error: null, since: null })
}
onSessionClear(stopRadio)

/** Sonraki/önceki ve medya tuşları bu sıradan yürür (widget listesini verir). */
export function setRadioQueue(list) {
  queue = Array.isArray(list) ? list : []
}

/** Sıradaki istasyon sayısı: önceki/sonraki düğmeleri ancak sıra varken (widget verir). */
export const radioQueueSize = () => queue.length

export function stepRadio(dir) {
  if (!queue.length) return
  const i = queue.findIndex((s) => s.id === state.station?.id)
  const at = i < 0 ? (dir > 0 ? 0 : queue.length - 1) : (i + dir + queue.length) % queue.length
  playStation(queue[at])
}

export function setRadioVolume(v) {
  const volume = Math.min(1, Math.max(0, Number(v) || 0))
  if (volume > 0) audible = volume
  if (current) {
    current.audio.volume = volume
    current.audio.muted = false
  }
  writeRadioPrefs({ volume })
  emit({ volume, muted: false })
}

export function toggleRadioMute() {
  if (state.volume === 0) return setRadioVolume(audible ?? 0.5)
  const muted = !state.muted
  if (current) current.audio.muted = muted
  emit({ muted })
}

function syncSession() {
  const ms = typeof navigator !== "undefined" ? navigator.mediaSession : null
  if (!ms || typeof MediaMetadata === "undefined") return
  const st = state.station
  if (!st) {
    sessionFor = null
    ms.metadata = null
    ms.playbackState = "none"
    return
  }
  if (sessionFor !== st.id) {
    sessionFor = st.id
    ms.metadata = new MediaMetadata({
      title: st.name,
      artist: [st.state, st.tags?.[0]].filter(Boolean).join(" · "),
      album: "TYRO",
      artwork: st.favicon ? [{ src: st.favicon }] : [],
    })
    const handlers = {
      play: () => playStation(state.station),
      pause: pauseRadio,
      stop: stopRadio,
      previoustrack: () => stepRadio(-1),
      nexttrack: () => stepRadio(1),
    }
    for (const [action, fn] of Object.entries(handlers)) {
      try {
        ms.setActionHandler(action, fn)
      } catch {
        // tarayıcı bu eylemi tanımıyor
      }
    }
  }
  ms.playbackState = state.status === "playing" || state.status === "loading" ? "playing" : "paused"
}
