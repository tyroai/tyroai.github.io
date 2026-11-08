import { brandOf } from "./brands"
import { expenseCategoryOf } from "./expenseWords"
import { fold } from "./text"

/**
 * Masraf cümlesini kalemlere böler (saf, ham yazıda): virgül (sayının içindeki değil), noktalı
 * virgül, satır, cümle sonu, "ve", "artı", "+", "1)" gibi madde işaretleri; selam ve teşekkür
 * parçaları atılır. Virgülsüz yazılan kalemler ("taksi 450 yemek 1200 otopark 60")
 * tutarlardan bölünür: her tutarın arkasından, parça tutarla başlıyorsa ("450 taksi 1200 yemek")
 * önünden — ancak en az iki parça kendi kategorisini (ya da markasını) buluyorsa.
 */
const SPLIT = /(?<!\d),|,(?!\d)|;|\n|\.\s+(?=\p{Lu})|\s+(?:ve|artı|arti|\+)\s+/iu
const BULLET = /(?:^|\s)\d{1,2}\)\s*/g
const GREETING =
  /^(?:merhaba|selam\w*|iyi (?:calismalar|gunler|aksamlar)|tesekkur\w*|saygilar\w*|kolay gelsin|hocam)(?:\s|$)/

/** Selam ya da kapanış ("Merhaba İK", "Teşekkürler"): kalem de başlık da değildir. */
export const isGreeting = (s) =>
  GREETING.test(
    fold(s)
      .replace(/[^a-z\s]/g, "")
      .trim(),
  )
const MONEY =
  /(?:[€$£₺]\s*)?\d[\d.,]*(?:\s*(?:bin|milyon|k)(?!\p{L}))?(?:\s*(?:tl|try|lira|dolar|euro|avro|eur|usd|gbp|sterlin)\p{L}*(?:['’]\p{L}*)?|\s*[€$£₺])?/giu
const MONTHS =
  "ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik|(?:oca|şub|sub|mar|nis|may|haz|tem|ağu|agu|eyl|eki|kas|ara)(?!\\p{L})"
// Tutar olmayan sayılar: arkasında kişi, gece, adet, ay adı, saat ya da aralık; gün.ay; ay adından
// sonra gelen yıl; fiş no.
const NOT_AFTER = new RegExp(
  `^(?:\\s*(?:kişi|kisi|gece|gün|gun|adet|tane|kez|kere|saat|km|lt|litre|kilo|kg|kutu|paket|sayfa|${MONTHS})|\\s*[-–]\\s*\\d|['’:])`,
  "iu",
)
const AFTER_MONTH = new RegExp(`(?:^|\\s)(?:${MONTHS})\\S*\\s*$`, "iu")
const AFTER_NO = /(?:(?:^|\s)(?:no|numarası|numarasi)|#)\.?\s*:?\s*$/iu
const DAY_MONTH = /^\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?$/
const YEAR = /^(?:19|20)\d{2}$/

const named = (piece) => {
  const f = fold(piece)
  return Boolean(expenseCategoryOf(f) || brandOf(f))
}

const isMoney = (piece, token, from, to) => {
  const before = piece.slice(0, from)
  if (DAY_MONTH.test(token) || NOT_AFTER.test(piece.slice(to)) || AFTER_NO.test(before))
    return false
  return !(YEAR.test(token) && AFTER_MONTH.test(before))
}

/** Virgülsüz parçayı tutarlarından böler; bölünmeyecekse olduğu gibi. */
function splitRun(piece) {
  const cuts = []
  for (const m of piece.matchAll(MONEY)) {
    const end = m.index + m[0].length
    if (isMoney(piece, m[0].trim(), m.index, end)) cuts.push([m.index, end])
  }
  if (cuts.length < 2) return [piece]
  const at = cuts[0][0] === 0 ? cuts.slice(1).map(([a]) => a) : cuts.slice(0, -1).map(([, b]) => b)
  const parts = []
  let from = 0
  for (const i of at) {
    parts.push(piece.slice(from, i).trim())
    from = i
  }
  parts.push(piece.slice(from).trim())
  const ok = parts.every((p) => /\p{L}/u.test(p)) && parts.filter(named).length >= 2
  return ok ? parts : [piece]
}

/** Kalemlerin ham yazıları. */
export const expensePieces = (text) =>
  text
    .replace(BULLET, "\n")
    .split(SPLIT)
    .map((s) => s.trim())
    .filter((s) => s && !(isGreeting(s) && !/\d/.test(s)))
    .flatMap(splitRun)
