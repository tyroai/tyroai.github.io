import { lazy, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { WidgetOverlay } from "../WidgetOverlay"
import { releaseChip, whenText } from "./reportFormat"

const ReportDetail = lazy(() => import("./ReportDetail"))

// Bugün ve yarın marka tonunda, yayımlandıysa yeşil; uzak tarih sakin.
const TONE = {
  done: "bg-success/10 text-success-ink",
  today: "bg-brand/[0.08] text-brand",
  soon: "bg-brand/[0.08] text-brand",
  later: "bg-muted text-foreground/75",
}

/** Raporun sıradaki yayını: ad, kişinin saatiyle gün ve saat, kalan süre hapı; basınca ayrıntı. */
export function ReportRow({ item, now }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)
  const { report, release } = item
  const name = t(`widgets.reports.name.${report.id}`)
  const chip = releaseChip(item, now, t, locale)
  const trigger = (
    <button
      type="button"
      className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center gap-2.5 rounded-xl px-2 text-start transition outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-brand/40 aria-expanded:bg-accent"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8125rem] font-medium">{name}</span>
        <span className="block truncate text-[0.6875rem] text-muted-foreground [&::first-letter]:uppercase">
          {/* Dar kartta (içerik < 16rem) haftanın günü düşer: saat kesiliyordu. */}
          <span className="@max-[16rem]/widget:hidden">
            {whenText(release, Boolean(report.time), locale)}
          </span>
          <span className="hidden @max-[16rem]/widget:inline">
            {whenText(release, Boolean(report.time), locale, false)}
          </span>
        </span>
      </span>
      <span
        className={cn(
          "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[0.6875rem] font-semibold tabular-nums",
          TONE[chip.tone],
        )}
      >
        <span aria-hidden="true">{chip.text}</span>
        <span className="sr-only">{chip.sr}</span>
      </span>
    </button>
  )
  return (
    <li>
      <WidgetOverlay
        trigger={trigger}
        title={name}
        open={open}
        onOpenChange={setOpen}
        align="start"
      >
        <ReportDetail report={report} now={now} />
      </WidgetOverlay>
    </li>
  )
}
