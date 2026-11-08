/**
 * Self Servis — uzun listenin parça parça açılması (saf). Kayıtlar bellekte; yüzlerce satırı
 * birden çizmek telefonda yavaş ve yorucu: ilk `limit` kayıt, ay grupları bozulmadan.
 */

export const LIST_PAGE = 40

/**
 * Ay gruplarından ilk `limit` kayıt → `{ groups, shown, total }`. Kesilen grubun başlığı
 * ayın gerçek sayısını göstermeye devam etsin diye `count` taşır.
 */
export function limitGroups(groups, limit = LIST_PAGE) {
  const out = []
  let left = limit
  let total = 0
  for (const g of groups ?? []) {
    total += g.items.length
    if (left <= 0) continue
    const items = left >= g.items.length ? g.items : g.items.slice(0, left)
    left -= items.length
    out.push(items === g.items ? g : { ...g, items, count: g.items.length })
  }
  return { groups: out, shown: Math.min(limit, total), total }
}
