import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import { useMsal } from "@azure/msal-react"
import { DAYS, MAX_PEOPLE, SLOT_MIN, parseSchedules, slotStart } from "@/lib/commonTime"
import { STATUS, graphPost } from "@/lib/graph"
import { isMsalConfigured } from "@/lib/msal"
import { onSessionClear, PERSONAL_STORAGE } from "@/lib/sessionCache"

/**
 * Ortak saat kartının verisi: iğnelenen kişiler (`[{ name, address }]`, en çok 6) ve onların +
 * senin getSchedule cevabın (`lib/commonTime`). Kişiler yerel depoda, cevap bellekte (10 dk);
 * ikisi de çıkışta silinir (`clearCommonTime`, `lib/sessionCache`) — iş arkadaşlarının adresi
 * ve takvim durumu kişisel veri. Yoklama yok: kart açılınca ya da "Yenile"de sorulur.
 */
const KEY = PERSONAL_STORAGE.commonTime.key
const TTL_MS = 10 * 60_000
const SCOPES = ["Calendars.Read"]
let pinned = null // depodaki liste (bir kez okunur)
let cache = null // { key, at, value }
const listeners = new Set()

function read() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]")
    return Array.isArray(list) ? list.filter((p) => p?.address).slice(0, MAX_PEOPLE) : []
  } catch {
    return []
  }
}
const people = () => (pinned ??= read())
const none = () => []
const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const emit = () => listeners.forEach((fn) => fn())

export function savePeople(list) {
  pinned = list.filter((p) => p?.address).slice(0, MAX_PEOPLE)
  try {
    if (pinned.length) localStorage.setItem(KEY, JSON.stringify(pinned))
    else localStorage.removeItem(KEY)
  } catch {
    // Depo kapalı: seçim bu oturumda kalır.
  }
  emit()
}

export function clearCommonTime() {
  pinned = null
  cache = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Depo kapalı: silinecek bir şey yok.
  }
  emit()
}
onSessionClear(clearCommonTime)

// Graph'ın saat dilimsiz biçimi: "2026-10-26T10:00:00" (dilim ayrı alanda, UTC).
const graphTime = (ms) => ({ dateTime: new Date(ms).toISOString().slice(0, 19), timeZone: "UTC" })

/**
 * `{ people, status, start, schedules, me, refresh }` — `status`: idle (kimse seçilmedi) ·
 * loading · ready · denied · error · signedOut; `schedules` `parseSchedules` biçiminde, ilki sen.
 */
export function useCommonTime() {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const list = useSyncExternalStore(subscribe, people, none)
  const me = (account?.username ?? "").toLowerCase()
  const addresses = [me, ...list.map((p) => p.address.toLowerCase()).filter((a) => a !== me)]
  const key = addresses.join(",")
  const [state, setState] = useState(null) // { key, value }
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!isMsalConfigured || !account || !list.length) return undefined
    if (!nonce && cache?.key === key && Date.now() - cache.at < TTL_MS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- önbellekten anında
      setState({ key, value: cache.value })
      return undefined
    }
    let alive = true
    const start = slotStart(Date.now())
    graphPost(instance, account, {
      path: "/me/calendar/getSchedule",
      scopes: SCOPES,
      body: {
        schedules: key.split(","),
        startTime: graphTime(start),
        endTime: graphTime(start + DAYS * 86_400_000),
        availabilityViewInterval: SLOT_MIN,
      },
    }).then((res) => {
      const value =
        res.status === STATUS.ready
          ? { status: "ready", start, schedules: parseSchedules(res.data?.value) }
          : { status: res.status === STATUS.denied ? "denied" : "error" }
      if (value.status === "ready") cache = { key, at: Date.now(), value }
      if (alive) setState({ key, value })
    })
    return () => {
      alive = false
    }
  }, [instance, account, key, list.length, nonce])

  const refresh = useCallback(() => setNonce((n) => n + 1), [])
  const current = !list.length
    ? { status: "idle" }
    : !isMsalConfigured || !account
      ? { status: "signedOut" }
      : state?.key === key
        ? state.value
        : { status: "loading" }
  return { people: list, me, refresh, ...current }
}
