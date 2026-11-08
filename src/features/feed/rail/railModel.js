/** Sağ rayın saf mantığı: gönderene göre gruplama, işaretler ve ray bölümleri. */

/** Özelleştir'de ayrı ayrı açılıp kapanan üç Outlook işareti (sıra = listedeki sıra). */
export const MARK_KINDS = ["flagged", "high", "pinned"]

/** Sağ rayın bölümleri; `hidden` kümesinde `rail.<kimlik>` olarak saklanır. */
export const RAIL_SECTIONS = ["senders", "pinned", "channels"]
export const railKey = (id) => `rail.${id}`

/** Bir posta birden çok işaret taşıyabilir: sabit · bayrak · yüksek önem. */
export function marksOf(post) {
  const out = []
  if (post.flag === "flagged") out.push("flagged")
  if (post.importance === "high") out.push("high")
  if (post.pinned) out.push("pinned")
  return out
}

/**
 * Akışta gizli mi: kanal postası kanalına, kişisel posta işaretlerine bakar. Posta ancak
 * TÜM işaretleri kapalıysa çıkar (bayraklı ve önemli bir posta, biri açıkken görünür kalır).
 */
export function isHiddenPost(post, hidden) {
  if (!post.personal) return hidden.has(post.tag)
  const marks = marksOf(post)
  return marks.length > 0 && marks.every((k) => hidden.has(k))
}

const time = (p) => p.received?.getTime() ?? 0

/**
 * Kişisel postaları göndericiye (adrese) göre böler: çoktan aza, eşitlikte en yeni üstte.
 * Ad, o göndericinin en yeni postasındaki görünen addır; yoksa adres.
 */
export function senderGroups(posts) {
  const map = new Map()
  for (const p of posts) {
    if (!p.personal || !p.address) continue
    const g = map.get(p.address) ?? { address: p.address, name: "", count: 0, latest: -1 }
    g.count += 1
    if (time(p) > g.latest || !g.name) {
      g.latest = time(p)
      g.name = p.author || g.name
    }
    map.set(p.address, g)
  }
  return [...map.values()]
    .map((g) => ({ ...g, name: g.name || g.address }))
    .sort((a, b) => b.count - a.count || b.latest - a.latest || a.name.localeCompare(b.name))
}

/** Sabitlenmiş postalar, en yeni üstte (kanal postası da olabilir). */
export function pinnedMail(items) {
  return (items ?? []).filter((p) => p.pinned).sort((a, b) => time(b) - time(a))
}
