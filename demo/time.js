// Zaman yardımcıları: veri setleri "bugüne göre" yazılır; takvim, posta ve görevler hep güncel görünür.
export const MIN = 60 * 1000
export const HOUR = 60 * MIN
export const DAY = 24 * HOUR

export const startOfDay = (d = new Date()) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** `d` gününün saat:dakika'sı (yerel saat). */
export const atTime = (d, hhmm) => {
  const [h, m] = hhmm.split(":").map(Number)
  const x = new Date(d)
  x.setHours(h, m ?? 0, 0, 0)
  return x
}

const p2 = (n) => String(n).padStart(2, "0")

/** Yerel gün: "YYYY-MM-DD". */
export const ymd = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`

/** Dataverse tarihi: "YYYY-MM-DDT00:00:00Z" (takvim günü olarak okunur). */
export const dvDate = (d) => `${ymd(d)}T00:00:00Z`

/** Graph'ın dateTimeTimeZone değeri: UTC, 7 haneli kesirli saniye. */
export const graphDateTime = (d) => ({
  dateTime: d.toISOString().replace("Z", "0000"),
  timeZone: "UTC",
})

/** Pazartesi = 1 … Pazar = 7. */
export const isoWeekday = (d) => (d.getDay() === 0 ? 7 : d.getDay())

/** Tohumlu, tekrarlanabilir sözde rastgele sayı (aynı oturumda aynı sonuç). */
export function seeded(seed) {
  let s = 0
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6

/** `n` iş günü ileri (`n` negatifse geri); hafta sonları atlanır. */
export function bizAdd(d, n) {
  let x = startOfDay(d)
  const step = n < 0 ? -1 : 1
  for (let left = Math.abs(n); left > 0; ) {
    x = addDays(x, step)
    if (!isWeekend(x)) left--
  }
  return x
}

/** Gelecek kayıtların çapası: bugün iş günüyse bugün, değilse sonraki pazartesi. */
export function forwardAnchor(now = new Date()) {
  let x = startOfDay(now)
  while (isWeekend(x)) x = addDays(x, 1)
  return x
}

/** Geçmiş kayıtların çapası: bugün iş günüyse bugün, değilse önceki cuma. */
export function backAnchor(now = new Date()) {
  let x = startOfDay(now)
  while (isWeekend(x)) x = addDays(x, -1)
  return x
}

const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]

/**
 * Takvimdeki iş günü çapasına göre "bugün" / "yarın" / "dün" ya da gün adı: hafta sonu ya da cuma
 * açılan demoda "bugün 14:00 sunum" gerçekte pazartesiye düşer; metin buna göre söylenir.
 */
export function relDayWord(n, now = new Date()) {
  const target = bizAdd(forwardAnchor(now), n)
  const diff = Math.round((target - startOfDay(now)) / DAY)
  if (diff === 0) return "bugün"
  if (diff === 1) return "yarın"
  if (diff === -1) return "dün"
  return DAY_NAMES[target.getDay()]
}

/** Asistan metnindeki göreli gün sözcüklerini (bugün/yarın) gerçek güne göre düzeltir (tek geçiş). */
export function localizeDays(text, now = new Date()) {
  const word = (n, capital) => {
    const w = relDayWord(n, now)
    return capital ? w[0].toLocaleUpperCase("tr") + w.slice(1) : w
  }
  return String(text).replace(/(Bugünkü|bugünkü|Bugün|bugün|Yarın|yarın)(?![a-zçğıöşü])/g, (m) => {
    const capital = m[0] === m[0].toUpperCase()
    const lower = m.toLocaleLowerCase("tr")
    if (lower === "bugünkü") {
      const w = relDayWord(0, now)
      if (w === "bugün") return m
      return w === "yarın" ? `${word(0, capital)}ki` : `${word(0, capital)} günkü`
    }
    if (lower === "bugün") return word(0, capital)
    return word(1, capital)
  })
}
