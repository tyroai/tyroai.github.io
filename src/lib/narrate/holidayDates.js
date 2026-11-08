import { TR_HOLIDAYS } from "@/lib/holidays"
import { bridgeFor } from "@/lib/leaveBridges"
import { addDays, isWeekend, upcomingHolidays } from "@/lib/leaveDays"
import { isWorkday, nextWorkday } from "./calendar"

/**
 * Tatil adlarıyla tarihler (Anlat; katlanmış yazı): "yılbaşı", "kurban bayramı", "bayram" (en
 * yakın uzun bayram), "cumhuriyet bayramı"; ardından "öncesi" (önceki iş günü — arife yarım gün),
 * "sonrası" (sonraki iş günü), "köprüsü" (tatil ile hafta sonu arasındaki tek iş günü), "haftası"
 * (tatilin haftası, pazartesi–cuma), "arifesi". Tarihle anılanlar ("29 ekim", "23 nisan") ve
 * yalın "bayram" yalnız bu eklerle ("Bayram Bey" ad, "29 ekim" düz tarih). Eksiz tatil adı başka
 * tarih yanında düşer (`holiday`: "yılbaşı tatili için 28-31 aralık"). `take(kalıp, okuyucu)`
 * dates.js'in okuyucusu.
 */
const NAMED = [
  ["newYear", "yilbasi"],
  ["ramadan", "(?:ramazan|seker) bayram"],
  ["sacrifice", "kurban bayram"],
  ["republic", "cumhuriyet bayram"],
  ["sovereignty", "cocuk bayram"],
  ["labour", "isci bayram"],
  ["youth", "genclik ve spor bayram"],
  ["democracy", "demokrasi ve milli birlik"],
  ["victory", "zafer bayram"],
  [null, "bayram"],
]
const DATED = [
  ["republic", "29 ekim"],
  ["sovereignty", "23 nisan"],
  ["labour", "1 mayis"],
  ["youth", "19 mayis"],
  ["democracy", "15 temmuz"],
  ["victory", "30 agustos"],
]
const WHEN = "(?:\\s*(oncesi|once|sonrasi|sonra|kopru|haftasi|arifesi|arife)[a-z]*)?"

/** Tatil: geleceğin en yakını (masrafta geçmişin en yakını); `key` yoksa en yakın uzun bayram. */
function holidayOf(key, today, past) {
  const list = TR_HOLIDAYS.filter((h) => (key ? h.key === key : h.days > 1))
  if (!past) return upcomingHolidays(today, list)[0] ?? null
  const done = upcomingHolidays(new Date(2000, 0, 1), list).filter((h) => h.from <= today)
  return done[done.length - 1] ?? null
}

function prevWorkday(d) {
  let x = d
  for (let i = 0; i < 14 && !isWorkday(x); i++) x = addDays(x, -1)
  return x
}

/** Tatilin ve ekin günleri: `{ start, end }` ya da null. */
function around(h, when) {
  if (!h) return null
  if (!when) return { start: h.from, end: h.to, range: true, holiday: true }
  // Öncesi/sonrası tek gün; ardından süre gelirse oradan sayılır ("bayramdan önce 2 gün": geriye).
  if (when.startsWith("once")) return { start: prevWorkday(addDays(h.from, -1)), before: true }
  if (when.startsWith("sonra")) return { start: nextWorkday(addDays(h.to, 1)) }
  if (when === "kopru") {
    const b = bridgeFor(h)?.bridge
    return b ? { start: b, end: b } : null
  }
  if (when === "haftasi") {
    // Tatil hafta sonundaysa ("yılbaşı" cumartesi) önündeki iş haftası.
    const day = isWeekend(h.from) ? prevWorkday(h.from) : h.from
    const monday = addDays(day, -((day.getDay() + 6) % 7))
    return { start: monday, end: addDays(monday, 4), range: true }
  }
  // Arife: tatilin yarım günü; yoksa önceki iş günü.
  const eve = h.eve ? new Date(`${h.eve}T00:00:00`) : prevWorkday(addDays(h.from, -1))
  return { start: eve, end: eve }
}

export function readHolidays(take, today, { past = false } = {}) {
  for (const [key, words] of DATED)
    take(new RegExp(`\\b${words}\\s*(?:da|de|ta|te|un|in)?${WHEN}`, "g"), (m) =>
      m[1] ? around(holidayOf(key, today, past), m[1]) : null,
    )
  for (const [key, words] of NAMED)
    take(new RegExp(`\\b${words}[a-z]*${WHEN}`, "g"), (m) =>
      key || m[1] ? around(holidayOf(key, today, past), m[1]) : null,
    )
}
