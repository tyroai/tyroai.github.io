/** Sözlük işlevi (`useLocale().t`) — yalnız bu modülün kullandığı biçimiyle. */
type Translate = (key: string, vars?: Record<string, string | number>) => string

interface TimedEvent {
  start: Date
  end: Date
  isAllDay?: boolean
}

// Saat h23'e sabit: en-US "02:00 PM" yazardı; takvim dilden bağımsız 24 saat
// okunur. Tarihin parçaları yine yerele uyar.
export const OPTS_TIME: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
}
export const OPTS_DAY_FULL: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}

/**
 * Yanıt bekleyen etkinliğin rengi: paletten bağımsız koyu turuncu
 * (`--chart-4`) — her palette "dikkat" okunur, hata kırmızısı olmaz.
 */
export const ATTENTION = "var(--chart-4)"

const DAY_MS = 86_400_000
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** İki tarih arasındaki takvim günü (saat değişimine dayanıklı: yuvarlanır). */
export const dayDiff = (from: Date, to: Date) =>
  Math.round((dayStart(to) - dayStart(from)) / DAY_MS)

export function duration(event: TimedEvent, t: Translate) {
  if (event.isAllDay) return t("calendar.allDay")
  // Number(): çağıranlardan biri zaman damgası verse de doğru çıksın (eski `end - start` gibi).
  return minutesText(Math.round((Number(event.end) - Number(event.start)) / 60000), t)
}

/** Dakikayı "45 dk" · "2 sa" · "1 sa 30 dk" diye yazar (süre, kalan, başlamasına). */
export function minutesText(minutes: number, t: Translate) {
  if (minutes < 60) return t("calendar.durationMinutes", { minutes })
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!rest) return t("calendar.durationHours", { hours })
  return t("calendar.durationHoursMinutes", { hours, minutes: rest })
}

/**
 * Birden çok gün süren tüm gün etkinliğinin gün sayısı; tek günlükte 1. Graph'ta tüm gün
 * etkinliğinin bitişi HARİÇ (ertesi gece yarısı).
 */
export function allDaySpan(event: TimedEvent) {
  return Math.max(1, dayDiff(event.start, event.end))
}

/**
 * Kartın başındaki simge kutusunun tonu — takvim satırının şeridiyle aynı anlam (yanıt durumu):
 * kabul / düzenleyen marka, yanıt bekleyen ve belki dikkat, ret ve iptal sakin gri.
 */
export function responseTone(response: string | null | undefined, cancelled?: boolean) {
  if (cancelled || response === "declined") return "neutral"
  if (response === "organizer" || response === "accepted") return "brand"
  return "warning"
}

const RESPONSE_TEXT: Record<string, string> = {
  accepted: "calendar.respAccepted",
  tentativelyAccepted: "calendar.respTentative",
  declined: "calendar.respDeclined",
}

/** Yanıtımın metninin anahtarı ("Kabul ettiniz" …); yanıtsız davet "Yanıtlamadınız". */
export const responseKey = (response: string | null | undefined) =>
  RESPONSE_TEXT[response ?? ""] ?? "calendar.respNone"

// Outlook Teams toplantısının konumuna "Microsoft Teams Meeting" (dile göre "… Toplantısı",
// "…-Besprechung") yazar; başlıktaki Teams etiketi bunu zaten söylüyor.
const TEAMS_PLACE = /^microsoft teams\b/i

/**
 * Kartın Konum satırı: çevrimiçi toplantıda Teams'in kendi konum parçası atılır (oda, bina
 * kalır — "Microsoft Teams Meeting; Toplantı Odası A" → "Toplantı Odası A").
 */
export function meetingPlace(location: string | null | undefined, online?: boolean) {
  const text = String(location ?? "").trim()
  if (!online) return text
  return text
    .split(/\s*;\s*/)
    .filter((part) => part && !TEAMS_PLACE.test(part))
    .join("; ")
}

// Teams'in (ve Zoom'un) davete eklediği katılma bloğu bir alt çizgi satırıyla
// başlar: link, toplantı kimliği, parola. Katıl düğmesi bunu zaten yapıyor;
// kartta yalnız düzenleyenin yazdığı gündem kalır.
const JOIN_BLOCK = /^\s*_{10,}\s*$/m

/** Etkinlik gövdesinin önizlemesinden gündem — katılma bloğu olmadan. */
export function agendaText(body: unknown) {
  const text = String(body ?? "")
  const cut = text.search(JOIN_BLOCK)
  return (cut >= 0 ? text.slice(0, cut) : text).trim()
}
