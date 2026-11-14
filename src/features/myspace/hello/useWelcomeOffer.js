import "@/lib/i18n/insight"
import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { chatOffer } from "./chatOffer"
import { meetingLine, shortTitle } from "./chatLines"
import { useOfferDone } from "./offerDone"
import { EARLY_START, rhythmOffer } from "./offerRhythm"

const OPTS_TIME = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }

/**
 * Karşılama kapsülü (kart ve telefon çekmecesi aynı akıl): kapsül her zaman TYRO'nun yapabileceği
 * bir iş. Sıra: yakın toplantı ve günün ritmi (`rhythmOffer`: hazırlık, sabah, akşam, yarın) ›
 * günün okumasının eylemli önerisi (odak ayır, planla, izin aç) › brifingden öneri (`chatOffer`:
 * davet, önemli posta, gecikmiş iş, günün özeti). Tavsiye cümleleri ("Bu akşam erken dinlen.")
 * kapsüle çıkmaz; "dinlen" yerine yarına hazırlık önerilir. Ritim önerisinin `prompt`u sohbete gider,
 * `doneKey` basılınca bugün yapıldı sayılır (`offerDone`).
 */
export function useWelcomeOffer(story, brief) {
  const { t, locale } = useLocale()
  const done = useOfferDone()
  const { scene, calReady } = story
  const cue = story.offer
  const action = story.insight?.action ?? null
  return useMemo(() => {
    const now = new Date(scene.now)
    const meeting = calReady ? meetingLine(scene.events, scene.now) : null
    const tomorrowFirst = brief.nextMeetings?.[0]?.start ?? null
    const time = getDateTimeFormat(locale, OPTS_TIME)
    const build = ({ key, doneKey }) => {
      if (key === "prep") {
        const at = time.format(meeting.event.start)
        const title = shortTitle(meeting.event.subject || t("calendar.noSubject"))
        return {
          key,
          doneKey,
          text: t("insight.offer.prep", { time: at }),
          prompt: t("insight.offer.prepAsk", { title, time: at }),
        }
      }
      const prompt = {
        morning: t("insight.offer.morningAsk"),
        week: t("myspace.prompt.weekSummary"),
        dayWrap: t("myspace.prompt.daySummary"),
        weekWrap: t("insight.offer.weekWrapAsk"),
        tomorrow: t("insight.offer.tomorrowAsk"),
      }[key]
      return { key, doneKey, text: t(`insight.offer.${key === "dayWrap" ? "day" : key}`), prompt }
    }

    const weekday = now.getDay()
    const rhythm = rhythmOffer({
      now,
      weekend: weekday === 0 || weekday === 6,
      meeting,
      tomorrowFirst,
      done,
    })
    if (rhythm) return build(rhythm)
    // Günün okumasının önerisi yalnız bir eylemi varsa (odak bloğu, planlama, izin) kapsülde.
    if (cue && action) return cue
    // "Bu akşam erken dinlen." bir tavsiye: kapsül yarına hazırlığı önerir.
    const first = tomorrowFirst ? tomorrowFirst.getHours() * 60 + tomorrowFirst.getMinutes() : null
    if (cue?.key === "rest" && first != null && first <= EARLY_START && !done.has("tomorrow"))
      return build({ key: "tomorrow", doneKey: "tomorrow" })
    if (brief.loading) return null
    return chatOffer(brief.items, t)
  }, [scene, calReady, brief, cue, action, done, t, locale])
}
