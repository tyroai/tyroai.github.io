import "@/lib/i18n/selfService"
import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon"
import BridgeIcon from "@hugeicons/core-free-icons/BridgeIcon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { ymd } from "@/lib/leaveDays"

const OPTS_DATE = { day: "numeric", month: "long", weekday: "short" }

/**
 * Kartın bilgi satırları, önem sırasıyla (mini kart yalnız ilkini gösterir): sıradaki izin
 * (kayda gider) · köprü fırsatı (izin formunu o günle dolu açar) · sonraki
 * hak ediş (tahmin, Self Servis'teki kart). `days(n)`: "{n} gün" metni, `num`: dilin rakamları.
 */
export function leaveFacts(sum, { t, locale, days, num }) {
  const date = getDateTimeFormat(locale, OPTS_DATE)
  const out = []
  if (sum.next) {
    const { record, inDays } = sum.next
    const when =
      inDays === 1
        ? t("widgets.leave.tomorrow")
        : t("widgets.leave.inDays", { n: num.format(inDays) })
    out.push({
      key: "next",
      icon: Beach02Icon,
      label: t(
        record.statusKind === "pending" ? "widgets.leave.nextPending" : "widgets.leave.next",
      ),
      value: `${date.format(record.start)} · ${when}`,
      to: `/self-service?tab=leave&ref=${encodeURIComponent(record.id)}`,
    })
  }
  if (sum.bridge) {
    const { day, cost, block } = sum.bridge
    const gain = t(cost < 1 ? "selfService.leave.bridgeHalf" : "selfService.leave.bridgeOne", {
      n: num.format(block.days),
    })
    out.push({
      key: "bridge",
      icon: BridgeIcon,
      label: t("widgets.leave.bridge"),
      value: `${date.format(day)} · ${gain}`,
      to: `/self-service?new=leave&day=${ymd(day)}`,
    })
  }
  if (sum.accrual) {
    const { date: on, daysLeft, days: gained } = sum.accrual
    out.push({
      key: "accrual",
      icon: Calendar03Icon,
      label: `${t("selfService.accrual.title")} · ${t("selfService.accrual.estimated")}`,
      value: `${daysLeft === 0 ? t("selfService.accrual.today") : date.format(on)} · +${days(gained)}`,
      to: "/self-service",
    })
  }
  return out
}
