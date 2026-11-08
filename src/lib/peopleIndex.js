import { fold } from "@/lib/fold"

/**
 * Bul › Kişiler — şirket rehberinde arama (saf). Graph'ın `$search`i yalnız adda kelime arıyor,
 * unvan, departman ve telefonda yalnız "ile başlar"; rehber bellekte olduğu için her alanda,
 * Türkçe harf duyarsız ve anında aranır.
 *
 * Her kelime en az bir alanda eşleşmeli (VE). Puan: adın başı > ad kelimesinin başı > posta
 * adresi > unvan · departman · ofis > şirket · şehir > kelimenin içi. Yalnız rakamlı sorgu
 * telefon araması: ülke kodu ve baştaki 0 düşer, "0532 123" ile "+90 532 123 45 67" buluşur.
 */

const SPLIT = /[\s,.;:/\\|()[\]{}"'’`+_–—-]+/
const MIN_DIGITS = 3
// Kelimenin İÇİNDE eşleşme yalnız bu uzunluktan itibaren ("ka" her ikinci adı getirirdi).
const MIN_INFIX = 3

const FIELDS = [
  ["title", 40],
  ["department", 40],
  ["office", 38],
  ["company", 25],
  ["city", 25],
]

const words = (s) => s.split(SPLIT).filter(Boolean)

/** Türkçe katlama + öbür aksanlar (José, Mărăcineni): yabancı adlar da düz harfle bulunur. */
export function foldAll(value) {
  return fold(value)
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
}

/**
 * Telefonun karşılaştırma anahtarı: yalnız rakam; uluslararası önek (+ ya da 00), Türkiye'nin
 * 90'ı ve baştaki 0 düşer — "+90 532", "0532" ve "532" aynı anahtar.
 */
export function phoneKey(value) {
  const s = String(value ?? "").trim()
  let d = s.replace(/\D/g, "")
  const intl = s.startsWith("+") || d.startsWith("00")
  if (d.startsWith("00")) d = d.slice(2)
  if (d.startsWith("90") && (intl || d.length >= 12)) d = d.slice(2)
  if (d.startsWith("0")) d = d.slice(1)
  return d
}

/** Rehber kaydı → arama girdisi (alanlar bir kez katlanır). */
function entryOf(person) {
  const name = foldAll(person.name)
  const mail = foldAll(String(person.address ?? "").split("@")[0])
  const upn = foldAll(String(person.upn ?? "").split("@")[0])
  const fields = {}
  for (const [key] of FIELDS) {
    const v = foldAll(person[key] ?? "")
    if (v) fields[key] = { text: v, words: words(v) }
  }
  const phones = [...(person.phones ?? []), person.mobile]
    .filter(Boolean)
    .map((raw) => ({ raw, key: phoneKey(raw) }))
    .filter((p) => p.key.length >= MIN_DIGITS)
  return {
    person,
    name,
    nameWords: words(name),
    mails: [...new Set([mail, upn].filter(Boolean))],
    fields,
    phones,
  }
}

export function indexPeople(people) {
  return (people ?? []).filter((p) => p?.name).map(entryOf)
}

/** Bir kelimenin bu kayıttaki en iyi eşleşmesi: `{ score, field }` ya da `null`. */
function tokenHit(e, token) {
  if (e.name.startsWith(token)) return { score: 100, field: "name" }
  let best = null
  const take = (score, field) => {
    if (!best || score > best.score) best = { score, field }
  }
  for (const w of e.nameWords) {
    if (w === token) take(90, "name")
    else if (w.startsWith(token)) take(80, "name")
  }
  if (best) return best
  if (e.mails.some((m) => m.startsWith(token))) take(60, "mail")
  for (const [key, weight] of FIELDS) {
    const f = e.fields[key]
    if (!f) continue
    if (f.words.some((w) => w === token)) take(weight + 5, key)
    else if (f.words.some((w) => w.startsWith(token))) take(weight, key)
  }
  if (best || token.length < MIN_INFIX) return best
  if (e.name.includes(token)) return { score: 20, field: "name" }
  if (e.mails.some((m) => m.includes(token))) return { score: 15, field: "mail" }
  for (const [key] of FIELDS) {
    if (e.fields[key]?.text.includes(token)) return { score: 10, field: key }
  }
  return null
}

function phoneHit(e, digits) {
  let best = null
  for (const p of e.phones) {
    const score =
      p.key === digits ? 100 : p.key.endsWith(digits) ? 80 : p.key.includes(digits) ? 60 : 0
    if (score && (!best || score > best.score)) best = { score, field: "phone", phone: p.raw }
  }
  return best
}

/** Rakamdan başka anlamlı harf yoksa telefon araması. */
export function phoneQuery(query) {
  const q = String(query ?? "").trim()
  if (!q || /[\p{L}]/u.test(q)) return null
  const d = phoneKey(q)
  return d.length >= MIN_DIGITS ? d : null
}

const collator = new Intl.Collator("tr", { sensitivity: "base" })

/**
 * Sorguya uyan kişiler, en iyisi başta. Her sonuç `{ person, score, field, phone? }`; `field`
 * eşleşmenin göründüğü alan — satır, ad dışında bir alan eşleştiyse onu gösterir.
 */
export function searchPeople(index, query) {
  const digits = phoneQuery(query)
  const tokens = digits ? [] : words(foldAll(query))
  if (!digits && !tokens.length) return []
  const out = []
  for (const e of index) {
    if (digits) {
      const hit = phoneHit(e, digits)
      if (hit) out.push({ person: e.person, ...hit })
      continue
    }
    let score = 0
    let field = "name"
    let ok = true
    for (const token of tokens) {
      const hit = tokenHit(e, token)
      if (!hit) {
        ok = false
        break
      }
      score += hit.score
      // Satırda gösterilecek alan: addan başka bir alan eşleştiyse o (kişinin neden geldiği).
      if (hit.field !== "name" && field === "name") field = hit.field
    }
    if (!ok) continue
    // Tam ad sorgunun kendisiyle başlıyorsa en üste ("ahmet yıl" → Ahmet Yılmaz).
    if (tokens.length > 1 && e.name.startsWith(tokens.join(" "))) score += 50
    out.push({ person: e.person, score, field })
  }
  return out.sort((a, b) => b.score - a.score || collator.compare(a.person.name, b.person.name))
}

/**
 * Bir alanın değerleri ve kişi sayıları (departmanlar, ofisler), kalabalıktan aza. Yazımları
 * farklı aynı değer ("Bilgi Teknolojileri" / "BİLGİ TEKNOLOJİLERİ") tek satır; en sık yazım görünür.
 */
export function facetOf(people, key) {
  const groups = new Map()
  for (const p of people ?? []) {
    const raw = String(p?.[key] ?? "").trim()
    if (!raw) continue
    const id = foldAll(raw)
    const g = groups.get(id) ?? { id, count: 0, spellings: new Map() }
    g.count += 1
    g.spellings.set(raw, (g.spellings.get(raw) ?? 0) + 1)
    groups.set(id, g)
  }
  return [...groups.values()]
    .map((g) => ({
      id: g.id,
      count: g.count,
      name: [...g.spellings.entries()].sort((a, b) => b[1] - a[1])[0][0],
    }))
    .sort((a, b) => b.count - a.count || collator.compare(a.name, b.name))
}

/** Alanı verilen değerde olanlar (katlanmış karşılaştırma), ada göre. */
export function peopleWith(people, key, id) {
  return (people ?? [])
    .filter((p) => foldAll(p?.[key] ?? "") === id)
    .sort((a, b) => collator.compare(a.name, b.name))
}
