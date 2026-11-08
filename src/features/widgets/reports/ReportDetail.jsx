import { useState } from "react"
import { useMsal } from "@azure/msal-react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { notify } from "@/lib/notify"
import { addReleaseToCalendar, nextReleases } from "@/lib/reportDay"
import { cn } from "@/lib/utils"
import { whenText } from "./reportFormat"
import { useAddedReleases } from "./useAddedReleases"

const HEAD = "text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-foreground/60"
const PILL =
  "inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[0.75rem] font-medium transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60"

/**
 * Raporun ayrıntısı: ne olduğu, sıradaki üç yayın (kişinin saatiyle; kaynağın ABD saati yanında),
 * "Takvime ekle" (sıradaki yayın; "boş" görünür, 15 dk önce hatırlatır — eklendiyse "Takvimde")
 * ve "Raporu aç".
 */
export default function ReportDetail({ report, now }) {
  const { t, locale } = useLocale()
  const { instance, accounts } = useMsal()
  const added = useAddedReleases()
  const [busy, setBusy] = useState(false)
  const timed = Boolean(report.time)
  const next = nextReleases(report, now, 3)
  const first = next[0] ?? null
  const key = first ? `${report.id}:${first.key}` : null
  const name = t(`widgets.reports.name.${report.id}`)
  const full = t(`widgets.reports.full.${report.id}`)

  async function add() {
    setBusy(true)
    const res = await addReleaseToCalendar(instance, accounts[0] ?? null, {
      subject: `${name} — ${full}`,
      release: first,
      timed,
      url: report.url,
    })
    setBusy(false)
    if (res.status !== STATUS.ready) return notify.error(t("widgets.reports.addFailed"))
    added.mark(key)
    notify.success(t("widgets.reports.addedToast", { name }))
  }

  return (
    <div className="flex flex-col gap-3.5 p-4 pt-2">
      <p className="text-[0.8125rem] leading-snug text-muted-foreground">{full}</p>
      {next.length > 0 && (
        <section>
          <h4 className={HEAD}>{t("widgets.reports.next")}</h4>
          <ul className="mt-1.5 space-y-1">
            {next.map((r) => (
              <li
                key={r.key}
                className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2 text-[0.8125rem] tabular-nums"
              >
                <span className="[&::first-letter]:uppercase">{whenText(r, timed, locale)}</span>
                {timed && (
                  <span className="shrink-0 text-[0.6875rem] text-muted-foreground">
                    {t("widgets.reports.sourceTime", { time: report.time })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="flex flex-wrap gap-1.5">
        {first &&
          (added.has(key) ? (
            <span className={cn(PILL, "border-transparent bg-brand/10 text-brand-ink")}>
              <HugeiconsIcon
                icon={Tick02Icon}
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={2}
              />
              {t("widgets.reports.added")}
            </span>
          ) : (
            <button type="button" onClick={add} disabled={busy} className={PILL}>
              <HugeiconsIcon
                icon={CalendarAdd01Icon}
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.9}
              />
              {t("widgets.reports.addToCalendar")}
            </button>
          ))}
        <a href={report.url} target="_blank" rel="noopener noreferrer" className={PILL}>
          {t("widgets.reports.open")}
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            aria-hidden="true"
            className="size-3"
            strokeWidth={2}
          />
        </a>
      </div>
    </div>
  )
}
