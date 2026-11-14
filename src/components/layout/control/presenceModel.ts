/**
 * Teams durumu (saf, testli): seçilebilen durumlar, Graph'ın `availability`sinden ton, tercih
 * süresinin ISO yazımı. Tercih edilen durum yalnız Teams açıkken görünür (Graph'ın kuralı:
 * en az bir Teams oturumu yoksa kişi "Çevrim dışı" görünür).
 */

/** Seçilebilenler; Graph'ta her birinin etkinliği (`activity`) aynı adı taşır. */
export const PRESENCE_CHOICES = [
  "Available",
  "Busy",
  "DoNotDisturb",
  "BeRightBack",
  "Away",
] as const
export type PresenceChoice = (typeof PRESENCE_CHOICES)[number]

export type PresenceTone = "available" | "busy" | "dnd" | "away" | "offline"

/** Graph'ın `availability` değeri → renk tonu (boşta olanlar asıl durumunun tonunda). */
export function presenceTone(availability: string | null | undefined): PresenceTone {
  switch (availability) {
    case "Available":
    case "AvailableIdle":
      return "available"
    case "Busy":
    case "BusyIdle":
      return "busy"
    case "DoNotDisturb":
      return "dnd"
    case "BeRightBack":
    case "Away":
      return "away"
    default:
      return "offline"
  }
}

/** Teams'in kendi koyduğu etkinlikler: adı durumdan çok şey söyler ("Toplantıda" > "Meşgul"). */
const ACTIVITIES = new Set([
  "InAMeeting",
  "InACall",
  "InAConferenceCall",
  "Presenting",
  "Focusing",
  "OutOfOffice",
  "OffWork",
  "UrgentInterruptionsOnly",
])

/**
 * Durum metninin anahtarı (dört dilde): Teams'in kendi etkinliği varsa onun adı
 * (`control.presence.activity.<etkinlik>`), yoksa tercihler kendi adıyla, ötekiler tonla.
 */
export const presenceLabelKey = (
  availability: string | null | undefined,
  activity?: string | null,
): string => {
  if (activity && ACTIVITIES.has(activity)) return `control.presence.activity.${activity}`
  const a = availability ?? ""
  if ((PRESENCE_CHOICES as readonly string[]).includes(a)) return `control.presence.${a}`
  return `control.presence.tone.${presenceTone(a)}`
}

export type PresenceReason = "meeting" | "call" | "presenting" | "focusing" | "oof"
const REASONS: Record<string, PresenceReason> = {
  InAMeeting: "meeting",
  InACall: "call",
  InAConferenceCall: "call",
  Presenting: "presenting",
  Focusing: "focusing",
  OutOfOffice: "oof",
}
// Yalnız elle konan durumlar: etkinlik aynı adı taşıyorsa biri seçmiştir. Teams "Meşgul"ü
// toplantıyla, "Rahatsız etmeyin"i sunum ya da odakla koyar — o zaman etkinliğin adı başkadır.
const BY_HAND = new Set(["Busy", "DoNotDisturb", "BeRightBack"])

export type PresenceSource =
  | { by: "focus"; until: number }
  | { by: "you"; until: number | null }
  | { by: "teams"; reason: PresenceReason | null }

/**
 * Durumu şu an kim koyuyor (ürün sahibi: "bu Meşgul'ü ben mi seçtim, Teams mi yapıyor?"):
 * Odak modu (Teams bağı), TYRO'dan seçilen tercih (`mine`, bitişiyle), Teams'te elle seçilen
 * ya da Teams'in kendisi (takvim, görüşme, sunum, otomatik yanıt). Graph tercihi ayrıca
 * söylemiyor; TYRO'nun yazdığı iz ve etkinliğin adı yeter.
 */
export function presenceSource({
  availability,
  activity,
  mine,
  focus,
  now,
}: {
  availability: string | null | undefined
  activity: string | null | undefined
  mine: { choice: string; until: number } | null
  focus: { until: number } | null
  now: number
}): PresenceSource {
  if (focus && focus.until > now && availability === "DoNotDisturb")
    return { by: "focus", until: focus.until }
  if (mine && mine.until > now && availability === mine.choice)
    return { by: "you", until: mine.until }
  if (activity && activity === availability && BY_HAND.has(activity))
    return { by: "you", until: null }
  return { by: "teams", reason: (activity && REASONS[activity]) || null }
}

/** Tercihin süresi: 1 saat · seçilen saate kadar (`time`) · gün sonuna kadar. */
export const PRESENCE_DURATIONS = [60, "time", "day"] as const
export type PresenceDuration = (typeof PRESENCE_DURATIONS)[number]

const hhmm = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`

/** "Saat seç"in ilk değeri: en az yarım saat sonrası, yarım saate yuvarlı (14.10 → "15:00"). */
export function defaultUntil(now: number): string {
  const d = new Date(now)
  const minute = d.getHours() * 60 + d.getMinutes()
  return hhmm((Math.ceil(minute / 30) * 30 + 30) % (24 * 60))
}

/**
 * Süre (dakika): "gün" bugün 23.59'a kadar; `time` seçilen saatin ("HH:MM") bir sonraki gelişine
 * kadar — geçmiş bir saat yarına düşer, okunamayan saat 1 saat sayılır; en az 5 dakika.
 */
export function presenceMinutes(choice: PresenceDuration, now: number, until = ""): number {
  if (choice === 60) return 60
  const end = new Date(now)
  if (choice === "day") end.setHours(23, 59, 0, 0)
  else {
    const [h, m] = until.split(":").map(Number)
    if (!Number.isInteger(h) || !Number.isInteger(m) || h > 23 || m > 59) return 60
    end.setHours(h, m, 0, 0)
    if (end.getTime() <= now) end.setDate(end.getDate() + 1)
  }
  return Math.max(5, Math.round((end.getTime() - now) / 60_000))
}

/** Graph'ın süre biçimi (ISO 8601): 90 → "PT90M". */
export const isoMinutes = (minutes: number): string => `PT${Math.max(5, Math.round(minutes))}M`
