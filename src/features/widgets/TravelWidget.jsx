import { useMemo } from "react"
import AirplaneTakeOff01Icon from "@hugeicons/core-free-icons/AirplaneTakeOff01Icon"
import { useLocale } from "@/hooks/useLocale"
import { upcomingTrips } from "@/lib/travel"
import { WidgetEmpty } from "./WidgetEmpty"
import { WidgetFrame } from "./WidgetFrame"
import { PageBody, Pager } from "./paging/Pager"
import { usePager } from "./paging/usePager"
import { TripRow } from "./travel/TripRow"

/**
 * Seyahatim — önümüzdeki üç haftanın yolculukları (takvimde "seyahat",
 * "uçuş", "ziyaret", "fuar"… geçen ya da birden çok güne yayılan etkinlikler):
 * tarih, yer; varış şehri tanınırsa oranın saati (fark varsa) ve havası, basınca
 * ayrıntı (`travel/TripRow` · `TripDetail`).
 */
export function TravelWidget({ ctx, className }) {
  const { cal, now } = ctx
  const { t } = useLocale()
  const trips = useMemo(() => upcomingTrips(cal.events, now), [cal.events, now])
  const pager = usePager(trips, 2)
  return (
    <WidgetFrame
      id="travel"
      title={t("widgets.travel.title")}
      icon={AirplaneTakeOff01Icon}
      busy={cal.status === "loading"}
      className={className}
      pager={<Pager pager={pager} label={t("widgets.travel.title")} />}
    >
      {cal.status === "loading" ? (
        <span aria-hidden="true" className="ms-skeleton mt-3 block h-12 rounded-2xl" />
      ) : trips.length ? (
        <PageBody pager={pager} className="mt-3 space-y-1.5">
          {pager.items.map((trip) => (
            <TripRow key={trip.id} trip={trip} now={now} />
          ))}
        </PageBody>
      ) : (
        <WidgetEmpty icon={AirplaneTakeOff01Icon} hint={t("widgets.travel.hint")}>
          {t("widgets.travel.none")}
        </WidgetEmpty>
      )}
    </WidgetFrame>
  )
}
