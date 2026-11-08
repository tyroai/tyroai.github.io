import { newExpenseRow } from "@/lib/requestForm"
import { formatAmount } from "@/lib/amountParse"
import { startOfDay } from "@/lib/leaveDays"
import { pickAmount, readAmounts } from "./amount"
import { brandOf } from "./brands"
import { monthOf } from "./calendar"
import { readDates } from "./dates"
import { expensePieces, isGreeting } from "./expenseSplit"
import { expenseCategoryOf, saysExpense } from "./expenseWords"
import { numberWords } from "./numbers"
import { placeOf } from "./places"
import { fold, mask, words } from "./text"

/**
 * Anlat › masraf (saf): cümle kalemlere bölünür (`expenseSplit`); her kalem
 * tutar + para birimi (birimi yazılan, yoksa en büyük sayı), tarih (geçmişe bakar: "pazartesi"
 * geçen pazartesi; yazılan tarih sonraki kalemlere de geçer, sondaki "dün" hepsine), kategori
 * (anahtar kelimeden, yoksa markadan; TL dışı birimde ya da yurt dışında yurtdışı karşılığı),
 * firma (bilinen marka), fiş no, kişi sayısı ("4 kişi") ve açıklama (kalemin yazısından tutar ve
 * tarih atılmış hâli). Tutarsız kalem bir sonrakine katılır (sondaki öncekine: "…, fiş no: A-12").
 * İki anlamlı tutarlı kalem ("otel 1,500") tutarı boş kalır ve uyarılır. En çok 20 kalem. Baştaki
 * başlık ("Hamburg fuarı: …") masrafın açıklaması olur; kategori, marka ya da tarih taşıyan
 * ("Taksi: 450", "dün: …") ve selam başlık değildir.
 */
const MAX = 20
// Fiş/fatura numarası (içinde rakam olan): tutar ya da tarih sanılmasın diye önce okunur.
const RECEIPT =
  /(?:fiş|fis|fatura|belge)\s*(?:no|numarası|numarasi|nu|#)\.?\s*:?\s*(?=[\p{L}\-/]*\p{N})([\p{L}\p{N}][\p{L}\p{N}\-/]{2,29})/iu
// Açıklamadan atılanlar (ham yazıda): fiş no, kişi, tutar, birim, tarih ve dolgu kelimeleri.
const MONTHS_RAW =
  "ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik"
// Sayı + "kişi/gece/adet…" tutardan önce atılır: "4 kişi"nin "k"si binlik sanılmasın.
const DROP = [
  new RegExp(RECEIPT.source, "giu"),
  /\d{1,4}\s*(?:kişi|kisi|gece|gün|gun|adet|tane|litre|lt|km|kg|kilo|paket|kutu|sayfa)\S*/giu,
  /[€$£₺]\s*\d[\d.,]*(?:['’]\p{L}+)?/giu,
  /\d[\d.,]*(?:['’]\p{L}+)?\s*(?:(?:bin|milyon|milyar|k)(?!\p{L}))?\s*(?:(?:tl|try|ytl|usd|eur|gbp|lira|dolar|euro|avro|sterlin)\p{L}*(?:['’]\p{L}*)?|[€$£₺])?/giu,
  new RegExp(`(?:^|\\s)(?:${MONTHS_RAW})\\S*`, "giu"),
  /(?:^|\s)(?:bugün|bugun|dün|dun|yarın|evvelsi gün|önceki gün|geçen hafta\S*|geçen|pazartesi|salı|çarşamba|perşembe|cumartesi|cuma|pazar)\S*/giu,
  /(?:^|\s)(?:kişi\S*|gece\S*|masraf\S*|harcama\S*|ödedim|harcadım|için|tutarında|toplam|fişi?|şöyle|söyle|aşağıdaki|şunlar)(?=[\s,.:;!?]|$)/giu,
]
// Başlıkta yalnız bunlar varsa başlık sayılmaz ("masraf:", "Ekim masraflarım:" — varsayılanı var).
const FILLER =
  /^(?:masraf\w*|harcama\w*|fis\w*|fatura\w*|giris\w*|ekle\w*|yeni|bu|ay|ayi|ayin|benim)$/

// Tutar olmayan miktarlar ("3 gece", "50 litre", "100 adet"): tutar okunmadan önce kapatılır.
const QUANTITY = /\b\d{1,4} ?(?:kisi|gece|gun|adet|tane|litre|lt|km|kg|kilo|paket|kutu|sayfa)\w*/g

const capFirst = (s) => s.charAt(0).toLocaleUpperCase("tr") + s.slice(1)

/** Kalemin açıklaması: tutar, tarih ve dolgu atılmış ham yazı (baş harf büyük, ≤ 60 harf). */
function noteOf(raw) {
  let s = raw
  for (const re of DROP) s = s.replace(re, " ")
  s = s
    .replace(/[(),.:;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (s.length < 2) return null
  return capFirst(s).slice(0, 60)
}

/** Başlık olabilecek yazı: sayısız, selamsız, dolgudan ve ay adından başka bir kelimesi olan. */
function titleOf(raw) {
  const s = raw.replace(/\s+/g, " ").trim()
  if (/\d/.test(s) || isGreeting(s)) return null
  const real = words(fold(s)).filter((w) => !FILLER.test(w) && monthOf(w) < 0)
  return real.length ? capFirst(s).slice(0, 60) : null
}

/** Tek kalemin okunanları: `{ values, date }` (tarih ayrı: sonraki kalemlere geçebilsin). */
function readLine(raw, today, locale, away = false) {
  let folded = numberWords(fold(raw))
  const values = {}
  const receipt = raw.match(RECEIPT)
  if (receipt) values.receipt = receipt[1]
  folded = folded.replace(new RegExp(RECEIPT.source, "iu"), (m) => " ".repeat(m.length))
  // "fiş 4521": başka bir tutar da varsa fişin numarası ("taksi 300 fiş 4521").
  const bare = !receipt && folded.match(/\b(?:fis|fatura)\w*\s+(\d{3,20})\b/)
  if (bare) {
    const masked = mask(folded, bare.index, bare.index + bare[0].length)
    if (pickAmount(readAmounts(masked, locale))?.value) {
      values.receipt = bare[1]
      folded = masked
    }
  }
  const dates = readDates(folded, today, { past: true })
  let rest = folded
  for (const [a, b] of dates.spans) rest = mask(rest, a, b)
  const people = rest.match(/\b(\d{1,3}) ?kisi/)
  if (people) values.people = people[1]
  rest = rest.replace(QUANTITY, (m) => " ".repeat(m.length))
  const amount = pickAmount(readAmounts(rest, locale))
  if (amount?.value) {
    values.amount = formatAmount(amount.value, locale)
    if (amount.currency) values.currency = amount.currency
  }
  const abroad = Boolean(
    (amount?.currency && amount.currency !== "TRY") || placeOf(words(rest))?.abroad || away,
  )
  const brand = brandOf(rest)
  if (brand) values.firm = brand.firm
  const category = expenseCategoryOf(rest, abroad) ?? brand?.category(abroad)
  if (category) values.category = category
  const note = noteOf(raw)
  // Marka adı açıklamada da kalır: firma sütunu çoğunlukla gizli.
  if (note) values.note = note
  return {
    raw,
    values,
    date: dates.start,
    hasAmount: Boolean(values.amount),
    // Tutar iki türlü okunuyor ("1,500"): kategorisi varsa kalem tutarsız açılır.
    unsure: Boolean(amount?.ambiguous && category),
    amount: amount?.value,
  }
}

/**
 * Başlık ve kalemlerin yazısı: iki noktadan önceki yazı ("Hamburg fuarı: otel 450 euro…") ya da
 * tutarsız, tarihsiz ilk parça — ardından kendi kategorisi olan tutarlı bir kalem geliyorsa
 * ("İzmir fuarı, otel 3200, taksi 400").
 */
function splitHead(text, today, locale) {
  const colon = text.match(/^([^:\d\n]{2,60}):\s*([\s\S]+)$/u)
  const head = colon && numberWords(fold(colon[1]))
  // "fatura no: …" fiş numarası; "Taksi: 450", "dün: …" kalemin kendisi.
  if (
    colon &&
    !/(?:\bno|numaras[ıi]|#)\.?\s*$/iu.test(colon[1]) &&
    !saysExpense(head) &&
    !readDates(head, today, { past: true }).start
  )
    return { title: titleOf(colon[1]), pieces: expensePieces(colon[2]) }
  const pieces = expensePieces(text)
  if (pieces.length < 2) return { title: null, pieces }
  const first = readLine(pieces[0], today, locale)
  const next = readLine(pieces[1], today, locale)
  const title = !first.hasAmount && !first.date && next.hasAmount && next.values.category
  const name = title ? titleOf(pieces[0]) : null
  return name ? { title: name, pieces: pieces.slice(1) } : { title: null, pieces }
}

/**
 * `{ rows, parts, warnings, head }` — `rows` kalemlerin değerleri (yeni kalemin varsayılanlarıyla),
 * `head` masrafın başlığı (`{ title }`) ya da null.
 */
export function narrateExpense(text, today, locale = "tr") {
  const { title, pieces } = splitHead(text, today, locale)
  // Başlıktaki yurt dışı yer bütün kalemlerin kategorisini yurtdışı yapar ("Hamburg fuarı: …").
  const away = Boolean(title && placeOf(words(fold(title)))?.abroad)
  const lines = []
  let carry = ""
  let lastDate = null
  let tailDate = null
  for (const piece of pieces) {
    const line = readLine(carry ? `${carry} ${piece}` : piece, today, locale, away)
    if (!line.hasAmount && !line.unsure) {
      // Tutarsız parça: yalnız tarihse sonraki (ya da sondaysa bütün) kalemlerin tarihi.
      if (line.date && !line.values.category) tailDate = line.date
      else carry = carry ? `${carry} ${piece}` : piece
      continue
    }
    carry = ""
    if (line.date) lastDate = line.date
    lines.push({ ...line, date: line.date ?? lastDate })
  }
  // Sondaki tutarsız parça son kaleme katılır ("taksi 300, fiş no: A-1234").
  if (carry && lines.length) {
    const last = lines.at(-1)
    const again = readLine(`${last.raw} ${carry}`, today, locale, away)
    if (again.hasAmount) lines[lines.length - 1] = { ...again, date: again.date ?? last.date }
  }
  const fallback = tailDate ?? lines.find((l) => l.date)?.date ?? null
  const rows = lines.slice(0, MAX).map((l) => ({
    ...newExpenseRow("anlat").values,
    ...l.values,
    date: l.date ?? fallback ?? startOfDay(today),
  }))
  const parts = [
    ...(title ? [{ key: "title", value: title }] : []),
    ...rows.map((values, index) => ({ key: "line", index, values, amount: lines[index].amount })),
  ]
  return {
    rows,
    parts,
    head: title ? { title } : null,
    warnings: [
      ...(lines.some((l) => l.unsure) ? ["ambiguousAmount"] : []),
      ...(lines.length > MAX ? ["tooMany"] : []),
    ],
  }
}
