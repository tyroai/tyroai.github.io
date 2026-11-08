import { CURRENCIES, EXPENSE_CATEGORY_PAIRS } from "@/data/hrValues"
import { formatAmount, parseAmount } from "@/lib/amountParse"
import { suggestCategories } from "@/features/selfservice/lib/expenseHints"

/**
 * EXCEL'DEN YAPIŞTIRMA — masraf kalemleri (saf). Panodaki metin (Excel ya da Google Sheets'in
 * sekmeli metni; sekme yoksa `;`, belirsiz değilse `,` ayraçlı CSV) satır satır kalem değerine
 * çevrilir. İlk satır TR/EN başlıksa sütunlar adından, değilse ızgaranın görünür sütun sırasıyla
 * eşlenir (tutarın ardındaki para birimi sütunu isteğe bağlı). Tahmin yok: okunamayan hücre boş
 * kalır (formun eksik alan göstergesi onu gösterir), kategori yalnız listeyle eşleşirse ya da tek
 * öneri varsa, iki okunuşlu tutar sütundaki öteki tutarlar ayracı belli etmezse boş. Hiçbir
 * değeri okunamayan satır ve "Toplam" satırı atlanır.
 */

const LIMITS = { note: 160, receipt: 40, firm: 120 }

/** Karşılaştırma anahtarı: küçük harf, Türkçe harfler sade ("Açıklama" → "aciklama"), noktalama boşluk. */
export function foldKey(text) {
  return String(text ?? "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

const HEADERS = {
  date: ["tarih", "date", "masraf tarihi", "fis tarihi", "fatura tarihi", "belge tarihi"],
  category: ["kategori", "category", "masraf turu", "masraf tipi", "masraf kategorisi"],
  note: ["aciklama", "description", "not", "note", "notes", "detay", "details", "memo"],
  amount: ["tutar", "amount", "toplam", "total", "toplam tutar", "masraf tutari", "bedel"],
  currency: ["para birimi", "currency", "doviz", "doviz cinsi", "ccy"],
  receipt: ["fis no", "fis numarasi", "fis", "receipt no", "receipt number", "belge no"],
  firm: ["firma", "firma adi", "vendor", "merchant", "supplier", "tedarikci", "satici"],
  location: ["lokasyon", "location", "yurtici yurtdisi"],
  people: ["kisi sayisi", "kisi", "people", "persons", "guests", "number of people"],
}
const HEADER_OF = new Map(
  Object.entries(HEADERS).flatMap(([field, names]) => names.map((n) => [n, field])),
)

const CURRENCY_WORDS = {
  TRY: ["₺", "tl", "try", "ytl", "lira", "turk lirasi"],
  USD: ["$", "usd", "us$", "dolar", "dollar"],
  EUR: ["€", "eur", "euro", "avro"],
  GBP: ["£", "gbp", "sterlin", "sterling", "pound"],
}
const CURRENCY_OF = new Map(
  Object.entries(CURRENCY_WORDS).flatMap(([code, words]) => words.map((w) => [w, code])),
)

/** Hücredeki para birimi kodu (şablonun listesinden) ya da null. */
export function currencyOf(text) {
  const raw = String(text ?? "").trim()
  if (!raw) return null
  const low = raw.toLocaleLowerCase("tr")
  const code = CURRENCY_OF.get(low) ?? CURRENCY_OF.get(foldKey(raw)) ?? raw.toUpperCase()
  return CURRENCIES.includes(code) ? code : null
}

const LOCATION_OF = new Map([
  ...["yurtici", "yurt ici", "domestic", "local"].map((w) => [w, "domestic"]),
  ...["yurtdisi", "yurt disi", "abroad", "international", "foreign"].map((w) => [w, "abroad"]),
])

// Kelime sırası önemsiz: "Yurtiçi ulaşım" da "Ulaşım (Yurtiçi)" da aynı kategori.
const sortedKey = (key) => key.split(" ").sort().join(" ")
const CATEGORY_OF = new Map()
for (const [title, value] of EXPENSE_CATEGORY_PAIRS)
  for (const k of [title, value].map((s) => sortedKey(foldKey(s))))
    if (!CATEGORY_OF.has(k)) CATEGORY_OF.set(k, title)

/**
 * Kategori başlığı: listedeki başlık ya da ERP değeriyle (büyük-küçük harf, noktalama ve kelime
 * sırası önemsiz); değilse yalnız TEK öneri varsa o (`suggestCategories`). Yoksa null.
 */
export function categoryOf(text, currency = "TRY") {
  const key = foldKey(text)
  if (!key) return null
  const exact = CATEGORY_OF.get(sortedKey(key))
  if (exact) return exact
  const hints = suggestCategories({ note: String(text), currency })
  return hints.length === 1 ? hints[0] : null
}

const TR_MONTHS = "ocak subat mart nisan mayis haziran temmuz agustos eylul ekim kasim aralik"
const EN_MONTHS =
  "january february march april may june july august september october november december"
const MONTH_OF = new Map(
  [TR_MONTHS, EN_MONTHS].flatMap((list) =>
    list.split(" ").flatMap((name, i) => [
      [name, i + 1],
      [name.slice(0, 3), i + 1],
    ]),
  ),
)
MONTH_OF.set("sept", 9)
// Excel'in seri günü (1900 tarih sistemi): 32874 = 1 Ocak 1990, 73050 = 31 Aralık 2099.
const EXCEL_EPOCH = Date.UTC(1899, 11, 30)
const SERIAL_MIN = 32874
const SERIAL_MAX = 73050

// Formun tarihleri gibi yerel gece yarısı; olmayan gün (31.02) null.
function makeDate(y, m, d) {
  const year = y < 100 ? 2000 + y : y
  if (year < 1990 || year > 2099) return null
  const out = new Date(year, m - 1, d)
  return out.getFullYear() === year && out.getMonth() === m - 1 && out.getDate() === d ? out : null
}

function namedDate(text) {
  const t = foldKey(text).split(" ")
  const at = t.findIndex((w) => MONTH_OF.has(w))
  if (at < 0) return null
  const m = MONTH_OF.get(t[at])
  const day = (w) => /^\d{1,2}$/.test(w ?? "")
  const year = (w) => /^(\d{2}|\d{4})$/.test(w ?? "")
  if (day(t[at - 1]) && year(t[at + 1])) return makeDate(+t[at + 1], m, +t[at - 1])
  if (day(t[at + 1]) && year(t[at + 2])) return makeDate(+t[at + 2], m, +t[at + 1])
  return null
}

const TIME = String.raw`(?:[ T]\d{1,2}[:.]\d{2}(?:[:.]\d{2})?\S*)?`
const ISO = new RegExp(String.raw`^(\d{4})[-./](\d{1,2})[-./](\d{1,2})${TIME}$`)
const DMY = new RegExp(String.raw`^(\d{1,2})[-./](\d{1,2})[-./](\d{4}|\d{2})${TIME}$`)

/**
 * Hücredeki tarih: 15.10.2026 · 15/10/2026 · ISO (yıl-ay-gün) · 5.1.26 · "15 Eki 2026" · Excel seri
 * günü (46310). `order` "mdy" ise 10/15/2026 gibi ay önde. Okunamazsa null.
 */
export function readDate(text, order = "dmy") {
  const s = String(text ?? "").trim()
  let m = ISO.exec(s)
  if (m) return makeDate(+m[1], +m[2], +m[3])
  m = DMY.exec(s)
  if (m) return order === "mdy" ? makeDate(+m[3], +m[1], +m[2]) : makeDate(+m[3], +m[2], +m[1])
  if (/^\d{5}(?:[.,]\d+)?$/.test(s)) {
    const n = Math.floor(Number(s.replace(",", ".")))
    if (n < SERIAL_MIN || n > SERIAL_MAX) return null
    const u = new Date(EXCEL_EPOCH + n * 864e5)
    return makeDate(u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate())
  }
  return namedDate(s)
}

// Sütundaki tarihler ay önde mi (10/15/2026): yalnız öyle okunabilen tarih varsa ve tersi yoksa.
function dateOrder(cells) {
  let dmy = 0
  let mdy = 0
  for (const c of cells) {
    const m = /^(\d{1,2})[-./](\d{1,2})[-./]/.exec(c)
    if (m && +m[1] > 12 && +m[2] <= 12) dmy++
    else if (m && +m[2] > 12 && +m[1] <= 12) mdy++
  }
  return mdy && !dmy ? "mdy" : "dmy"
}

// "1 250,00" (boşluk binlik ayracı; `\s` bölünmez boşluğu da kapsar) tek sayı olsun.
const GROUP_SPACE = /(\d)\s(?=\d{3}(?!\d))/g

// Sütunun ondalık ayracı, ayracı belli eden tutarlardan ("1.250,00", "12,5"); belli değilse null.
function decimalHint(cells) {
  const votes = { ",": 0, ".": 0 }
  for (const c of cells) {
    const n = c.replace(GROUP_SPACE, "$1").match(/\d[\d.,]*\d/)?.[0] ?? ""
    const seps = n.match(/[.,]/g) ?? []
    if (new Set(seps).size === 2) votes[seps[seps.length - 1]]++
    else if (seps.length === 1 && n.length - n.indexOf(seps[0]) - 1 !== 3) votes[seps[0]]++
  }
  if (votes[","] === votes["."]) return null
  return votes[","] > votes["."] ? "," : "."
}

/** Hücredeki tutar `{ value, currency }`: ayraç sütundan belliyse o, değilse dilin ayracı. */
function amountOf(text, locale, hint) {
  const got = parseAmount(
    text.replace(GROUP_SPACE, "$1"),
    hint ? (hint === "," ? "tr" : "en") : locale,
  )
  if (!got) return null
  // İki okunuşlu tutar ("1,500"): sütunun ayracı belliyse ondalık okunuşu, değilse boş kalır.
  const value = got.value ?? (hint ? got.ambiguous[0] : null)
  return value ? { value, currency: got.currency } : null
}

const TOTALS = new Set(["toplam", "genel toplam", "ara toplam", "total", "grand total", "subtotal"])

/** Pano metninin ayracı: sekme; yoksa `;`; virgül yalnız sayının içinde değilse ve her satırda eşitse. */
function separatorOf(text) {
  const bare = text.replace(/"(?:[^"]|"")*"/g, '""')
  if (bare.includes("\t")) return "\t"
  const lines = bare.split("\n").filter((l) => l.trim())
  if (lines.some((l) => l.includes(";"))) return ";"
  const counts = lines.map((l) => (l.match(/,/g) ?? []).length)
  if (counts[0] > 0 && counts.every((n) => n === counts[0]) && !/\d,\d/.test(bare)) return ","
  return null
}

// Tırnaklı hücre (Excel: içinde satır sonu, sekme ya da tırnak varsa) tek hücre; "" → ".
function splitCells(text, sep) {
  const rows = [[""]]
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const row = rows[rows.length - 1]
    const at = row.length - 1
    if (quoted && c === '"' && text[i + 1] === '"') row[at] += text[++i]
    else if (c === '"' && (quoted || !row[at].trim())) {
      quoted = !quoted
      if (quoted) row[at] = ""
    } else if (quoted || (c !== sep && c !== "\n")) row[at] += c
    else if (c === sep) row.push("")
    else rows.push([""])
  }
  return rows.map((r) => r.map(cleanCell))
}

const cleanCell = (v) =>
  v
    .replace(/\s*\n\s*/g, " ")
    .trim()
    .replace(/^"(.*)"$|^“(.*)”$/s, (all, a, b) => (a ?? b).trim())

function readGrid(text) {
  const s = String(text ?? "").replace(/\r\n?/g, "\n")
  const sep = separatorOf(s)
  const rows = splitCells(s, sep)
    .map((cells, i) => ({ line: i + 1, cells }))
    .filter((r) => r.cells.some(Boolean))
  return { rows, sep }
}

/** Yapıştırılan metin tablo mu: en az iki dolu satır ya da sekmeyle ayrılmış en az iki dolu hücre. */
export function isTabularText(text) {
  if (!String(text ?? "").trim()) return false
  const { rows, sep } = readGrid(text)
  return rows.length >= 2 || (sep === "\t" && rows[0]?.cells.filter(Boolean).length >= 2)
}

// Başlık hücresi: "Tutar (EUR)" gibi para birimli başlık o sütunun para birimini de verir.
function headerOf(cell) {
  let currency = null
  const words = cell.split(/[\s()[\]/]+/).filter((w) => {
    const code = w && currencyOf(w)
    if (code) currency = code
    return w && !code
  })
  const field = HEADER_OF.get(foldKey(words.join(" ")))
  return field ? { field, currency } : null
}

// İlk satır başlık mı: rakam yok, dolu hücrelerin en az yarısı tanınan sütun adı.
function headerFields(cells) {
  const filled = cells.filter(Boolean)
  if (!filled.length || filled.some((c) => /\d/.test(c))) return null
  const seen = new Set()
  const fields = cells.map((c) => {
    const h = c ? headerOf(c) : null
    if (!h || seen.has(h.field)) return null
    seen.add(h.field)
    return h
  })
  const known = fields.filter(Boolean).length
  return known && known * 2 >= filled.length ? fields : null
}

// Hücrenin sütuna uyumu (sıra seçimi için): doğru tür +1, yanlış tür -1, serbest metin 0.
function fit(field, cell, col, locale) {
  if (!cell || !field) return 0
  const yes = (ok) => (ok ? 1 : -1)
  if (field === "date") return yes(readDate(cell, col.order))
  if (field === "amount") return yes(amountOf(cell, locale, col.hint))
  if (field === "currency") return yes(currencyOf(cell))
  if (field === "location") return yes(LOCATION_OF.has(foldKey(cell)))
  if (field === "people") return yes(/^\d{1,3}$/.test(cell))
  if (field === "category") return categoryOf(cell) ? 1 : 0
  return 0
}

// Görünür sütunlar sırayla; para birimi tutarın ardında, yalnız o sütun para birimiyse.
function positional(cols, seq, at) {
  const out = []
  let k = at
  for (const cells of cols) {
    if (seq[k] === "currency" && !cells.every((c) => !c || currencyOf(c))) k++
    out.push(seq[k] ? { field: seq[k], currency: null } : null)
    k++
  }
  return out
}

/**
 * Başlıksız metinde sütunlar: odaklı hücreden ya da ilk sütundan başlayarak — değerlere hangisi
 * daha iyi uyuyorsa (eşitse odaklı hücre). Kişi kategori hücresindeyken tam satır yapıştırırsa
 * tarih tarih sütununa düşer; açıklama hücresinde tek sütun yapıştırırsa açıklamaya.
 */
function guessFields(cols, ctx, visible, start, locale) {
  const seq = visible.flatMap((id) => (id === "amount" ? ["amount", "currency"] : [id]))
  const at = start ? seq.indexOf(start) : -1
  let best = null
  for (const k of at > 0 ? [at, 0] : [0]) {
    const fields = positional(cols, seq, k)
    const score = fields.reduce(
      (sum, f, i) => sum + cols[i].reduce((s, c) => s + fit(f?.field, c, ctx[i], locale), 0),
      0,
    )
    if (!best || score > best.score) best = { fields, score }
  }
  return best.fields
}

function readRow(cells, fields, ctx, locale) {
  const v = {}
  const cell = (name) => {
    const i = fields.findIndex((f) => f?.field === name)
    return i < 0 ? { i, text: "" } : { i, text: cells[i] ?? "" }
  }
  const date = cell("date")
  if (date.text) v.date = readDate(date.text, ctx[date.i].order)
  const amount = cell("amount")
  const cur = cell("currency")
  const colCur = cur.text ? currencyOf(cur.text) : null
  const fixed = colCur ?? fields[amount.i]?.currency ?? fields[cur.i]?.currency ?? null
  const got = amount.text ? amountOf(amount.text, locale, ctx[amount.i].hint) : null
  // Tanınmayan ya da çelişen para birimi: tutar boş kalır (yanlış birimle gitmesin).
  const clash = (cur.text && !colCur) || (got?.currency && colCur && got.currency !== colCur)
  if (got && !clash) {
    v.amount = formatAmount(got.value, locale)
    v.currency = got.currency ?? fixed ?? "TRY"
  } else if (fixed && !clash) v.currency = fixed
  const category = cell("category").text
  if (category) {
    const title = categoryOf(category, v.currency ?? "TRY")
    if (title) v.category = title
  }
  for (const name of ["note", "receipt", "firm"]) {
    const text = cell(name).text
    if (text) v[name] = text.slice(0, LIMITS[name])
  }
  const place = LOCATION_OF.get(foldKey(cell("location").text))
  if (place) v.location = place
  const people = cell("people").text
  if (/^\d{1,3}$/.test(people) && Number(people) > 0) v.people = String(Number(people))
  return v
}

const READABLE = ["amount", "category", "note", "receipt", "firm"]

/**
 * Yapıştırılan metin → `{ rows: [kalem değerleri], skipped: [{ line, reason }], header }`.
 * `columns`: ızgaranın görünür sütunları (başlıksız metinde sıra), `start`: odaklı sütun, `locale`:
 * tutarın biçimi. Değerler formun saklama biçiminde: tarih yerel gece yarısı, tutar yerel yazı
 * ("1.250,5"), kategori listedeki başlık; isteğe bağlı alanlar yalnız doluysa. `reason`:
 * "unreadable" (hiçbir değer okunamadı) ya da "total" (toplam satırı).
 */
export function parseExpensePaste(text, { columns = [], start = null, locale = "tr" } = {}) {
  const { rows } = readGrid(text)
  const head = rows.length ? headerFields(rows[0].cells) : null
  const data = head ? rows.slice(1) : rows
  const width = Math.max(0, ...data.map((r) => r.cells.length))
  const cols = Array.from({ length: width }, (_, i) => data.map((r) => r.cells[i] ?? ""))
  const ctx = cols.map((cells) => ({ order: dateOrder(cells), hint: decimalHint(cells) }))
  const fields = head ?? guessFields(cols, ctx, columns, start, locale)
  const out = { rows: [], skipped: [], header: Boolean(head) }
  for (const { line, cells } of data) {
    const values = readRow(cells, fields, ctx, locale)
    const dated = values.date instanceof Date
    if (!dated && cells.some((c) => TOTALS.has(foldKey(c))))
      out.skipped.push({ line, reason: "total" })
    else if (!dated && !READABLE.some((k) => values[k]))
      out.skipped.push({ line, reason: "unreadable" })
    else out.rows.push(values)
  }
  return out
}
