import { EXTRA_CITIES, OFFICE_CITIES } from "@/data/worldCities"

// Seyahat sözcükleri (TR · EN): sözcük BAŞI eşleşir, sonu serbest — Türkçe ekler
// ("ziyareti", "fuarı", "uçuşu") kaçmasın. `\b` Türkçe harfleri tanımıyor.
const WORDS =
  /(^|[^\p{L}])(seyahat|yolculu|uçuş|ucus|iş gezi|ziyaret|fuar|otel|travel|trip|flight|visit|fair|hotel)/iu
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

/** Metinde geçen ilk katalog şehri (TR ya da EN adıyla, sözcük olarak) — saat dilimi için. */
export function cityIn(text) {
  const s = String(text ?? "").toLocaleLowerCase("tr")
  if (!s) return null
  return CITIES.find(({ re }) => re.test(s))?.c ?? null
}

/**
 * Etkinlik bir yolculuk mu: konusu ya da yeri seyahat anlatıyor ya da yeri olan, birden çok güne
 * yayılan tüm gün etkinliği. Tek tanım: Anasayfa'nın yolculuk kartı ve Takvim sayfası aynısını okur.
 */
export function isTripEvent(e) {
  const text = `${e.subject ?? ""} ${e.location ?? ""}`
  const multiDay = e.isAllDay && e.end - e.start > 86_400_000 && e.location
  return Boolean(WORDS.test(text) || multiDay)
}

/**
 * Önümüzdeki `days` gün içindeki yolculuklar: konusu ya da yeri seyahat
 * anlatan ya da birden çok güne yayılan tüm gün etkinlikleri (yeri olan).
 * Kendi takvimin, reddedilmemiş; tekrarlayan seri tek kez.
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
    .map((e) => ({ ...e, city: cityIn(`${e.location} ${e.subject}`) }))
}
