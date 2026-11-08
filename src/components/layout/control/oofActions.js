import { STATUS } from "@/lib/graph"
import { notify } from "@/lib/notify"
import { returnDay } from "./oofModel"
import { oofTexts, rangeText } from "./oofText"

/**
 * "Kur" (şerit ve bildirim): hazır metinle tek dokunuşta planlar, "Geri al"lı bildirim verir.
 * İzin gerekiyorsa `schedule` onu kişinin bu dokunuşuyla ister.
 */
export async function setUpOof(oof, leave, t, locale) {
  const texts = oofTexts(t, locale, leave, returnDay(leave.end))
  const res = await oof.schedule(leave, { ...texts, audience: "all" })
  if (res.status === STATUS.ready) {
    notify.success(t("control.oof.done", { range: rangeText(locale, leave.start, leave.end) }), {
      action: { label: t("control.panel.undo"), onClick: () => oof.turnOff() },
    })
  } else {
    notify.error(t("control.oof.failed"))
  }
  return res
}

/** "Kaldır" (şerit, çan, günlük soru): izni kalmayan yanıtı kapatır; olmazsa söyler. */
export async function removeOof(oof, t) {
  const res = await oof.turnOff()
  if (res.status === STATUS.ready) notify.success(t("control.oof.savedOff"))
  else notify.error(t("control.oof.failed"))
  return res
}

/** Planlı yanıtın gösterilecek aralığı: başlangıç → bitişten önceki gün (bitiş dönüş sabahı). */
export const shownRange = (locale, state) =>
  rangeText(locale, state.start, new Date(state.end.getTime() - 60_000))
