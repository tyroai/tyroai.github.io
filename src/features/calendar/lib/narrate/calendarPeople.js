import { HONORIFICS, MEETING_WORDS, VERB_STEMS, hasRoot, nameLike } from "./calendarWords"
import { fold } from "@/lib/narrate/text"

/**
 * Takvim Anlat'ının katılımcı adları (saf). Ad iki yerden okunur: "Ahmet ile", "Ahmet Yılmaz ve Ayşe
 * ile", "Ahmet, Ayşe ve Mehmet ile" (adlar "ve" ya da virgülle bağlı) ve ek taşıyan kelime: "Ahmet'le",
 * "Ayşe'yle", "ahmetle" (ünlü uyumu ve kelime boyu denetlenir: "kale", "bile", "kolaylıkla" ad değil).
 * Birden çok sözcüklü ad (en çok 3) büyük harfle yazılmışsa ya da cümlede hiç büyük harf yoksa
 * birleşir ("Ahmet Yılmaz", "ahmet yılmaz"); büyük harfli cümlede küçük harfli komşu alınmaz.
 * Kesmesiz küçük harfli "-le/-la" ("ahmetle") fiillerle ("ayarla", "hazırla") karışır: yalnız
 * ardından bir kelime gelir ve gövde bilinen fiil gövdesi değilse ad sayılır. Ekip, müşteri gibi
 * öbekler, "benimle" ve toplantı kelimeleri ad değildir (konuda kalır). "ile ilgili" ad aramaz.
 * `toks`: `{ raw, f }` (özgün ve katlanmış kelime), `dead`: tarih/saat/süre ile tüketilmiş kelime
 * sıraları. Dönen `{ names, used }`: adlar (özgün yazımla, ilk harf büyük) ve konudan atılacak sıralar.
 */

const FRONT = /[eiöü]/
const BACK = /[aıou]/
const trim = (s) => s.replace(/[,;:!?.]+$/u, "")
const isCap = (s) => /^\p{Lu}/u.test(s)
const lower = (s) => s.toLocaleLowerCase("tr")
// Küçük harfle yazılmış sözcüğün ilk harfi büyür ("ahmet yılmaz" → "Ahmet Yılmaz"); yazıldığı gibi büyükler kalır.
const title = (words) =>
  words
    .map((w) => (w === lower(w) ? w.charAt(0).toLocaleUpperCase("tr") + w.slice(1) : w))
    .join(" ")

/**
 * Kelime "ad + le/la" ise adın özgün ve katlanmış gövdesi, değilse null. Kesmeli ("Ahmet'le") ve
 * "-yle/-yla" yazımda kesinlik var; kesmesiz "-le/-la"da (`loose`) ünlü uyumu, gövde boyu ve
 * "-lık/-lik + la" (zarf) elemesi aranır, bağlama bakılır (aşağıda).
 */
function suffixStem(tok) {
  const raw = trim(tok.raw)
  const apos = raw.search(/['’`´]/)
  if (apos > 0) {
    return /^y?l[ae]$/i.test(raw.slice(apos + 1)) ? stemOf(raw.slice(0, apos)) : null
  }
  // "yle/yla" ünlüden sonra ("ayşe" + yle), "le/la" ünsüzden sonra ("ahmet" + le).
  const m = /^(.+?)(y?)(l[ae])$/iu.exec(raw)
  if (!m) return null
  const [, body, glide, ending] = m
  const vowel = [...lower(body)].reverse().find((c) => /[aeıioöuü]/.test(c))
  const harmony = lower(ending) === "le" ? FRONT : BACK
  const longEnough = body.length >= (glide ? 2 : 3)
  if (!vowel || !harmony.test(vowel) || !longEnough || /l[ıiuü]k$/iu.test(body)) return null
  return { ...stemOf(body), loose: !glide }
}

const stemOf = (raw) => ({ raw, f: fold(raw) })

export function readPeople(toks, dead) {
  const used = new Set()
  const names = []
  const allLower = !/\p{Lu}/u.test(toks.map((t) => t.raw).join(""))
  const free = (i) => i >= 0 && i < toks.length && !dead.has(i) && !used.has(i)
  const stems = toks.map(suffixStem)
  const coreOf = (i, asStem) => (asStem ? stems[i] : { raw: trim(toks[i].raw), f: trim(toks[i].f) })
  const commaEnd = (i) => /,$/.test(toks[i].raw)
  // Kesmeli kelime ("Ankara'da", "Ahmet'in") çekimli addır, ad öbeğinin parçası değil.
  const inflected = (i) => /['’`´]/.test(toks[i].raw)

  // `end`ten sola bir ad öbeği: ünvanlar atlanır, büyük harfli komşular birleşir (en çok 3 sözcük).
  const segment = (end, asStem) => {
    let i = end
    const idx = []
    while (free(i) && HONORIFICS.has(coreOf(i, asStem && i === end)?.f)) idx.unshift(i--)
    if (!free(i)) return null
    const stemmed = asStem && i === end
    const last = coreOf(i, stemmed)
    if (!last || !nameLike(last.f) || (!stemmed && inflected(i))) return null
    idx.unshift(i)
    const words = [last.raw]
    i -= 1
    while (
      free(i) &&
      words.length < (allLower ? 2 : 3) &&
      (allLower || (isCap(last.raw) && isCap(toks[i].raw))) &&
      !commaEnd(i) &&
      !inflected(i) &&
      nameLike(trim(toks[i].f))
    ) {
      idx.unshift(i)
      words.unshift(trim(toks[i].raw))
      i -= 1
    }
    return { idx, words, left: i }
  }

  // Bir ada bağlı öncekiler: "Ahmet, Ayşe ve Mehmet" sağdan sola.
  const chain = (end, asStem) => {
    const found = []
    let i = end
    let stem = asStem
    let link = null
    for (;;) {
      const seg = segment(i, stem)
      if (!seg) break
      if (link != null) used.add(link)
      found.unshift(seg)
      i = seg.left
      stem = false
      link = null
      if (free(i) && toks[i].f === "ve") {
        link = i
        i -= 1
      } else if (!(free(i) && commaEnd(i))) break
    }
    return found
  }

  // Kesmesiz küçük harfli "-le/-la" ("tatile", "okula", "ayarla" ad değil): yalnız hemen ardından bir toplantı
  // kelimesi gelirse ("ahmetle toplantı"); başta büyük harf (ad) varsa ardından herhangi bir kelime yeter.
  const looseOk = (i) => {
    const next = i + 1
    if (VERB_STEMS.has(stems[i].f)) return false
    if (i > 0 && isCap(toks[i].raw)) return free(next)
    return free(next) && hasRoot(trim(toks[next].f), MEETING_WORDS)
  }

  const keep = (found) => {
    for (const seg of found) {
      seg.idx.forEach((k) => used.add(k))
      names.push({ at: seg.idx[0], name: title(seg.words) })
    }
  }
  toks.forEach((tok, i) => {
    if (!free(i)) return
    if (trim(tok.f) === "ile" && trim(toks[i + 1]?.f ?? "") !== "ilgili") {
      const found = chain(i - 1, false)
      if (found.length) used.add(i)
      keep(found)
    } else if (stems[i] && (!stems[i].loose || looseOk(i))) {
      keep(chain(i, true))
    }
  })
  names.sort((a, b) => a.at - b.at)
  const seen = new Set()
  const unique = names.filter(({ name }) => {
    const key = lower(name)
    return seen.has(key) ? false : seen.add(key)
  })
  return { names: unique.map((n) => n.name), used }
}
