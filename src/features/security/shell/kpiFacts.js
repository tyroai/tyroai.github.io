import { catalogNameKey } from "@/lib/agentName"

/**
 * Özet kutularının alt satırları için ham bilgiler (metin bileşende `t` ile): yönetici olmayan
 * kullanıcı başına ortalama uygulama, en eski bekleyen talebin tarihi, en çok verilen uygulama.
 * Yönetici sayılmaz: kilidi atladığı için listesi erişimi belirlemiyor.
 */
export function kpiFacts({ authorizations = [], requests = [] }) {
  const users = authorizations.filter((r) => !r.isAdmin)
  const total = users.reduce((sum, r) => sum + (r.apps?.length ?? 0), 0)
  const avg = users.length ? total / users.length : 0
  let oldestOn = null
  for (const r of requests) {
    if (r.isCompleted || !r.createdOn) continue
    if (!oldestOn || new Date(r.createdOn) < new Date(oldestOn)) oldestOn = r.createdOn
  }
  const tally = new Map()
  for (const r of users) {
    for (const a of r.apps ?? []) {
      const k = catalogNameKey(a)
      const cur = tally.get(k) ?? { name: a, n: 0 }
      cur.n += 1
      tally.set(k, cur)
    }
  }
  let top = null
  for (const v of tally.values()) if (!top || v.n > top.n) top = v
  return { avg, oldestOn, top }
}
