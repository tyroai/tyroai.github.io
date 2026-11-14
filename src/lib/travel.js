import { EXTRA_CITIES, HOME_CITY, OFFICE_CITIES } from "@/data/worldCities"

// Sözcük BAŞI eşleşir, sonu serbest — Türkçe ekler ("fuarı", "uçuşu") kaçmasın. `\b` Türkçe
// harfleri tanımıyor. Yolculuk sözcüğü tek başına yeter; yer sözcüğü (otel, fuar, ziyaret)
// evin şehrinde de olur — "Levent - Wyndham Grand Hotel"deki zirve yolculuk değil — bu yüzden
// yalnız başka bir şehrin adıyla birlikte yolculuk sayılır.
const TRAVEL = /(^|[^\p{L}])(seyahat|yolculu|uçuş|ucus|iş gezi|travel|trip|flight)/iu
const VENUE = /(^|[^\p{L}])(ziyaret|fuar|otel|visit|fair|hotel)/iu
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Şehir adı SÖZCÜK olarak geçmeli: düz "içinde geçiyor mu" aramasında "Mustafa Bey ziyareti" Muş'a
// (EN "Mus"), "Limassol fuarı" Lima'ya, "Romeo ile" Roma'ya düşüyordu. Ardından kesme işaretiyle
// gelen ek serbest ("Roma'da", "Chicago’ya"). `\b` Türkçe harfleri tanımıyor.
const CITIES = [...OFFICE_CITIES, ...EXTRA_CITIES].map((c) => {
  const names = [
    ...new Set(
      Object.values(c.names ?? {})
        .filter(Boolean)
        .map((n) => escape(String(n).toLocaleLowerCase("tr"))),
    ),
  ]
  return { c, re: new RegExp(`(^|[^\\p{L}])(${names.join("|")})(?=$|[^\\p{L}])`, "u") }
})

/**
 * Metinde geçen ilk katalog şehri (TR ya da EN adıyla, sözcük olarak) — saat dilimi için.
 * `skip` verilirse o şehir atlanır ("İstanbul – Dubai" → Dubai).
 */
export function cityIn(text, skip = null) {
  const s = String(text ?? "").toLocaleLowerCase("tr")
  if (!s) return null
  return CITIES.find(({ c, re }) => c.id !== skip && re.test(s))?.c ?? null
}

/**
 * Etkinlik bir yolculuk mu: konusu ya da yeri yolculuk anlatıyor; ya da yer sözcüğü (otel, fuar,
 * ziyaret) başka bir şehrin adıyla geçiyor; ya da birden çok güne yayılan, yeri evin şehri
 * olmayan tüm gün etkinliği. Ev `HOME_CITY` (genel merkez). Tek tanım: Anasayfa'nın yolculuk
 * kartı, karşılama satırı ve Takvim sayfası aynısını okur.
 */
export function isTripEvent(e, home = HOME_CITY) {
  const text = `${e.subject ?? ""} ${e.location ?? ""}`
  // `/i` "İ"yi "i"ye eşlemiyor ("İş gezisi"); Türkçe küçültme de "I"yı "ı" yapıyor ("TRIP"): ikisi.
  const has = (re) => re.test(text) || re.test(text.toLocaleLowerCase("tr"))
  if (has(TRAVEL)) return true
  const away = cityIn(text, home)
  if (has(VENUE)) return Boolean(away)
  const multiDay = e.isAllDay && e.end - e.start > 86_400_000 && e.location
  return Boolean(multiDay && (away || !cityIn(text)))
}

/**
 * Önümüzdeki `days` gün içindeki yolculuklar (`isTripEvent`). Kendi takvimin, reddedilmemiş;
 * tekrarlayan seri tek kez. Şehir varış yeri: evin şehri dışındaki ilk ad.
 */
export function upcomingTrips(events, now, days = 21) {
  const from = new Date(now)
  const to = new Date(from.getTime() + days * 86_400_000)
  const seen = new Set()
  return (events ?? [])
    .filter((e) => !e.owner && e.myResponse !== "declined" && e.end > from && e.start < to)
    .filter(isTripEvent)
    .filter((e) => {
      const key = e.seriesMasterId ?? e.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.start - b.start)
    .map((e) => {
      const text = `${e.location} ${e.subject}`
      return { ...e, city: cityIn(text, HOME_CITY) ?? cityIn(text) }
    })
}
