import { useLocale } from "@/hooks/useLocale"
import { TeamBadge } from "./CalendarDay"

/** Takvimin lejantı; "Ekip izinde" yalnız görünen aylarda işaret varsa. */
export function CalendarLegend({ team }) {
  const { t } = useLocale()
  return (
    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-ink" />
        {t("selfService.leave.legend.holiday")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-[linear-gradient(90deg,var(--brand-ink)_50%,transparent_50%)] ring-1 ring-brand-ink/40"
        />
        {t("selfService.leave.legend.eve")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="w-4 border-b-2 border-foreground/60" />
        {t("selfService.leave.legend.mine")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="w-4 border-b-2 border-dashed border-foreground/45" />
        {t("selfService.leave.legend.pending")}
      </span>
      {team && (
        <span data-tour="req-team" className="inline-flex items-center gap-1.5">
          <TeamBadge className="relative">2</TeamBadge>
          {t("selfService.leave.legend.team")}
        </span>
      )}
    </p>
  )
}
