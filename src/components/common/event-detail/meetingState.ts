/** Toplantının saate göre evresi: kartın tek sayısının altındaki durum ve birincil eylem buna bakar. */
export type MeetingPhase = "upcoming" | "soon" | "live" | "ended"

export interface MeetingState {
  phase: MeetingPhase
  /** Başlamasına kalan dakika (yukarı yuvarlı; başladıysa 0). */
  minutesToStart: number
  /** Bitmesine kalan dakika (yukarı yuvarlı; bittiyse 0). */
  minutesLeft: number
  /** Geçen pay, 0–1 (çubuk için). */
  elapsed: number
}

// "Yakında" eşiği header'daki `isImminent` ile aynı: 15 dk kala Katıl öne çıkar.
export const SOON_MS = 15 * 60_000

export function meetingState(start: Date, end: Date, now: number): MeetingState {
  const s = start.getTime()
  const e = end.getTime()
  const minutesToStart = Math.max(0, Math.ceil((s - now) / 60_000))
  const minutesLeft = Math.max(0, Math.ceil((e - now) / 60_000))
  const span = Math.max(1, e - s)
  const elapsed = Math.min(1, Math.max(0, (now - s) / span))
  let phase: MeetingPhase = "upcoming"
  if (now >= e) phase = "ended"
  else if (now >= s) phase = "live"
  else if (s - now <= SOON_MS) phase = "soon"
  return { phase, minutesToStart, minutesLeft, elapsed }
}
