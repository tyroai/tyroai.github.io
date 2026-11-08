import { COMPANY_SHORT_NAMES } from "@/data/companyShortNames"

/**
 * Şirket adının yasal eklerini düzgün yazar (saf, yalnız gösterim). AD ve ERP kayıtları
 * "San.ve Tic. A.ş." gibi gelebiliyor: yalnız bilinen eklerin harfi ve boşluğu düzelir, adın
 * geri kalanına dokunulmaz. Tümü BÜYÜK harfli adda harfler korunur, yalnız boşluk düzelir.
 */

// Önünde harf ya da rakam olmasın ("Hasan." eşleşmesin). Geriye bakış yerine yakalanan önek:
// Safari 16.4'ten eski motorlar geriye bakışta modülü hiç yükleyemiyor.
const START = "(^|[^\\p{L}\\p{N}])"
// Türkçe İ/ı büyük-küçük harf eşleşmesine girmez; sınıfla yakalanır.
const I = "[iİıI]"

// Ek: desen (1. grup önek) ve parçaların düzgün yazımı; parçalar arası `join`.
const SUFFIXES = [
  {
    re: new RegExp(`${START}(san\\.)\\s*(?:(ve)\\s*)?(t${I}c\\.)`, "giu"),
    canon: ["San.", "ve", "Tic."],
  },
  {
    re: new RegExp(`${START}(t${I}c\\.)\\s*(?:(ve)\\s*)?(san\\.)`, "giu"),
    canon: ["Tic.", "ve", "San."],
  },
  { re: new RegExp(`${START}(ltd\\.)\\s*(şt${I}\\.)`, "giu"), canon: ["Ltd.", "Şti."] },
  {
    re: new RegExp(`(^|[^\\p{L}\\p{N}.])(a\\.)\\s*(ş)(\\.?)(?![\\p{L}\\p{N}])`, "giu"),
    canon: ["A.", "Ş", "."],
    join: "",
  },
]

const WORD = /[\p{L}\p{N}]/u

/** "TYRO Tech Gıda San.ve Tic. A.ş." → "TYRO Tech Gıda San. ve Tic. A.Ş." */
export function tidyCompanyName(value) {
  const s = String(value ?? "").trim()
  if (!s) return ""
  const upper = s === s.toLocaleUpperCase("tr")
  return SUFFIXES.reduce(
    (out, { re, canon, join = " " }) =>
      out.replace(re, (...args) => {
        const [match, lead, ...rest] = args
        const offset = rest.at(-2)
        const parts = rest
          .slice(0, -2)
          .map((p, i) => (p ? (upper ? p : canon[i]) : ""))
          .filter(Boolean)
        // Ekten hemen sonra harf geliyorsa ("Tic.A.Ş.") araya tek boşluk.
        const next = rest.at(-1)[offset + match.length]
        return lead + parts.join(join) + (next && WORD.test(next) ? " " : "")
      }),
    s,
  )
}

// Karşılaştırma için katlanmış biçim: Türkçe harfler ASCII'ye, noktalar düşer ("A.Ş." → "as").
const fold = (word) =>
  word
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/[.,]/g, "")

// Bilinen şirketler (`COMPANY_SHORT_NAMES`): kod, kısa ad ya da tam ünvan → kısa ad. Anahtar
// yalnız harf ve rakam, Türkçe harfler ASCII'ye iner: "TYRO HOLDING A.Ş." ile "TYRO
// HOLDİNG A.Ş." (iki kaynağın iki yazımı) aynı şirkettir.
const nameKey = (value) =>
  fold(String(value ?? ""))
    .normalize("NFD")
    .replace(/[^a-z0-9]/g, "")
const KNOWN = new Map()
for (const [code, names] of Object.entries(COMPANY_SHORT_NAMES))
  for (const name of [code, ...names]) KNOWN.set(nameKey(name), names[0])

// Ünvanın yasal ve ticari ekleri — ilkinden itibaren kuyruk düşer (Türkçe ve yabancı biçimler).
const LEGAL = new Set([
  "san",
  "sanayi",
  "sanayii",
  "tic",
  "ticaret",
  "ltd",
  "limited",
  "sti",
  "sirketi",
  "as",
  "anonim",
  "inc",
  "llc",
  "llp",
  "gmbh",
  "bv",
  "sa",
  "co",
  "corp",
  "plc",
  "pvt",
  "ltda",
  "srl",
  "spa",
  "ag",
  "kg",
  "too",
  "ooo",
  "jsc",
  "fze",
  "fzco",
  "dmcc",
])
// Kuyruktan önce kalan sektör sözcükleri ("… Gıda San. ve Tic.") — ad en az iki sözcükte kalır.
const SECTOR = new Set([
  "gida",
  "tarim",
  "urunleri",
  "lojistik",
  "nakliyat",
  "insaat",
  "enerji",
  "tekstil",
  "kimya",
  "pazarlama",
  "ithalat",
  "ihracat",
  "hizmetleri",
  "danismanlik",
  "dis",
  "yazilim",
  "bilisim",
])
const JOINERS = new Set(["ve", "&", "-", "and"])

/**
 * Kısa şirket adı (yalnız gösterim): ünvan uzantıları atılır — "TYRO Tech Gıda San. ve Tic.
 * A.Ş." → "TYRO Tech". Baştaki yasal biçim de düşer ("TOO Örnek" → "Örnek"). Kısaltılacak bir
 * şey yoksa ya da geriye bir şey kalmazsa ad yalnız düzeltilmiş hâliyle döner (`tidyCompanyName`).
 */
export function shortCompanyName(value) {
  const tidy = tidyCompanyName(value)
  const words = tidy.split(/\s+/).filter(Boolean)
  while (words.length > 1 && LEGAL.has(fold(words[0]))) words.shift()
  const tail = words.findIndex((w) => LEGAL.has(fold(w)))
  const kept = tail === -1 ? words : words.slice(0, tail)
  while (kept.length && JOINERS.has(fold(kept.at(-1)))) kept.pop()
  if (tail !== -1) while (kept.length > 2 && SECTOR.has(fold(kept.at(-1)))) kept.pop()
  return kept.length ? kept.join(" ") : tidy
}

// Tümü büyük harfli ad okunaklı yazılır; 3 harfe kadar sözcükler kısaltma sayılır (ABC, T).
// Türkçe kural (I → ı) yalnız Türkçe harf taşıyan sözcükte: "BUSINESS" → "Business", "TYRO" →
// "TYRO", "DANIŞMANLIK" → "Danışmanlık".
const titleWord = (w) => {
  if ([...w].filter((c) => /\p{L}/u.test(c)).length <= 3) return w
  const rest = /[İŞĞÜÖÇ]/u.test(w) ? w.slice(1).toLocaleLowerCase("tr") : w.slice(1).toLowerCase()
  return w.charAt(0) + rest
}

/**
 * Ekranda gösterilecek şirket adı. Bilinen şirkette elle yazılmış kısa ad (`COMPANY_SHORT_NAMES`),
 * değilse kural: kısa (`shortCompanyName`) ve tümü BÜYÜK harfliyse okunaklı
 * ("T TECH BUSINESS SOLUTIONS YAZILIM … ANONİM ŞİRKETİ" → "T Tech Business Solutions").
 */
export function displayCompanyName(value) {
  const known = KNOWN.get(nameKey(value))
  if (known) return known
  const short = shortCompanyName(value)
  const upper = /\p{L}/u.test(short) && short === short.toLocaleUpperCase("tr")
  return upper ? short.split(" ").map(titleWord).join(" ") : short
}

/**
 * Şirket kodu (`TTEC`, İK görünümünün `CompanyInfoDataArea`sı) + ad → ekrandaki kısa ad. Bilinen
 * kod önce, sonra ad (`displayCompanyName`); ikisi de yoksa boş.
 */
export function companyLabel(code, name) {
  const short =
    COMPANY_SHORT_NAMES[
      String(code ?? "")
        .trim()
        .toUpperCase()
    ]?.[0]
  return short ?? displayCompanyName(name || code)
}
