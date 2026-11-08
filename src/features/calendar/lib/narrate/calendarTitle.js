import {
  EDGE_WORDS,
  MEETING_FILLERS,
  MEETING_WORDS,
  TASK_FILLERS,
  TASK_WORDS,
  hasRoot,
} from "./calendarWords"

/**
 * Takvim Anlat'ının toplantı ayrıntıları ve konu (saf). `toks`: `{ raw, f }` (özgün ve katlanmış
 * kelime), `taken`: başka okuyucuların tükettiği sıralar. Her okuyucu `used` (konudan atılacak
 * sıralar) döner.
 */

const trim = (s) => s.replace(/[,;:!?.]+$/u, "")
const lower = (s) => s.toLocaleLowerCase("tr")
const bare = (raw) => trim(raw).replace(/['’`´]/g, "")

const ONLINE = /^(?:teams|online|onlayn|cevrimici|uzaktan|sanal)/
// Yer adı kelimeleri, yer ekiyle: "odasında", "ofiste", "salonunda", "merkezde".
const PLACE_NOUN =
  /^((?:oda|salon|ofis|bina|kafe|kafeterya|restoran|lokanta|otel|fabrika|depo|santiye|sube|merkez|tesis|ambar|liman|laboratuvar)(?:s?[iu]|[iu]n)?)(nd[ae]|[dt][ae])$/
// "Ankara'da", "Taksim'de": büyük harfli ad + kesme + yer eki.
const PROPER_PLACE = /^(\p{Lu}[\p{L}]+)['’](?:da|de|ta|te)$/u
const PLACE_ADJECTIVES = new Set(["buyuk", "kucuk", "ana", "genel", "toplanti"])

/** Teams / çevrimiçi geçiyorsa `on: true`, "yüz yüze" ise `on: false`, hiçbiri ise `on` tanımsız. */
export function readTeams(toks, taken) {
  const used = new Set()
  let on
  toks.forEach((tok, i) => {
    if (taken.has(i)) return
    const f = trim(tok.f)
    if (ONLINE.test(f)) {
      used.add(i)
      on = true
      // "Teams üzerinden": bağlaç da gider.
      if (/^(?:uzerinden|uzerinde|araciligiyla)$/.test(trim(toks[i + 1]?.f ?? ""))) used.add(i + 1)
    } else if (f === "yuz" && trim(toks[i + 1]?.f ?? "") === "yuze") {
      used.add(i).add(i + 1)
      on = false
    } else if (f === "fiziksel") {
      used.add(i)
      on = false
    }
  })
  return { on, used }
}

/** Yer ekiyle söylenen yer ("toplantı odasında", "Ankara'da"): `{ text, used }` ya da null. */
export function readPlace(toks, taken) {
  for (let i = 0; i < toks.length; i++) {
    if (taken.has(i)) continue
    const raw = trim(toks[i].raw)
    const proper = PROPER_PLACE.exec(raw)
    if (proper) return { text: proper[1], used: new Set([i]) }
    const noun = PLACE_NOUN.exec(trim(toks[i].f))
    if (!noun) continue
    // Yer eki atılır: "odasında" → "odası" (katlanmış ve özgün kelimenin uzunluğu aynı).
    const plain = lower(bare(raw))
    const used = new Set([i])
    const words = [plain.slice(0, plain.length - noun[2].length)]
    const before = toks[i - 1]
    if (before && !taken.has(i - 1)) {
      const f = trim(before.f)
      if (PLACE_ADJECTIVES.has(f) || /^\p{Lu}/u.test(before.raw)) {
        used.add(i - 1)
        words.unshift(bare(before.raw))
      }
    }
    const text = words.join(" ")
    return { text: text.charAt(0).toLocaleUpperCase("tr") + text.slice(1), used }
  }
  return null
}

// Yalnız tek kelimelik konu kalırsa iyelik eki atılır ("görüşmesi" → "görüşme").
const POSSESSIVE = [
  [/^toplantısı$/iu, "toplantı"],
  [/^görüşmesi$/iu, "görüşme"],
  [/^sunumu$/iu, "sunum"],
  [/^randevusu$/iu, "randevu"],
]

/**
 * Cümlenin geri kalanı: tüketilmemiş kelimeler (özgün yazımıyla), dolgu ("ayarla", "koy", "hatırlat")
 * ve baştaki/sondaki bağlaçlar atılır, ilk harf büyür. Toplantıda "toplantı", "görüşme" gibi isimler
 * kalır ("bütçe toplantısı"); yalnız onlar kalırsa iyelik eki düşer. Konu kalmadıysa "".
 */
export function buildTitle(toks, drop, meeting) {
  const fillers = meeting ? MEETING_FILLERS : TASK_FILLERS
  // Görev işareti ("görev ekle: …", "yapılacak"): işaretin kendisi ve yanındaki "ekle" başlıkta kalmaz.
  const marker = !meeting && toks.some((t, i) => !drop.has(i) && hasRoot(trim(t.f), TASK_WORDS))
  let words = toks
    .filter((_, i) => !drop.has(i))
    .filter((t) => {
      const f = trim(t.f)
      if (fillers.has(f)) return false
      if (marker && (f === "ekle" || f === "olustur")) return false
      return !(
        !meeting &&
        (f.startsWith("gorev") || f.startsWith("yapilacak") || f.startsWith("hatirlat"))
      )
    })
  const edge = (w) => EDGE_WORDS.has(trim(w.f))
  while (words.length && edge(words[0])) words = words.slice(1)
  while (words.length && edge(words.at(-1))) words = words.slice(0, -1)
  let text = words.map((w) => w.raw).join(" ")
  text = text.replace(/^[\s,;:!?.…-]+|[\s,;:!?.…-]+$/gu, "")
  const single = words.length === 1 && hasRoot(trim(words[0].f), MEETING_WORDS)
  const plain = single && POSSESSIVE.find(([re]) => re.test(text))
  if (plain) text = plain[1]
  return (text.charAt(0).toLocaleUpperCase("tr") + text.slice(1)).slice(0, 255)
}
