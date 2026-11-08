import { STATUS, graphGet } from "@/lib/graph"

/**
 * Paylaşılan takvimlerde kişinin "şu an"ı — saf hesap (`personStatus`, testli) ve Outlook'ta
 * seninle paylaşılmış takvimlerin sahipleri (`fetchCalendarOwners`, öneri için).
 */

// Meşgul sayılan: boş ("free") ve başka yerde çalışma dışındaki her şey.
const BUSY = new Set(["busy", "oof", "tentative", "unknown"])
const GAP_MS = 60_000

const lower = (s) => String(s ?? "").toLowerCase()

/** Kişinin etkinlikleri (takvim okumasının `owner` alanı). */
export const eventsOf = (events, address) =>
  (events ?? []).filter((e) => e.owner && lower(e.owner.address) === lower(address))

const isBusy = (e) => !e.isAllDay && BUSY.has(e.showAs ?? "busy")

/**
 * `{ kind, until }`: `oof` (tüm gün ofis dışı — `until` dönüş günü), `busy` / `tentative`
 * (arka arkaya toplantılar tek blok — `until` bloğun sonu), `free` (`until` bugünkü sıradaki
 * kaydın başı ya da `null`).
 */
export function personStatus(events, now) {
  const at = (d) => d.getTime()
  const list = events ?? []
  const away = list.find(
    (e) => e.isAllDay && e.showAs === "oof" && at(e.start) <= now && now < at(e.end),
  )
  if (away) return { kind: "oof", until: away.end }
  const timed = list.filter(isBusy).sort((a, b) => a.start - b.start)
  const current = timed.filter((e) => at(e.start) <= now && now < at(e.end))
  if (current.length) {
    let until = Math.max(...current.map((e) => at(e.end)))
    for (const e of timed) if (at(e.start) <= until + GAP_MS && at(e.end) > until) until = at(e.end)
    const firm = current.some((e) => (e.showAs ?? "busy") !== "tentative")
    return { kind: firm ? "busy" : "tentative", until: new Date(until) }
  }
  const dayEnd = new Date(now)
  dayEnd.setHours(23, 59, 59, 999)
  const next = timed.find((e) => at(e.start) > now && e.start <= dayEnd)
  return { kind: "free", until: next ? next.start : null }
}

/**
 * Takvim listesinde sahibi sen olmayanlar (Outlook'ta kabul edilmiş paylaşımlar, ortak posta kutusu
 * takvimleri): `{ name, address }` — "şu takvimi ekle" önerisi. Takvim içeriği okunmaz.
 */
export async function fetchCalendarOwners(instance, account) {
  const res = await graphGet(instance, account, {
    path: "/me/calendars?$select=name,owner&$top=100",
    scopes: ["Calendars.Read"],
  })
  if (res.status !== STATUS.ready) return { status: res.status }
  const me = lower(account?.username)
  const seen = new Map()
  for (const c of res.data?.value ?? []) {
    const address = c.owner?.address
    if (!address || lower(address) === me || seen.has(lower(address))) continue
    seen.set(lower(address), { address, name: c.owner.name || address })
  }
  return { status: STATUS.ready, data: [...seen.values()] }
}
