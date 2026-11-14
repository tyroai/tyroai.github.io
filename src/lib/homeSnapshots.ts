import { readSnapshot, reviveDates, writeSnapshot } from "@/lib/snapshot"

/**
 * Anasayfa kartlarının anlık görüntüleri (`lib/snapshot`): takvim (pano aralığı), posta (son
 * mesajlar + bugünün okunmamış sayısı), bugünün görevleri. Her biri yalnız kartın gösterdiği
 * alanları saklar — posta ve toplantı ÖNİZLEME metni (gövdenin başı) saklanmaz, ağdan gelince dolar.
 * Görüntü kancanın anahtarını da taşır: aralık, kişi kümesi ya da sayfa boyu değiştiyse kullanılmaz.
 */
type Obj = Record<string, unknown>
interface Keyed<T> {
  key: string
  state: T
}

function read<T>(
  name: string,
  account: string | null | undefined,
  key: string,
  revive?: (s: T) => T,
) {
  const snap = readSnapshot<Keyed<T>>(name, account)
  if (!snap || snap.value?.key !== key) return null
  return revive ? revive(snap.value.state) : snap.value.state
}

/* ─── Takvim (pano aralığı: Anasayfa, çentik, Pano) ─────────────────── */

const CAL = "cal-board"
type CalState = {
  status: string
  events: Obj[]
  unreachable?: unknown[]
  range?: string | null
  stale?: boolean
}

export function calendarSnapshot(account: string | null | undefined, key: string): CalState | null {
  // `stale`: görüntüden geldi — tazeleme hata verirse kanca bunu bırakmaz (`keepStale`).
  return read<CalState>(CAL, account, key, (s) => ({
    ...s,
    stale: true,
    events: (s.events ?? []).map((e) => reviveDates(e, ["start", "end"])),
  }))
}

export function saveCalendarSnapshot(
  account: string | null | undefined,
  key: string,
  state: CalState,
) {
  if (state.status !== "ready") return
  // Gövdenin başı (önizleme) saklanmaz.
  const events = state.events.map((e) => ({ ...e, bodyPreview: "" }))
  writeSnapshot(CAL, account, { key, state: { ...state, events } })
}

/* ─── Posta (son mesajlar + bugünün okunmamışı) ─────────────────────── */

const MAIL = "mail-recent"
type MailState = { status: string; messages: Obj[]; unread: number; stale?: boolean }

export function mailSnapshot(account: string | null | undefined, key: string): MailState | null {
  return read<MailState>(MAIL, account, key, (s) => ({
    ...s,
    stale: true,
    messages: (s.messages ?? []).map((m) => reviveDates(m, ["received"])),
  }))
}

export function saveMailSnapshot(
  account: string | null | undefined,
  key: string,
  state: MailState,
) {
  if (state.status !== "ready") return
  const messages = state.messages.map((m) => ({ ...m, preview: "" }))
  writeSnapshot(MAIL, account, { key, state: { ...state, messages } })
}

/* ─── Bugünün görevleri (odak) ──────────────────────────────────────── */

const FOCUS = "focus-today"

export function focusSnapshot<T extends { day: string }>(
  account: string | null | undefined,
  day: string,
): T | null {
  return read<T>(FOCUS, account, day)
}

export function saveFocusSnapshot<T extends { day: string }>(
  account: string | null | undefined,
  value: T,
) {
  writeSnapshot(FOCUS, account, { key: value.day, state: value })
}

/**
 * Tazeleme hata verdiyse elde bugünün görüntüsü varken kart hatayı göstermez: görüntü kalır,
 * hata `refreshError`a yazılır (kanca yeniden denemeyi sürdürür). Microsoft 365 kesintisinde (takvim
 * HTTP 500) kart bugünün bilinen hâliyle kalsın, düzelince kendiliğinden tazelensin.
 */
export function keepStale<S extends { status: string; stale?: boolean }>(
  prev: S,
  next: { status: string },
  hasData: (s: S) => boolean,
): S | { status: string } {
  if (next.status === "ready" || !prev.stale || prev.status !== "ready" || !hasData(prev))
    return next
  return { ...prev, refreshError: next }
}
