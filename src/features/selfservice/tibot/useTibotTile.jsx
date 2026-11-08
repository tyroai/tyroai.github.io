import "@/lib/i18n/tibot"
import { useEffect, useState } from "react"
import Ticket01Icon from "@hugeicons/core-free-icons/Ticket01Icon"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useLocale } from "@/hooks/useLocale"
import { loadTickets, loadYear, onTicketsRefresh, peekYear } from "@/lib/tibot/tibotApi"
import { number } from "../kinds"
import { TibotTileBody } from "./TibotTileBody"

const TAB = Object.freeze({ id: "tibot", icon: Ticket01Icon })

/**
 * Ticket sayfasının yıl kutusu (yalnız kitlede, `pageAccess.tibot`): seçili
 * dönemde KAPATTIĞIN talepler (BT çalışanı) ya da kapattığın yoksa AÇTIĞINDAN KAPANAN (talep eden,
 * ör. satınalmacı). Alt satır atanan ve açtığın; ayrıntı kartı hepsini oranlarıyla verir
 * (`TibotTileBody`). Veri akışın `year` işlemi (5 dk bellek, sayfanın Yenile'si tazeler). `period`:
 * kutu adındaki dönem ("2026" · "Tüm yıllar"), `year`: sayı ya da `null`.
 */
export function useTibotTile(year, period) {
  const { t, locale } = useLocale()
  const allowed = usePageAccess().tibot
  const [state, setState] = useState({ key: null })
  const key = String(year ?? "all")
  // Tek Yenile (`refreshTickets`) yıl belleğini de boşaltır: sayılar yeniden okunur.
  const [nonce, setNonce] = useState(0)
  useEffect(
    () =>
      onTicketsRefresh(() => {
        setNonce((n) => n + 1)
        return Promise.resolve()
      }),
    [],
  )
  useEffect(() => {
    if (!allowed) return undefined
    let live = true
    // Ayrıntıdaki "şu an bende bekleyen" satırı için liste de (5 dk bellek; header yüzüyle ortak).
    loadTickets().catch(() => {})
    loadYear(year ?? null)
      .then((d) => live && setState({ key, data: d }))
      .catch(() => live && setState({ key, failed: true }))
    return () => {
      live = false
    }
  }, [allowed, year, key, nonce])
  if (!allowed) return null
  const data = state.key === key ? state.data : peekYear(year ?? null)
  const failed = state.key === key && state.failed
  const n = (v) => number(v ?? 0, locale)
  const staff = (data?.closed ?? 0) > 0 || (data?.assigned ?? 0) > 0
  const value = !data ? "—" : staff ? n(data.closed) : `${n(data.openedClosed)}/${n(data.opened)}`
  return {
    tab: TAB,
    title: t("tibot.tile.title", { year: period }),
    short: t("tibot.tile.short"),
    value,
    caption: failed
      ? t("tibot.failed")
      : !data
        ? null
        : staff
          ? t("tibot.tile.staffCaption", { assigned: n(data.assigned), opened: n(data.opened) })
          : t("tibot.tile.requesterCaption"),
    loading: !data && !failed,
    body: <TibotTileBody data={data} failed={failed} period={period} />,
  }
}
