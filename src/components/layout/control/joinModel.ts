/**
 * "Toplantıya katıl" (Denetim Merkezi'nin üstünde, yalnız gerektiğinde): çevrim içi toplantı 15
 * dakika içinde başlıyorsa ya da sürüyorsa en erkeni (ürün sahibi: "15 dk olsun"). Tüm gün,
 * reddedilen ve paylaşılan takvimin (başkasının) etkinliği sayılmaz. Saf, testli.
 */
export const JOIN_WINDOW_MS = 15 * 60000

interface JoinEvent {
  start: Date
  end?: Date | null
  isAllDay?: boolean
  owner?: unknown
  myResponse?: string | null
  isOnlineMeeting?: boolean
  joinUrl?: string | null
}

export function joinableMeeting<E extends JoinEvent>(
  events: readonly E[] | null | undefined,
  now: number,
  within: number = JOIN_WINDOW_MS,
): E | null {
  let best: E | null = null
  for (const e of events ?? []) {
    if (e.owner || e.isAllDay || e.myResponse === "declined") continue
    if (!e.isOnlineMeeting && !e.joinUrl) continue
    const start = e.start.getTime()
    const end = e.end?.getTime() ?? start
    if (now >= end || start - now > within) continue
    if (!best || start < best.start.getTime()) best = e
  }
  return best
}

/** Başlamasına kalan dakika (yukarı yuvarlı); başladıysa 0. */
export const minutesUntil = (start: Date, now: number): number =>
  Math.max(0, Math.ceil((start.getTime() - now) / 60000))

/** Header'ın canlı kapsülü: 10 dakika içinde başlayacak (henüz başlamamış) ilk toplantı. */
export const SOON_MS = 10 * 60000

export function soonMeeting<E extends JoinEvent>(
  events: readonly E[] | null | undefined,
  now: number,
): E | null {
  let best: E | null = null
  for (const e of events ?? []) {
    if (e.owner || e.isAllDay || e.myResponse === "declined") continue
    const start = e.start.getTime()
    if (start <= now || start - now > SOON_MS) continue
    if (!best || start < best.start.getTime()) best = e
  }
  return best
}

/** Toplantının kimliği (Sunum modunun teklifi bir kez): Graph kimliği, yoksa başlangıcı. */
export const meetingKey = (e: { id?: string | null; start: Date }): string =>
  e.id ?? String(e.start.getTime())
