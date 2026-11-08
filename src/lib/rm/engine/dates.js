// tyroRM gün aritmetiği. Gün numarası = 1970-01-01'den UTC gün sayısı; hafta Pazartesi = 0.
// Şartname (TyroRM HTML) aynı birimle hesaplar; saat dilimi kayması olmasın diye her şey UTC.
const DAY_MS = 864e5

/** "YYYY-MM-DD" → gün numarası; geçersizse null. */
export function toDay(iso) {
  if (!iso) return null
  const a = String(iso).split("-").map(Number)
  if (a.length < 3 || a.some(Number.isNaN)) return null
  return Math.round(Date.UTC(a[0], a[1] - 1, a[2]) / DAY_MS)
}

/** Gün numarası → "YYYY-MM-DD". */
export function toIso(n) {
  return new Date(n * DAY_MS).toISOString().slice(0, 10)
}

/** 0 = Pazartesi … 6 = Pazar. */
export function weekday(n) {
  return (new Date(n * DAY_MS).getUTCDay() + 6) % 7
}

export function isWeekend(n) {
  return weekday(n) > 4
}

/** [yıl, ay0] — ay 0'dan başlar (Ocak = 0). */
export function yearMonth(n) {
  const d = new Date(n * DAY_MS)
  return [d.getUTCFullYear(), d.getUTCMonth()]
}

/** "yıl-ay0" anahtarı: motorun aylık kovası (MD) bu anahtarla tutulur. */
export function monthKey(n) {
  const [y, m] = yearMonth(n)
  return `${y}-${m}`
}

export function monthStart(n) {
  const [y, m] = yearMonth(n)
  return Math.round(Date.UTC(y, m, 1) / DAY_MS)
}

export function monthEnd(n) {
  const [y, m] = yearMonth(n)
  return Math.round(Date.UTC(y, m + 1, 0) / DAY_MS)
}

/** Yerel takvimdeki bugünün gün numarası (kullanıcının "bugün"ü). */
export function todayDay(now = new Date()) {
  return Math.round(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS)
}

/** ISO hafta numarası. */
export function isoWeek(n) {
  const d = new Date(n * DAY_MS)
  const day = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - day + 3)
  const y = d.getUTCFullYear()
  const f = new Date(Date.UTC(y, 0, 4))
  const fday = (f.getUTCDay() + 6) % 7
  f.setUTCDate(f.getUTCDate() - fday + 3)
  return 1 + Math.round((d - f) / 6048e5)
}

/** Gün numarası → yerel Date (Intl ile biçimlemek için öğlen; DST kayması tarihi değiştirmesin). */
export function dayToDate(n) {
  const [y, m] = yearMonth(n)
  const d = new Date(n * DAY_MS).getUTCDate()
  return new Date(y, m, d, 12)
}
