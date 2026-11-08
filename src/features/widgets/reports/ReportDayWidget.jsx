import { useMemo } from "react"
import News01Icon from "@hugeicons/core-free-icons/News01Icon"
import { useLocale } from "@/hooks/useLocale"
import { upcomingReports } from "@/lib/reportDay"
import { WidgetEmpty } from "../WidgetEmpty"
import { WidgetFrame } from "../WidgetFrame"
import { PageBody, Pager } from "../paging/Pager"
import { usePager } from "../paging/usePager"
import { ReportRow } from "./ReportRow"

/**
 * Rapor günü — piyasa raporlarının sıradaki yayını (WASDE, Crop Progress, ihracat satışları, COT,
 * FAO gıda endeksi; `data/marketReports`), kişinin saatiyle ve kalan süreyle; en yakın önce,
 * sayfada üç. Yayından sonra üç saat "Yayımlandı" der. Ağa çıkmaz: takvim pakette.
 */
export function ReportDayWidget({ ctx, className }) {
  const { now } = ctx
  const { t } = useLocale()
  const items = useMemo(() => upcomingReports(now), [now])
  const pager = usePager(items, 3)
  return (
    <WidgetFrame
      id="report-day"
      title={t("widgets.reports.title")}
      shortTitle={t("widgets.reports.titleShort")}
      icon={News01Icon}
      className={className}
      pager={<Pager pager={pager} label={t("widgets.reports.title")} />}
    >
      {items.length ? (
        <PageBody pager={pager} className="mt-2.5 space-y-0.5">
          {pager.items.map((item) => (
            <ReportRow key={item.report.id} item={item} now={now} />
          ))}
        </PageBody>
      ) : (
        <WidgetEmpty icon={News01Icon}>{t("widgets.reports.empty")}</WidgetEmpty>
      )}
    </WidgetFrame>
  )
}
