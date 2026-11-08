import { firstName } from "@/lib/celebrate"
import { isReport } from "@/lib/teamCircle"

/**
 * Kasım–Aralık'ta yıl sonuna kalan yıllık izin — YALNIZ doğrudan bağlılar (bakiyesi zaten yalnız
 * onlar için okunuyor; ekip arkadaşının bakiyesi görünmez). Kalanı bir günden az olan yazılmaz.
 * Ekibim satırlarından (`teamOverview` › `rows`): `[{ key, name, remain }]`, çoktan aza.
 */
export function yearEndLeave(rows, now = Date.now()) {
  if (new Date(now).getMonth() < 10) return []
  return (rows ?? [])
    .filter((r) => isReport(r) && (r.balance?.remain ?? 0) >= 1)
    .map((r) => ({
      key: r.key,
      name: r.person?.givenName || firstName(r.person?.name ?? ""),
      remain: r.balance.remain,
    }))
    .sort((a, b) => b.remain - a.remain)
}
