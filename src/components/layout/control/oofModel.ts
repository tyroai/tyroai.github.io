/**
 * Otomatik yanıt (Outlook "ofis dışındayım") — saf, testli. Onaylı izinlerden sıradakini bulur,
 * Outlook'un planlı yanıtının aralığını ve dönüş gününü hesaplar, Graph'ın ayarından durumu okur,
 * kişiye sorulup sorulmayacağına karar verir. Yanıt hiçbir zaman kendiliğinden kurulmaz: TYRO
 * açılınca sorar ("Kur" · "Şimdi değil" · "Bu izin için sorma"). Kişinin elle kurduğu yanıta
 * (iş gezisi) dokunulmaz: üzerine yazmayı da kaldırmayı da sormaz.
 */

const DAY_MS = 86_400_000
/** Bu kadar gün içinde başlayan onaylı izin için sorulur. */
export const OOF_ASK_DAYS = 14

export interface LeaveSpan {
  start: Date
  end: Date
}

const dayStart = (d: Date): Date => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
const addDays = (d: Date, n: number): Date => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
const weekend = (d: Date): boolean => d.getDay() === 0 || d.getDay() === 6

/** İzinden sonraki ilk iş günü (Cumartesi ve Pazar atlanır): mesajdaki "dönüyorum" günü. */
export function returnDay(end: Date): Date {
  let d = addDays(dayStart(end), 1)
  while (weekend(d)) d = addDays(d, 1)
  return d
}

/**
 * Bitişik ya da arada yalnız hafta sonu olan izinler tek izin (Cuma biten, Pazartesi başlayan iki
 * kayıt bir tatildir). Girdi sırasız olabilir; çıktı başlangıca göre sıralı.
 */
export function mergeLeaves(spans: readonly LeaveSpan[]): LeaveSpan[] {
  const sorted = spans
    .filter((s) => s?.start && !Number.isNaN(s.start.getTime()))
    .map((s) => ({ start: dayStart(s.start), end: dayStart(s.end ?? s.start) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  const out: LeaveSpan[] = []
  for (const s of sorted) {
    const last = out[out.length - 1]
    if (last && s.start.getTime() <= returnDay(last.end).getTime()) {
      if (s.end > last.end) last.end = s.end
    } else out.push({ ...s })
  }
  return out
}

/** Süren ya da sıradaki izin (birleştirilmiş); yoksa `null`. */
export function nextLeave(spans: readonly LeaveSpan[], now: number): LeaveSpan | null {
  const today = dayStart(new Date(now)).getTime()
  return mergeLeaves(spans).find((s) => s.end.getTime() >= today) ?? null
}

/** Planlı yanıtın aralığı: iznin ilk günü 00.00 → dönüş günü 00.00 (aradaki hafta sonu dahil). */
export const oofWindow = (leave: LeaveSpan): LeaveSpan => ({
  start: dayStart(leave.start),
  end: returnDay(leave.end),
})

export type OofKind = "off" | "on" | "scheduled" | "active"
export interface OofState {
  kind: OofKind
  start?: Date
  end?: Date
}
interface RawSetting {
  status?: string
  start?: Date | null
  end?: Date | null
}

/** Graph'ın ayarından (tarihler çözülmüş) durum: kapalı · açık · planlı · planlı ve şu an açık. */
export function oofState(setting: RawSetting | null | undefined, now: number): OofState {
  const status = setting?.status
  if (status === "alwaysEnabled") return { kind: "on" }
  if (status !== "scheduled" || !setting?.start || !setting.end) return { kind: "off" }
  const { start, end } = setting
  if (now >= end.getTime()) return { kind: "off" }
  return { kind: now >= start.getTime() ? "active" : "scheduled", start, end }
}

const overlaps = (a: LeaveSpan, b: LeaveSpan): boolean =>
  a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime()

/** Planlı yanıt onaylı bir izne denk geliyor mu (iptal edilen iznin yanıtı kalmasın). */
export function coversLeave(state: OofState, spans: readonly LeaveSpan[]): boolean {
  if (!state.start || !state.end) return true
  const win = { start: state.start, end: state.end }
  return mergeLeaves(spans).some((s) => overlaps(oofWindow(s), win))
}

/** Kişiye sorulacak soru: kur (yaklaşan izin, yanıt yok) · kaldır (yanıtın izni kalmadı) · yok. */
export type OofAsk = { kind: "set"; leave: LeaveSpan } | { kind: "clear" } | null

export interface OofAskOptions {
  /** Kişi bu izin için "sorma" demiş mi. */
  skipped?: (leave: LeaveSpan) => boolean
  /** Planlı yanıtı TYRO onaylı bir izinden mi kurdu: kaldırma yalnız onun için sorulur. */
  ours?: (state: OofState) => boolean
}

export function oofAsk(
  spans: readonly LeaveSpan[],
  state: OofState | null,
  now: number,
  { skipped = () => false, ours = () => false }: OofAskOptions = {},
): OofAsk {
  const pending = state?.kind === "scheduled" || state?.kind === "active"
  if (pending && state && ours(state) && !coversLeave(state, spans)) return { kind: "clear" }
  // Açık ya da planlı bir yanıt varsa sorulmaz: ya izni kapsıyor ya da kişinin kendi yanıtı
  // (Outlook'ta tek yanıt var, "Kur" onun üzerine yazardı).
  if (state && state.kind !== "off") return null
  const leave = nextLeave(spans, now)
  if (!leave || leave.start.getTime() - now > OOF_ASK_DAYS * DAY_MS || skipped(leave)) return null
  return { kind: "set", leave }
}

/** "Bu izin için sorma"nın anahtarı: iznin günleri (kayıt numarası değil). */
export const leaveKey = (leave: LeaveSpan): string =>
  `${dayStart(leave.start).getTime().toString(36)}-${dayStart(leave.end).getTime().toString(36)}`

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }

/** Düz metin → Outlook'un yanıt HTML'i (kaçışlı, satır sonları korunur). */
export const replyHtml = (text: string): string =>
  `<div>${text.replace(/[&<>"]/g, (c) => ESC[c]).replace(/\r?\n/g, "<br>")}</div>`
