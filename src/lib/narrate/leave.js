import { addDays, startOfDay } from "@/lib/leaveDays"
import { nextWorkday } from "./calendar"
import { readDates, spanEnd } from "./dates"
import { findStem, stem, words } from "./text"

/**
 * Anlat › izin (saf): tür (anahtar kelimelerden) ve tarihler (`readDates`). Bulunmayan alan
 * dokunulmaz: tür yazılmadıysa formun varsayılanı kalır. Açıkça yazılan "<tür> izni" önce gelir
 * ("annem hasta, mazeret izni" mazeret). "doğum günü" doğum izni değildir; "eşim doğum yapacak"
 * babalık iznidir; doktor/hastane randevusu mazerettir ("hasta", "rapor", "grip" hastalık);
 * akrabanın hastalığı ya da düğünü kişinin hastalık/evlilik izni sayılmaz ("kardeşimin düğünü").
 * Yarım gün ya da saatlik izin yok (yalnız günlük): yazılırsa uyarılır.
 */
const KINDS = [
  ["sick", ["hastalik", "hasta", "rapor", "ameliyat", "grip", "nezle", "migren", "ates"]],
  [
    "excuse",
    ["mazeret", "doktor", "hastane", "randevu", "tasin", "nakliye", "mahkeme", "okul", "veli"],
  ],
  ["marriage", ["evlilik", "dugun", "nikah", "evlen"]],
  ["bereavement", ["vefat", "olum", "cenaze", "taziye"]],
  ["paternity", ["babalik"]],
  ["maternity", ["dogum", "analik"]],
  ["unpaid", ["ucretsiz"]],
  ["annual", ["yillik", "yilik", "yillk", "senelik", "tatil"]],
]
// "hastane" hastalık izni sayılmasın (randevu çoğunlukla mazeret); "olumlu" ölüm değil.
const NOT = { sick: /^hastane/, bereavement: /^olums|^oluml/ }
const RELATIVE = [
  "anne",
  "baba",
  "kardes",
  "abla",
  "abi",
  "agabey",
  "amca",
  "teyze",
  "dayi",
  "dede",
  "nine",
  "cocug",
  "cocuk",
  "oglu",
  "kizi",
  "yegen",
  "kuzen",
  "kayin",
  "arkadas",
  "esim",
  "esin",
]
const FOR_SELF = new Set(["sick", "marriage"])
// "öldü": katlanınca "oldu" ("oldu" = oluştu) olur; ham yazıda aranır.
const DIED = /(?:^|[\s,.;:!?])öl(?:dü|müş|mus)/iu

const matches = (kind, roots, w) => roots.some((r) => stem(w, r)) && !NOT[kind]?.test(w)

/** Bu kelimenin türü (doğumda "doğum günü" değil, eşinki babalık) ya da null. */
function kindAt(list, at) {
  for (const [kind, roots] of KINDS) {
    if (!matches(kind, roots, list[at])) continue
    if (kind === "maternity") {
      if (stem(list[at + 1] ?? "", "gun")) continue
      if (findStem(list, ["esim", "hanim"], 3)) return "paternity"
    }
    return kind
  }
  return null
}

/** Yazıdaki izin türü anahtarı ya da null (`raw`: katlanmamış yazı). */
export function leaveKindOf(folded, raw = "") {
  const list = words(folded)
  for (let i = 0; i + 1 < list.length; i++) {
    const kind = /^(izin|izn)/.test(list[i + 1]) && kindAt(list, i)
    if (kind) return kind
  }
  const relative = (at) =>
    [list[at - 1], list[at - 2]].some((w) => w && RELATIVE.some((r) => w.startsWith(r)))
  for (const [kind, roots] of KINDS) {
    for (let at = 0; at < list.length; at++) {
      if (!matches(kind, roots, list[at]) || (FOR_SELF.has(kind) && relative(at))) continue
      const got = kindAt(list, at)
      if (got) return got
    }
  }
  return DIED.test(raw) ? "bereavement" : null
}

/** "izin" kelimesi geçiyor mu ("izni", "iznim" — Türkçede ünlü düşer). */
export const saysLeave = (folded) => Boolean(findStem(words(folded), ["izin", "izn"], 5))

/** `{ values, parts, warnings }` — `values` forma yazılacaklar (`kind`, `start`, `end`). */
export function narrateLeave(folded, today, raw = "") {
  const values = {}
  const parts = []
  const warnings = []
  const kind = leaveKindOf(folded, raw)
  if (kind) {
    values.kind = kind
    parts.push({ key: "kind", value: kind })
  }
  const d = readDates(folded, today)
  // Yalnız süre ("3 gün izin"): ilk iş gününden sayılır, çipte görünür ve uyarılır.
  if (!d.start && (d.days || d.months)) {
    d.start = nextWorkday(addDays(startOfDay(today), 1))
    d.end = spanEnd(d.start, d.days, d.months)
    warnings.push("assumedStart")
  }
  if (d.start) {
    values.start = d.start
    values.end = d.end
    parts.push({ key: "dates", start: d.start, end: d.end })
    if (d.apart) warnings.push("apart")
    if (d.past) warnings.push("past")
  }
  if (/\byarim\b|\bsaatlik\b|\bsaat ?\d|\b\d+ saat\b|\bogleden (?:sonra|once)\b/.test(folded))
    warnings.push("partialDay")
  return { values, parts, warnings }
}
