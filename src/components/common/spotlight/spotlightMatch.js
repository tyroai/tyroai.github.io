import { foldAll } from "@/lib/peopleIndex"

/**
 * Spotlight'ın saf eşleştirmesi: sayfalar, eylemler ve Yardım cevapları için puan (kişi ve ofis
 * kendi aramalarıyla gelir). Türkçe harf ve aksan duyarsız; her sorgu kelimesi eşleşmeli.
 */

const SPLIT = /[\s,.;:/\\|()"'’+_–—›-]+/
const words = (s) => foldAll(s).split(SPLIT).filter(Boolean)

/** Puan: 0 eşleşme yok; metnin başı 100, kelime başı 80, kelimenin içi (≥ 3 harf) 20 — toplamı. */
export function textScore(text, query) {
  const tokens = words(query)
  if (!tokens.length) return 0
  const full = foldAll(text)
  const ws = words(text)
  let score = 0
  for (const t of tokens) {
    const s = full.startsWith(t)
      ? 100
      : ws.some((w) => w.startsWith(t))
        ? 80
        : t.length >= 3 && full.includes(t)
          ? 20
          : 0
    if (!s) return 0
    score += s
  }
  return score
}

/** Etiket önce; etikette yoksa ek arama sözcükleri yarım puanla. */
export function itemScore(label, keys, query) {
  const own = textScore(label, query)
  if (own) return own
  return keys ? Math.round(textScore(keys, query) / 2) : 0
}

/** Yardım: soruda geçen önde; yalnız cevapta geçen yarım puanla. */
export function faqScore(question, answer, query) {
  const q = textScore(question, query)
  if (q) return q + 10
  const both = textScore(`${question} ${answer}`, query)
  return both ? Math.round(both / 2) : 0
}

/** Puana göre (eşitse ilk sıra korunur) en iyi `limit` öğe. */
export function topScored(list, score, limit) {
  return list
    .map((item, i) => ({ item, i, s: score(item) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.item)
}

const ORDER = ["recent", "people", "offices", "pages", "actions", "help", "files", "external"]

/**
 * Grupların sırası: sabit sıra (kişiler önde — en sık aranan); yalnız bir sayfanın adı sorguyla
 * BAŞLIYORSA sayfalar en başa geçer ("to-do" yazan gezinmek istiyor).
 */
export function orderGroups(groups, query) {
  const pageLead = groups.some(
    (g) => g.id === "pages" && g.items.some((it) => foldAll(it.label).startsWith(foldAll(query))),
  )
  const rank = (g) => (pageLead && g.id === "pages" ? -1 : ORDER.indexOf(g.id))
  return [...groups].sort((a, b) => rank(a) - rank(b))
}
