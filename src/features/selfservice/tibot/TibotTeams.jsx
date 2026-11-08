import "@/lib/i18n/tibot"
import { HugeiconsIcon } from "@hugeicons/react"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { useLocale } from "@/hooks/useLocale"
import { groupTeams } from "@/lib/tibot/teamGroups"
import { cn } from "@/lib/utils"
import { FROST_BASE } from "../header/heroStyles"
import { TibotTeamStrip } from "./TibotTeamStrip"

// Kişi kartının cam hapı (`HeroPeople` ile aynı ölçü); bilgi, düğme değil: üstüne gelince değişmez.
const PILL =
  "inline-flex min-h-9 min-w-0 items-center gap-2 rounded-full px-3 text-[0.8125rem] font-semibold pointer-coarse:min-h-11"
const MAX = 3

/**
 * Tibotlar sayfasında kişi kartının alt şeridi: Xurrent'te üyesi olduğun ekipler (akışın `list`
 * cevabı, `teams`) cam haplar hâlinde — yöneticin yerine, bu sayfada önemli olan hangi ekiplerin
 * taleplerini gördüğün. Aynı öneki paylaşanlar tek hapta ("Kurumsal Sistemler · GNL · SCM");
 * ilk üç hap, fazlası "+n" (adlar ipucunda). `compact` (dar kart: telefon, tablet, dar pencere):
 * haplar yerine tek cam şerit, basınca tam liste (`TibotTeamStrip`).
 */
export function TibotTeams({ teams, loading, compact = false }) {
  const { t } = useLocale()
  if (loading && compact)
    return <span aria-hidden="true" className="block h-12 w-full rounded-2xl bg-white/20" />
  if (loading)
    return (
      <div aria-hidden="true" className="flex min-w-0 flex-wrap gap-2">
        <span className="block h-9 w-44 rounded-full bg-white/20" />
        <span className="block h-9 w-32 rounded-full bg-white/20" />
      </div>
    )
  const groups = groupTeams(teams ?? [])
  if (!groups.length) return null
  if (compact) return <TibotTeamStrip groups={groups} count={teams.length} />
  const shown = groups.slice(0, MAX)
  const rest = groups.slice(MAX).flatMap((g) => g.names)
  return (
    <ul aria-label={t("tibot.pt.teams")} className="flex min-w-0 flex-wrap items-center gap-2">
      {shown.map((g) => (
        <li key={g.label} className="min-w-0">
          <span title={g.names.join("\n")} className={cn(PILL, FROST_BASE, "max-w-full")}>
            <HugeiconsIcon
              icon={UserGroupIcon}
              aria-hidden="true"
              className="size-4 shrink-0"
              strokeWidth={2}
            />
            <span className="truncate" lang="tr">
              {g.label}
              {g.parts.length > 0 && (
                <span className="font-medium opacity-80"> · {g.parts.join(" · ")}</span>
              )}
            </span>
          </span>
        </li>
      ))}
      {rest.length > 0 && (
        <li>
          <span
            title={rest.join("\n")}
            aria-label={t("tibot.pt.teamsMore", { n: rest.length })}
            className={cn(PILL, FROST_BASE, "tabular-nums")}
          >
            +{rest.length}
          </span>
        </li>
      )}
    </ul>
  )
}
