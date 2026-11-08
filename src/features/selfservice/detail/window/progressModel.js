import { isWorkday } from "@/lib/narrate/calendar"
import { STATUS_TONE } from "@/lib/selfServiceStatus"
import { statusSteps } from "../steps"

const DAY = 864e5
const dayOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const plus = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/**
 * İznin takvimi (saf): başlangıç → bitiş → işe dönüş (bitişten sonraki ilk iş günü, tatil takvimiyle)
 * ve bugünün yeri. Çubuk iznin günleri: geçen günler dolu, bugün çizgili, kalanlar kesikli.
 * `phase`: upcoming · ongoing · past. Tarihsiz kayıtta null.
 */
export function leaveProgress(record, today = new Date()) {
  if (!(record?.start instanceof Date)) return null
  const now = dayOf(today).getTime()
  const start = dayOf(record.start)
  const end = dayOf(record.end instanceof Date ? record.end : record.start)
  let back = plus(end, 1)
  for (let i = 0; i < 14 && !isWorkday(back); i++) back = plus(back, 1)
  const total = Math.max(1, Math.round((end - start) / DAY) + 1)
  const phase = now < start.getTime() ? "upcoming" : now > end.getTime() ? "past" : "ongoing"
  const day = phase === "ongoing" ? Math.round((now - start) / DAY) + 1 : 0
  const returned = phase === "past" && now >= back.getTime()
  return {
    kind: "leave",
    phase,
    total,
    day,
    daysToStart: phase === "upcoming" ? Math.round((start - now) / DAY) : 0,
    tone: phase === "ongoing" ? "success" : phase === "upcoming" ? "brand" : "neutral",
    bar:
      phase === "past"
        ? { done: 1, now: 0 }
        : phase === "ongoing"
          ? { done: (day - 1) / total, now: 1 / total }
          : { done: 0, now: 0 },
    // Tek günlük izinde başlangıç ve bitiş aynı gün: tek satır ("İzin günü").
    steps: [
      ...(total === 1
        ? [
            {
              id: "day",
              date: start,
              state: phase === "upcoming" ? "upcoming" : phase === "ongoing" ? "current" : "done",
            },
          ]
        : [
            { id: "start", date: start, state: phase === "upcoming" ? "upcoming" : "done" },
            {
              id: "end",
              date: end,
              state: phase === "past" ? "done" : phase === "ongoing" ? "current" : "upcoming",
            },
          ]),
      {
        id: "back",
        date: back,
        state: returned ? "done" : phase === "past" ? "current" : "upcoming",
      },
    ],
  }
}

/**
 * Masraf ve avansın onay süreci (saf): Taslak → Onayda → Onaylandı → Tamamlandı/Ödendi
 * (`statusSteps`). İlk adımın tarihi kaydın tarihi (ERP adım saati vermez). Son adıma varmış kayıt
 * tamamen dolu; iade, ret ve iptal durduğu adımda kendi tonunda. Durum bilinmiyorsa null.
 */
export function processProgress(record, category, date = null) {
  const raw = statusSteps(record.kind, category)
  if (!raw) return null
  const complete = category === "completed"
  const steps = raw.map((s, i) => ({
    id: s.id,
    label: s.label,
    state: complete ? "done" : s.state,
    date: i === 0 ? date : null,
  }))
  const done = steps.filter((s) => s.state === "done").length
  const live = steps.some((s) => s.state === "current" || s.state === "stopped")
  return {
    kind: "process",
    tone: STATUS_TONE[category] ?? "neutral",
    done,
    total: steps.length,
    bar: { done: done / steps.length, now: live ? 1 / steps.length : 0 },
    steps,
  }
}
