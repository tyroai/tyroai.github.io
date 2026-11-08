// tyroRM sayı ve tarih biçimleri (Intl; dile göre "%86" / "86%", "30.06" / "06/30").
import { dayToDate } from "@/lib/rm/engine/dates"

const cache = new Map()
function fmt(kind, locale, opts) {
  const key = `${kind}|${locale}|${JSON.stringify(opts)}`
  if (!cache.has(key)) {
    cache.set(
      key,
      kind === "n" ? new Intl.NumberFormat(locale, opts) : new Intl.DateTimeFormat(locale, opts),
    )
  }
  return cache.get(key)
}

/** Oran → yüzde ("%86"); sonsuz ya da yoksa "—". */
export function pct(x, locale) {
  if (x == null || !Number.isFinite(x)) return "—"
  return fmt("n", locale, { style: "percent", maximumFractionDigits: 0 }).format(x)
}

export function num(n, locale, digits = 0) {
  if (n == null || !Number.isFinite(n)) return "—"
  return fmt("n", locale, { maximumFractionDigits: digits }).format(n)
}

/** Gün numarası → "30.06" (yıl ayrı istenirse "30.06.2027"). */
export function day(n, locale, { year = false } = {}) {
  if (n == null) return "—"
  const opts = year
    ? { day: "2-digit", month: "2-digit", year: "numeric" }
    : { day: "2-digit", month: "2-digit" }
  return fmt("d", locale, opts).format(dayToDate(n))
}

/** Gün numarası → kısa gün adı ("Çar"). */
export function weekday(n, locale) {
  if (n == null) return ""
  return fmt("d", locale, { weekday: "short" }).format(dayToDate(n))
}

/** Gün numarası → "30 Haz" ya da uzun "30 Haziran 2027". */
export function dayLabel(n, locale, { long = false } = {}) {
  if (n == null) return "—"
  const opts = long
    ? { day: "numeric", month: "long", year: "numeric" }
    : { day: "numeric", month: "short" }
  return fmt("d", locale, opts).format(dayToDate(n))
}

/** Ay adı: kısa "Kas", uzun "Kasım 2026". */
export function monthLabel(y, m, locale, { long = false } = {}) {
  const opts = long ? { month: "long", year: "numeric" } : { month: "short" }
  return fmt("d", locale, opts).format(new Date(y, m, 15))
}

/** ISO zaman damgası → "21.10 14:32". */
export function stamp(iso, locale) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return fmt("d", locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

/** Kategori adı ekranda "Projesi" eki olmadan ("ERP Projesi" → "ERP"); veri değişmez. */
export function catLabel(name) {
  const s = String(name || "")
  return s.replace(/\s*Projesi$/i, "").trim() || s
}
