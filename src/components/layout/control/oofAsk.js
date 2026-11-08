import { leaveKey } from "./oofModel"

/**
 * Otomatik yanıt sorusunun izi (`tyro-oof-ask-v1`, çıkışta silinir — `PERSONAL_STORAGE`): "bu izin
 * için sorma" denen izinlerin ve TYRO'nun onaylı izinden kurduğu yanıtların özeti (tarihler değil,
 * djb2 özeti) ve bildirimin son günü (günde bir). Bütün kancalar aynı kaydı okur (`subscribeOofAsk`):
 * şeritte "sorma" denince kutucuk ve çan da hemen görür.
 */
const KEY = "tyro-oof-ask-v1"
const EVENT = "tyro:oof-ask"
const MAX = 20

const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : [])

/** Ham kayıt: `useSyncExternalStore`un anlık görüntüsü (çözümü `parseOofAsk`). */
export function readOofAskRaw() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** `{ day, skip, ours }`; bozuk ya da boş kayıt boş sayılır. */
export function parseOofAsk(raw) {
  try {
    const v = JSON.parse(raw ?? "null")
    return {
      day: typeof v?.day === "string" ? v.day : null,
      skip: strings(v?.skip),
      ours: strings(v?.ours),
    }
  } catch {
    return { day: null, skip: [], ours: [] }
  }
}

const read = () => parseOofAsk(readOofAskRaw())

function write(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    return // Depo kapalı: bu oturumda yeniden sorabilir.
  }
  window.dispatchEvent(new Event(EVENT))
}

export function subscribeOofAsk(callback) {
  window.addEventListener(EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

function digest(text) {
  let h = 5381
  for (let i = 0; i < text.length; i += 1) h = (h * 33 + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

const add = (list, k) => [...list.filter((x) => x !== k), k].slice(-MAX)
const minutes = (d) => Math.round(d.getTime() / 60_000)

export const skipKey = (leave) => digest(leaveKey(leave))
/** Planlı yanıtın penceresi (dakikaya yuvarlı): Outlook'tan okunan aynı pencereyi tanır. */
export const windowKey = (w) => digest(`${minutes(w.start)}~${minutes(w.end)}`)

export function skipLeave(leave) {
  const cur = read()
  write({ ...cur, skip: add(cur.skip, skipKey(leave)) })
}

/** TYRO onaylı bir izin için yanıt kurdu: izin iptal edilirse kaldırmayı yalnız bunun için sorar. */
export function rememberOurs(w) {
  const cur = read()
  write({ ...cur, ours: add(cur.ours, windowKey(w)) })
}

const dayOf = (now) => new Date(now).toDateString()
export const askedToday = (now) => read().day === dayOf(now)
export const markAsked = (now) => write({ ...read(), day: dayOf(now) })

/** Çanın bekleyen sorusunun anahtarı (tarih değil): kur → iznin özeti, kaldır → yanıtınki. */
export const noticeKey = (ask, state) =>
  ask.kind === "set" ? `o:set:${skipKey(ask.leave)}` : `o:clear:${windowKey(state)}`
