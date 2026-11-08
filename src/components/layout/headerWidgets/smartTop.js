import { arrangeMilestones } from "@/lib/horizon"

/**
 * Akıllı tepsi düğmesi (iOS'un akıllı yığını gibi): toplu tepsi o an EN İLGİLİ yüzü gösterir.
 * Puan: 3 — toplantı sürüyor ya da 15 dk içinde başlıyor; 2 — odak sayacı çalışıyor ya da son
 * 15 dk içinde bitti; 1 — Ufukta'da gecikmiş hedef var. Hiçbiri yoksa son bakılan (`stackTop`).
 * Saf ve testli; veriyi yoklayıcılar verir (`SmartProbes`).
 */
export const SOON_MS = 15 * 60_000

export function meetingScore(events, now) {
  const hit = (events ?? []).some(
    (e) =>
      !e.owner &&
      !e.isAllDay &&
      e.myResponse !== "declined" &&
      e.end.getTime() > now &&
      e.start.getTime() - now <= SOON_MS,
  )
  return hit ? 3 : 0
}

export function timerScore(state, now) {
  if (state?.endsAt) return 2
  return state?.doneAt && now - state.doneAt < SOON_MS ? 2 : 0
}

export const horizonScore = (items, today) =>
  items?.length && arrangeMilestones(items, today).late > 0 ? 1 : 0

/** En yüksek puanlı yüz (eşitlikte tepsideki sıra); puanı olan yoksa `null`. */
export function pickTop(scores, items) {
  let best = null
  for (const id of items) if ((scores[id] ?? 0) > (scores[best] ?? 0)) best = id
  return best
}
