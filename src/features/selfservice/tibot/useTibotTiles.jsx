import "@/lib/i18n/tibot"
import { useMemo } from "react"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Ticket01Icon from "@hugeicons/core-free-icons/Ticket01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import UserIcon from "@hugeicons/core-free-icons/UserIcon"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { buckets } from "@/lib/tibot/tibotModel"
import { tibotStats } from "@/lib/tibot/tibotStats"
import { number } from "../kinds"
import { MineBody, OnMeBody, TeamBody } from "./TibotTileBodies"
import { useTibotTile } from "./useTibotTile"

/**
 * Ticket sayfasının dört kutusu (`TileTray`): bende bekleyen · ekibimde · açtığım (listenin
 * okumasından, şu an) ve seçili dönemde kapanan (akışın `year` işlemi). Her kutunun ayrıntısı
 * kendi gövdesi (`tile.body`). `list`: `useTibotTickets` sonucu, `period`: dönemin adı.
 */
export function useTibotTiles(list, year, period) {
  const { t, locale } = useLocale()
  const now = useMinuteNow().getTime()
  const yearTile = useTibotTile(year, period)
  const { data, status } = list
  const stats = useMemo(() => tibotStats(data, now), [data, now])
  const team = useMemo(() => buckets(data, now).find((v) => v.id === "team"), [data, now])
  const loading = status === "loading"
  const n = (v) => number(v ?? 0, locale)
  const teamItems = team?.items ?? []
  const unclaimed = stats.unclaimed.count
  const tiles = [
    {
      tab: { id: "onMe", icon: Ticket01Icon },
      title: t("tibot.stat.onMe"),
      short: t("tibot.pt.onMe.short"),
      value: n(stats.onMe.count),
      caption: stats.onMe.late
        ? t("tibot.pt.onMe.late", { n: n(stats.onMe.late) })
        : t("tibot.pt.onMe.onTime"),
      loading,
      body: <OnMeBody stats={stats} now={now} />,
    },
    {
      tab: { id: "team", icon: UserGroupIcon },
      title: t("tibot.pt.team.title"),
      short: t("tibot.pt.team.short"),
      value: n(team?.count),
      caption: unclaimed
        ? t("tibot.pt.team.unclaimed", { n: n(unclaimed) })
        : t("tibot.pt.team.allClaimed"),
      loading,
      body: <TeamBody items={teamItems} />,
    },
    {
      tab: { id: "mine", icon: UserIcon },
      title: t("tibot.pt.mine.title"),
      short: t("tibot.pt.mine.short"),
      value: n(stats.waiting.count),
      caption: stats.waiting.needsMe
        ? t("tibot.pt.mine.needs", { n: n(stats.waiting.needsMe) })
        : t("tibot.pt.mine.none"),
      loading,
      body: <MineBody items={stats.waiting.items} now={now} />,
    },
    yearTile && {
      ...yearTile,
      tab: { id: "year", icon: CheckmarkCircle02Icon },
      title: t("tibot.pt.year.title", { year: period }),
      short: t("tibot.pt.year.short"),
    },
  ].filter(Boolean)
  return { tiles, period, off: {} }
}
