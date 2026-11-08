/**
 * Yazıyla sayılar → rakam (Anlat; katlanmış yazıda): "on beş bin" → "15000", "beş yüz" → "500",
 * "iki buçuk milyon" → "2500000", "bir hafta" → "1 hafta". Yanlış dönüşüm olmasın diye tek kelime
 * ancak ardından birim gelirse çevrilir ("üç gün", "iki kişi", "bin lira"); "bir taksi" ya da "ön
 * ödeme" ("on" olarak katlanır) olduğu gibi kalır.
 */

const UNITS = {
  sifir: 0,
  bir: 1,
  iki: 2,
  uc: 3,
  dort: 4,
  bes: 5,
  alti: 6,
  yedi: 7,
  sekiz: 8,
  dokuz: 9,
}
const TENS = {
  on: 10,
  yirmi: 20,
  otuz: 30,
  kirk: 40,
  elli: 50,
  altmis: 60,
  yetmis: 70,
  seksen: 80,
  doksan: 90,
}
const BIG = { bin: 1e3, milyon: 1e6, milyar: 1e9 }
const UNIT_AFTER =
  /^(gun|hafta|gece|kisi|ay|tl|try|lira|euro|avro|eur|dolar|usd|sterlin|gbp|kalem|fis|bilet)/

const isNumberWord = (w) => w in UNITS || w in TENS || w in BIG || w === "yuz" || w === "bucuk"

/** Bir dizi sayı kelimesinin değeri. */
function valueOf(list) {
  let total = 0
  let current = 0
  for (const w of list) {
    if (w in UNITS) current += UNITS[w]
    else if (w in TENS) current += TENS[w]
    else if (w === "yuz") current = (current || 1) * 100
    else if (w === "bucuk") current += 0.5
    else {
      total += (current || 1) * BIG[w]
      current = 0
    }
  }
  return total + current
}

// Rakamlı çarpan dizileri tek sayı: "15 bin 500" → 15500, "1 milyon 200 bin" → 1200000. Kuyruktaki
// küçük sayı kişi, gece ya da ay adı değilse ("2 bin 15 kasım" değil).
const COMPOUND =
  /\b(\d{1,3}) (milyar|milyon|bin)((?: \d{1,3} (?:milyon|bin))*)(?: (\d{2,3})(?![\d.,])(?! ?(?:kisi|gece|gun|adet|tane|oca|sub|mar|nis|may|haz|tem|agu|eyl|eki|kas|ara)))?\b/g

function digitScales(text) {
  return text.replace(COMPOUND, (all, n, big, more, tail) => {
    if (!more && !tail) return all
    let total = Number(n) * BIG[big]
    for (const [, k, b] of more.matchAll(/(\d{1,3}) (milyon|bin)/g)) total += Number(k) * BIG[b]
    return String(total + Number(tail ?? 0))
  })
}

export function numberWords(folded) {
  const tokens = folded.split(" ")
  const out = []
  for (let i = 0; i < tokens.length;) {
    if (!isNumberWord(tokens[i]) || tokens[i] === "bucuk") {
      out.push(tokens[i++])
      continue
    }
    let j = i
    while (j < tokens.length && isNumberWord(tokens[j])) j++
    const run = tokens.slice(i, j)
    const big = run.some((w) => w in BIG || w === "yuz")
    // "15 bin": rakamdan sonraki çarpan tutar okuyucunun ("15 bin" → 15.000), çevrilmez.
    const scaleOfDigits = run[0] in BIG && /^\d/.test(out.at(-1) ?? "")
    if (scaleOfDigits) out.push(...run)
    else if (run.length > 1 || big || UNIT_AFTER.test(tokens[j] ?? ""))
      out.push(String(valueOf(run)))
    else out.push(...run)
    i = j
  }
  return digitScales(out.join(" "))
}
