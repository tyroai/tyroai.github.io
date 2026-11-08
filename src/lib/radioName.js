/**
 * İstasyon adlarının yazımı — kaynak (Radio Browser) adları kimi BÜYÜK, kimi küçük yazıyor
 * ("DAMAR TURK FM", "baba radyo", "Metro fm turkey"). Kural (ürün sahibinin isteği):
 *   - FM her zaman BÜYÜK ve adın SONUNDA ("Süper FM 99.9" → "Süper 99.9 FM") — her ülkede;
 *   - Türkiye istasyonlarında her kelimenin ilk harfi büyük, kalanı küçük ("Kral Pop"):
 *     sesli harfsiz ve bilinen kısaltmalar büyük (TRT, NTV, ODTÜ), Roma rakamı büyük (III),
 *     bilinçli karışık yazım korunur ("Number1", "DamarTurk"), rakamın ardındaki ek küçük
 *     ("90lar", "80s"), kaynağın Türkçe harfsiz yazdığı sık kelimeler düzelir ("Turk" →
 *     "Türk", "ALTIN" → "Altın"), sondaki ülke adı atılır ("… TURKEY"; Türkçe yazımı ancak
 *     geriye en az iki kelime kalıyorsa — "Türkülerle Türkiye" kalır).
 * Başka ülkede harfler olduğu gibi: oradaki büyük yazım çoğu zaman kısaltma ya da çağrı adı
 * ("NPO", "KEXP"), Rusça cümle düzeninde yazılıyor. Her ülkede: baştaki süs işaretleri ("# ",
 * ". ") atılır; kuyruk (parantez, tırnak, " - ", ": ", ", ", başka yazı sistemiyle başlayan ad)
 * ve sondaki teknik etiket ("128k", "AAC", "HD") yerinde kalır, FM onlardan önce eklenir.
 * Anahtar (`brandKey`) bu değişikliklerden etkilenmez.
 */

// `i` bayrağı "İ"yi "i" saymıyor: büyükler açıkça.
const VOWEL = /[aeıioöuüâîûyAEIİOÖUÜÂÎÛY]/
const TR_LETTER = /[çğıöşüÇĞİÖŞÜ]/
const LATIN = /^[\p{Script=Latin}\p{N}&+'’]+$/u
const LOWER_WORDS = new Set(["ve", "ile", "and", "of", "the"])
const SUFFIX = /^(lar|ler|lık|lik|luk|lük|lı|li|lu|lü)$/i
const ROMAN = /^(?=[IVXLC]{2,}$)C{0,3}(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/
// Sesli harfli kısaltmalar: büyük kalır.
const ACRONYMS = new Set(["odtu", "itu", "ktu", "omu", "estu", "bau", "tedu", "atv", "abd", "edm"])
// Kaynağın Türkçe harfsiz yazdığı sık kelimeler ve markalar (anahtar: harfleri sadeleşmiş hâl).
const TR_WORDS = {
  turk: "Türk",
  turku: "Türkü",
  turkuler: "Türküler",
  turkce: "Türkçe",
  super: "Süper",
  muzik: "Müzik",
  altin: "Altın",
  yildiz: "Yıldız",
  havalari: "Havaları",
  karisik: "Karışık",
  sarki: "Şarkı",
  sarkilar: "Şarkılar",
  sarkilari: "Şarkıları",
  bati: "Batı",
  sari: "Sarı",
  kiyi: "Kıyı",
  dunya: "Dünya",
  gonul: "Gönül",
  isparta: "Isparta",
  igdir: "Iğdır",
  powerturk: "PowerTürk",
  joyturk: "JoyTürk",
  damarturk: "DamarTürk",
}
// Sondaki teknik etiket (bit hızı, biçim): adın parçası değil, FM ondan önce gelir.
const TECH = /^\(?(\d+\s?k(bps)?|kbps|aac\+?|mp3|flac|ogg|opus|hls|hq|hd)\)?$/i
const DOMAIN =
  /^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)*\.(com|net|org|tv|fm|ru|de|nl|ro|tr|club|online|io|info|me|app|live|radio)$/iu
// Kuyruk: boşluktan sonra açılan parantez/tırnak; " / " · " | " · " - " · " – " · " — " ·
// " • " · ": " · ", "; ya da Latin olmayan (ve büyük/küçük harfi olmayan) yazıyla başlayan ad.
const TAIL =
  /\s(?=[(‘“"'«[])|\s[/|\-–—•]\s|[:,]\s|\s(?=[\p{Script=Arabic}\p{Script=Han}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}])/u
const EDGES = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/su
const FM_WORD = /(^|[^\p{L}\p{N}])fm(?=[^\p{L}\p{N}]|$)/giu

const fold = (s) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/[ığüşöç]/g, (c) => ({ ı: "i", ğ: "g", ü: "u", ş: "s", ö: "o", ç: "c" })[c])
const bare = (w) => fold(w).replace(/[^\p{L}\p{N}]/gu, "")
// Kelime sonuna yapışık FM büyük ("SumerFm" → "SumerFM"); Latin harften sonra.
const gluedFm = (w) => w.replace(/(\p{Script=Latin})fm$/iu, "$1FM")

/** Harf ve rakamdan oluşan çekirdek — Türkçe başlık yazımı. */
function caseCore(core) {
  const num = core.match(/^(\p{N}+['’]?)(\p{L}+)(.*)$/u)
  if (num) {
    const [, n, letters, rest] = num
    if (/^(fm|am|hd|tv)$/i.test(letters)) return n + letters.toUpperCase() + rest
    if (letters.length <= 2 || SUFFIX.test(letters))
      return n + letters.toLocaleLowerCase("tr") + rest
    return core // "1LIVE": bilinçli yazım
  }
  if (/^\p{N}/u.test(core)) return core
  const letters = core.replace(/[^\p{L}]/gu, "")
  const upper = letters === letters.toLocaleUpperCase("tr")
  const lower = letters === letters.toLocaleLowerCase("tr")
  const title = /^\p{Lu}\p{Ll}*$/u.test(letters)
  // İçte büyük harf bilinçli yazım ("DnB", "MHz", "PowerTürk"): dokunulmaz.
  if (!upper && !lower && !title) return gluedFm(core)
  if (upper && ROMAN.test(core)) return core
  if (ACRONYMS.has(bare(core))) return core.toLocaleUpperCase("tr")
  if (LATIN.test(core) && !VOWEL.test(letters)) return core.toLocaleUpperCase("en") // "Cnn" → CNN
  if (title) return gluedFm(core)
  // Tek başına I/ı yazıldığı gibi (iki kez uygulamak aynı sonucu versin).
  if (/^[Iıİ]$/.test(core)) return core
  // "VIRGIN" Türkçe kurala göre "vırgın" olurdu: Türkçe harfi yoksa Türkçe kural yok.
  const low = core.toLocaleLowerCase(TR_LETTER.test(core) ? "tr" : "en")
  return gluedFm(low[0].toLocaleUpperCase("tr") + low.slice(1))
}

/** Bir parça (nokta/tire arası): baştaki ve sondaki işaretler yerinde, çekirdeği yazılır. */
function casePart(part) {
  const [, lead, core, trail] = part.match(EDGES)
  return /\p{L}/u.test(core) ? lead + caseCore(core) + trail : part
}

function caseWord(word, first) {
  if (/^(https?:\/\/|www\.)/i.test(word)) return word
  const [, lead, core, trail] = word.match(EDGES)
  const key = bare(core)
  if (TR_WORDS[key]) return lead + TR_WORDS[key] + trail
  const letters = core.replace(/[^\p{L}]/gu, "")
  const plain =
    letters === letters.toLocaleUpperCase("tr") || letters === letters.toLocaleLowerCase("tr")
  if (!first && plain && LOWER_WORDS.has(key)) return word.toLocaleLowerCase("tr")
  // Alan adı: ilk etiket yazılır, uzantı küçük — FM uzantısı büyük ("Dinamo.FM").
  if (DOMAIN.test(core)) {
    const [name, ...rest] = core.split(".")
    const ext = rest.map((x) => (x.toLowerCase() === "fm" ? "FM" : x.toLowerCase()))
    return lead + [casePart(name), ...ext].join(".") + trail
  }
  // Tireden sonraki 1-2 harf Türkçe ek ("Kur'an-ı"): küçük kalır.
  return word
    .split(/([.\-/])/)
    .map((p, i, all) =>
      /^[.\-/]$/.test(p) ? p : all[i - 1] === "-" && /^\p{Ll}{1,2}$/u.test(p) ? p : casePart(p),
    )
    .join("")
}

/** Kaynaktaki adı okunur yazıma çevirir (`cc`: istasyonun ülkesi, ör. "TR"). */
export function prettyName(name, cc = "") {
  const raw = String(name ?? "")
    .replace(/\s+/g, " ")
    .trim()
  // Baştaki süs işaretleri ("# RdMix", ". Al Quran"): hiçbir şey kalmayacaksa olduğu gibi.
  const text = raw.replace(/^(?:[._*#|~•–—-]+\s+)+/u, "") || raw
  if (!text) return text
  const cut = text.search(TAIL)
  const core = cut < 0 ? text : text.slice(0, cut)
  // Kuyruğa dokunulmaz; yalnız ayrı duran FM büyük.
  const tail = cut < 0 ? "" : text.slice(cut).replace(FM_WORD, "$1FM")
  const tr = String(cc).toUpperCase() === "TR"

  let words = core.split(" ").filter(Boolean)
  const tech = []
  while (words.length > 1 && TECH.test(words.at(-1))) tech.unshift(words.pop())
  const hasFm = words.some((w) => bare(w) === "fm")
  words = words.filter((w) => bare(w) !== "fm")
  if (tr) {
    // Sondaki ülke adı: ASCII yazım ("TURKEY", "Turkiye") hep, Türkçesi ancak geriye en az iki
    // kelime (FM dahil) kalıyorsa atılır.
    while (words.length > 1 && ["turkey", "turkiye"].includes(bare(words.at(-1)))) {
      const ascii = !TR_LETTER.test(words.at(-1))
      if (!ascii && words.length - 1 + (hasFm ? 1 : 0) < 2) break
      words.pop()
    }
    // "90 lar" → "90lar": kaynakta ek sayıdan ayrı yazılmış.
    words = words.reduce((out, w) => {
      if (SUFFIX.test(w) && /\p{N}$/u.test(out.at(-1) ?? "")) out[out.length - 1] += w
      else out.push(w)
      return out
    }, [])
    words = words.map((w, i) => caseWord(w, i === 0))
  } else words = words.map(gluedFm)
  if (hasFm) words.push("FM")
  return [...words, ...tech].join(" ") + tail
}
