import { fold } from "@/lib/fold"

/**
 * YAZARAK KART YÖNETİMİ (Anasayfa'nın sohbet çubuğu): "piyasayı da göster", "radyo widget'ı ekle",
 * "postaları çıkar". Cümlede bir ekleme ya da çıkarma fiili ve bir kart varsa komuttur; yoksa `null`
 * döner ve cümle her zamanki gibi sohbete gider. Saf ve kural tabanlı. Kart iki yoldan bulunur:
 * önce kişinin dilindeki adıyla (Türkçe ekler önekle karşılanır: "postaları" → "postalar"), ad
 * tutmazsa gündelik karşılığıyla (`ALIASES`: kartın adı "Tyrofy", kişi "radyo" der).
 */
export interface CommandItem {
  id: string
  /** Widget'ın kişinin dilindeki adı. */
  name: string
  /** Şu an panoda mı (çıkarılabilir) yoksa katalogda mı (eklenebilir). */
  onBoard: boolean
}
export interface BoardCommand {
  type: "add" | "remove"
  id: string
}

// Fiil kökleri (katlanmış): çekimli hâli de tutar ("ekler misin", "göstersene", "kaldırır mısın").
const ADD = ["ekle", "goster", "koy", "getir", "add", "show", "добав", "покаж", "أضف", "اعرض"]
const REMOVE = ["cikar", "kaldir", "sil", "gizle", "remove", "hide", "убер", "скро", "احذف", "أخف"]
const FILLER = new Set([
  "kartini",
  "karti",
  "kart",
  "widgetini",
  "widgeti",
  "widget",
  "da",
  "de",
  "bana",
  "bir",
  "tane",
  "yeni",
  "panoya",
  "panoma",
  "panodan",
  "anasayfaya",
  "anasayfadan",
  "sayfaya",
  "sayfadan",
  "ekrana",
  "ekrandan",
  "buraya",
  "buradan",
  "lutfen",
  "misin",
  "misiniz",
  "mi",
  "the",
  "a",
  "card",
  "please",
  "to",
  "from",
  "my",
  "board",
  "home",
  "too",
  "also",
])
/**
 * Gündelik karşılıklar (katlanmış) → kartlar, öncelik sırasıyla: ad tutmayınca bakılır, sıradaki
 * ilk uygun kart seçilir (eklemede panoda olmayan, çıkarmada panodaki).
 */
const ALIASES: readonly (readonly [readonly string[], readonly string[]])[] = [
  [
    ["radyo", "muzik", "sarki", "radio", "music", "радио", "музык", "راديو", "موسيقى"],
    ["tyro-radio-disc", "tyro-radio-stage"],
  ],
  [["borsa", "kur", "altin", "bist", "stocks", "rates"], ["market"]],
  [
    ["doviz", "currency", "converter"],
    ["tyro-fx", "market"],
  ],
  [["posta", "mail", "eposta", "email", "inbox"], ["pending-mail"]],
  [
    ["gorev", "todo", "yapilacak", "task"],
    ["focus", "planner"],
  ],
  [["saat", "clock"], ["world-clock"]],
  [["hava", "weather"], ["region-weather"]],
  [
    ["not", "note"],
    ["sticky", "onenote"],
  ],
  [["ceviri", "cevir", "tercume", "translate", "translation"], ["tyro-translate"]],
  [["tatil", "bayram", "holiday"], ["holiday"]],
  [["seyahat", "yolculuk", "ucus", "trip", "flight"], ["travel"]],
  [["izin", "leave"], ["leave-balance"]],
  [
    ["talep", "request"],
    ["requests", "tibot-rings"],
  ],
  [["ekip", "takim", "team"], ["team-today"]],
  [
    ["destek", "ticket"],
    ["tibot-rings", "tibot-summary"],
  ],
  [["sayac", "pomodoro", "timer"], ["focus-timer"]],
  [
    ["toplanti", "meeting"],
    ["next-meeting", "rhythm", "outcomes"],
  ],
  [["ozet", "summary"], ["brief"]],
  [["rapor", "report"], ["report-day"]],
]
// Karşılıkla bulma yalnız kısa komutta: uzun cümle büyük olasılıkla sohbete sorulan sorudur.
const ALIAS_MAX_WORDS = 2
const MIN = 3

/**
 * Katlanmış sözcükler: Türkçe duyarsız, aksansız, noktalama düşer. Kesme işaretinden sonraki ek
 * atılır ("widget'ı" → "widget"): yoksa tek harflik artık komutu bozar.
 */
const words = (s: string): string[] =>
  fold(s)
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/['’ʼ`]\p{L}*/gu, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean)

/** Karşılık tutuyor mu: kısa kökte ek en çok üç harf ("kurlar" evet, "kurulum" hayır). */
const aliasHit = (target: string, key: string): boolean =>
  target === key || (target.startsWith(key) && (key.length >= 4 || target.length <= key.length + 3))

const isVerb = (stems: readonly string[], w: string): boolean => stems.some((v) => w.startsWith(v))

/** Hedef sözcük adın bir sözcüğünü karşılıyor mu (ek almış hâli de: önek eşleşmesi). */
const hits = (target: string, nameWord: string): boolean =>
  target === nameWord ||
  (nameWord.length >= MIN && target.startsWith(nameWord)) ||
  (target.length >= MIN && nameWord.startsWith(target))

export function parseBoardCommand(
  text: string,
  items: readonly CommandItem[],
): BoardCommand | null {
  const list = words(text)
  const adds = list.some((w) => isVerb(ADD, w))
  const removes = list.some((w) => isVerb(REMOVE, w))
  if (adds === removes) return null
  const type = adds ? "add" : "remove"
  const target = list.filter(
    (w) => w.length > 1 && !isVerb(ADD, w) && !isVerb(REMOVE, w) && !FILLER.has(w),
  )
  if (!target.length) return null
  const usable = items.filter((item) => item.onBoard === (type === "remove"))
  let best: { id: string; score: number } | null = null
  for (const item of usable) {
    const name = words(item.name)
    if (!name.length) continue
    // Cümledeki her hedef sözcük adda karşılık bulmalı; puan adın ne kadarının karşılandığı.
    if (!target.every((tw) => name.some((nw) => hits(tw, nw)))) continue
    const covered = name.filter((nw) => target.some((tw) => hits(tw, nw))).length
    const score = covered / name.length
    if (!best || score > best.score) best = { id: item.id, score }
  }
  if (best) return { type, id: best.id }
  if (target.length > ALIAS_MAX_WORDS) return null
  for (const [keys, ids] of ALIASES) {
    if (!target.every((tw) => keys.some((k) => aliasHit(tw, k)))) continue
    const id = ids.find((x) => usable.some((item) => item.id === x))
    if (id) return { type, id }
  }
  return null
}
