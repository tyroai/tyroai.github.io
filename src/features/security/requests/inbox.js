import { catalogNameKey } from "@/lib/agentName"
import { fold } from "@/lib/fold"

/** Kaç günü geçen bekleyen talep kehribara döner (hata değil, hatırlatma). */
export const AGED_DAYS = 3

/** Bölüm sayıları — arama bunları değiştirmez (bölmenin yanındaki sayı "kuyrukta kaç iş"). */
export function inboxCounts(requests) {
  const pending = (requests ?? []).filter((r) => !r.isCompleted).length
  return { pending, done: (requests ?? []).length - pending, all: (requests ?? []).length }
}

/**
 * Bölüm + arama sonrası iki liste: bekleyenler ve tamamlananlar (ikisi de en yeni önce, sorgu
 * sırası). Arama kişide, uygulamada ve iki notta: "lisans" diyen o gerekçeli talepleri bulur.
 */
export function inboxView(requests, { segment = "pending", query = "" } = {}) {
  const needle = fold(query)
  const hit = (r) =>
    !needle || fold(`${r.upn} ${r.app} ${r.userNote} ${r.adminNote}`).includes(needle)
  const list = (requests ?? []).filter(hit)
  return {
    pending: segment === "done" ? [] : list.filter((r) => !r.isCompleted),
    done: segment === "pending" ? [] : list.filter((r) => r.isCompleted),
  }
}

/**
 * Gruplama: `none` tek grup; `person` giriş adresine, `app` uygulama adına (`catalogNameKey`)
 * göre. Grup sırası ilk görünüşe göre — liste en yeni önce, yani en taze iş üstte kalır.
 */
export function groupRequests(list, by = "none") {
  if (by === "none") return [{ key: "all", label: "", items: list ?? [] }]
  const groups = new Map()
  for (const r of list ?? []) {
    const key = by === "person" ? r.upn.trim().toLowerCase() : catalogNameKey(r.app)
    if (!groups.has(key))
      groups.set(key, { key, label: by === "person" ? r.upn : r.app, items: [] })
    groups.get(key).items.push(r)
  }
  return [...groups.values()]
}

/** Bekleme gün sayısı ve kehribar eşiği. `now` testte sabitlenir. */
export function ageOf(createdOn, now = Date.now()) {
  const d = createdOn ? new Date(createdOn) : null
  if (!d || Number.isNaN(d.getTime())) return { days: 0, aged: false }
  const days = Math.floor((now - d.getTime()) / 86400000)
  return { days, aged: days >= AGED_DAYS }
}
