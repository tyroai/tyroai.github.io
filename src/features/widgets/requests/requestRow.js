import "@/lib/i18n/selfService"
import FileEditIcon from "@hugeicons/core-free-icons/FileEditIcon"
import { ALERT_LOOK, alertQuestion, alertSentence } from "@/features/selfservice/alerts/alertText"
import { money, tabOf } from "@/features/selfservice/kinds"
import { describe } from "@/features/selfservice/recordText"
import { requestTarget } from "@/features/widgets/lib/myRequests"
import { extraValue } from "@/lib/selfServiceFields"
import { ago } from "../format"

const numbersOf = (alert) => (alert.numbers ?? []).filter(Boolean).join(", ")

/**
 * Satırın görünüşü ve tek eylemi: `{ icon, tone, title, sub, action, to | ask }` — `to` Self
 * Servis'te bir yer (`requestTarget`), `ask` tyroOffice'e giden soru (Self Servis'teki uyarı
 * çipinin sorusu). Ton: `warning` iş bekliyor · `info` hatırlatma · `neutral` onayda.
 * Cümleler Self Servis'in uyarı metinleri (`alertText`), kayıt parçaları liste satırınınki.
 */
export function requestRow(item, { t, locale }) {
  const to = requestTarget(item)
  const open = t("widgets.requests.open")
  if (item.type === "returned")
    return {
      icon: ALERT_LOOK.returned.icon,
      tone: "warning",
      title: alertSentence(item.alert, t, locale),
      sub: numbersOf(item.alert),
      action: open,
      to,
    }
  if (item.type === "unsubmitted" || item.type === "unsettledAdvance") {
    const [one] = item.alert.records
    const balance = extraValue(one?.extra, "balance")
    // Tek avansta kalan tutar da: "AVN-1 · 15.000 ₺".
    const sub =
      item.type === "unsettledAdvance" && item.alert.count === 1 && balance != null
        ? `${one.number} · ${money(balance, one.currency, locale)}`
        : numbersOf(item.alert)
    return {
      icon: ALERT_LOOK[item.type].icon,
      tone: "warning",
      title: alertSentence(item.alert, t, locale),
      sub,
      action: t(`selfService.alert.action.${item.type}`),
      ask: alertQuestion(item.alert, t),
    }
  }
  if (item.type === "draft")
    return {
      icon: FileEditIcon,
      tone: "info",
      title: t(`widgets.requests.draft.${item.kind}`),
      sub: item.at ? t("widgets.requests.savedAt", { time: ago(item.at, locale) }) : "",
      action: t("widgets.requests.continue"),
      to,
    }
  if (item.type === "pending") {
    const d = describe(item.record, t, locale)
    return {
      icon: tabOf(item.kind).icon,
      tone: "neutral",
      title: t(`widgets.requests.pending.${item.kind}`),
      sub:
        item.kind === "leave"
          ? `${d.title} · ${d.sub}`
          : [item.record.number, d.value].filter(Boolean).join(" · "),
      action: open,
      to,
    }
  }
  return {
    icon: ALERT_LOOK.yearEnd.icon,
    tone: "info",
    title: alertSentence(item.alert, t, locale),
    sub: "",
    action: t("selfService.alert.action.yearEnd"),
    to,
  }
}
