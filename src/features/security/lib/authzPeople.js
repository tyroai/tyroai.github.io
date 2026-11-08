import { hasApp, isStale } from "@/lib/authzView"
import { fold } from "@/lib/fold"

/** Kişiler listesinin rol filtresi değerleri (URL'de `role`). */
export const ROLES = ["all", "admins", "stale"]

/**
 * Kişiler listesi: rol ("all" · "admins" · "stale"), uygulamalar (biri yeterli — VEYA) ve arama
 * (adres + uygulama adları, harf/aksan duyarsız). Sıra korunur (kayıtlar adrese göre sıralı gelir).
 */
export function filterPeople(rows, { query = "", role = "all", apps = [], known }) {
  const needle = fold(query.trim())
  return (rows ?? []).filter((r) => {
    if (role === "admins" && !r.isAdmin) return false
    if (role === "stale" && !isStale(r, known)) return false
    if (apps.length && !apps.some((a) => hasApp(r, a))) return false
    return !needle || fold(`${r.upn} ${(r.apps ?? []).join(" ")}`).includes(needle)
  })
}

/** Sayfa dilimi: `page` 1'den başlar ve aralığa sıkıştırılır; `from`/`to` 1 tabanlı. */
export function pageOf(list, page, size) {
  const pageCount = Math.max(1, Math.ceil(list.length / size))
  const at = Math.min(Math.max(1, page), pageCount)
  const start = (at - 1) * size
  return {
    page: at,
    pageCount,
    slice: list.slice(start, start + size),
    from: list.length ? start + 1 : 0,
    to: Math.min(start + size, list.length),
  }
}

/**
 * Shift-tık aralığı (Gmail): `ids` görünür sıra, `anchor` son tıklanan, `target` şimdiki.
 * Çapa listede yoksa yalnız hedef döner.
 */
export function rangeIds(ids, anchor, target) {
  const a = ids.indexOf(anchor)
  const b = ids.indexOf(target)
  if (b === -1) return []
  if (a === -1) return [target]
  return ids.slice(Math.min(a, b), Math.max(a, b) + 1)
}

/** Giriş adresinden baş harfler ("ayse.yilmaz@…" → "AY"); avatar için, uydurma ad yok. */
export function initialsOf(upn) {
  const local = String(upn ?? "").split("@")[0]
  const parts = local.split(/[._\-\s]+/).filter(Boolean)
  const letters = (parts.length > 1 ? [parts[0], parts[parts.length - 1]] : [local])
    .map((p) => p.charAt(0))
    .join("")
  return letters.toLocaleUpperCase("tr").slice(0, 2) || "?"
}

/**
 * Süzülmüş listenin CSV'si (denetim için dışa aktarım): `;` ayraçlı ve BOM'lu — Türkçe Excel
 * ikisini de bekliyor. Hücreler tırnaklı, içteki tırnak ikilenir; formül enjeksiyonuna karşı
 * `= + - @` ile başlayan hücre kesmeyle başlar.
 *
 * @param {{ upn: string, apps: string[], isAdmin: boolean }[]} rows
 * @param {{ header: [string, string, string], yes: string, no: string }} labels
 */
export function peopleCsv(rows, { header, yes, no }) {
  const cell = (v) => {
    const text = String(v ?? "")
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
    return `"${safe.replace(/"/g, '""')}"`
  }
  const lines = [header.map(cell).join(";")]
  for (const r of rows ?? []) {
    lines.push([r.upn, r.isAdmin ? yes : no, (r.apps ?? []).join(", ")].map(cell).join(";"))
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`
}
