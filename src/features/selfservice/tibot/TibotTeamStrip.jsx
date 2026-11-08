import "@/lib/i18n/tibot"
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { FROST_BASE, SOFT_INK } from "../header/heroStyles"

// Self Servis'in dar kart şeridiyle (`HeroStatsBar`) aynı cam, boy (48 px) ve dokunma tepkisi.
const STRIP = "flex min-h-12 w-full min-w-0 items-center gap-3 rounded-2xl px-3.5 py-1.5 text-start"
const TAP =
  "transition hover:bg-white/10 active:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 group-data-[ink=dark]/herocard:hover:bg-white/30"

/** Ekiplerin tam listesi: grup adı ve altında birimleri ("GNL · SCM · AI"). */
function TeamList({ groups }) {
  return (
    <ul className="divide-y divide-border">
      {groups.map((g) => (
        <li key={g.label} className="flex min-w-0 items-center gap-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/[0.09] text-brand-ink">
            <HugeiconsIcon
              icon={UserGroupIcon}
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
          </span>
          <span className="min-w-0" title={g.names.join("\n")}>
            <span lang="tr" className="block truncate text-[0.875rem] font-semibold">
              {g.label}
            </span>
            {g.parts.length > 0 && (
              <span className="block truncate text-[0.75rem] text-muted-foreground">
                {g.parts.join(" · ")}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Dar kartta (telefon, tablet, dar pencere) Xurrent ekiplerin tek cam şeritte: grup adları tek
 * satırda (sığmayan kesilir), altında "Ticket ekiplerin", sağda ekip sayısı. Ayrı haplar telefonda
 * her biri bir satıra düşüp kartı uzatıyordu ve "+n"nin adları dokunmatikte görünmüyordu: şeride
 * basınca tam liste açılır — telefonda alttan çekmece, öteki ekranlarda şeridin altında pencere.
 */
export function TibotTeamStrip({ groups, count }) {
  const { t } = useLocale()
  const mobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const title = t("tibot.pt.teams")
  const face = (
    <>
      <HugeiconsIcon
        icon={UserGroupIcon}
        aria-hidden="true"
        className="size-4 shrink-0"
        strokeWidth={2}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span lang="tr" className="truncate text-[0.9375rem] font-semibold leading-tight">
          {groups.map((g) => g.label).join(" · ")}
        </span>
        <span className={cn("truncate text-[0.75rem] font-medium leading-tight", SOFT_INK)}>
          {title}
        </span>
      </span>
      <span className="rounded-full bg-white/25 px-1.5 text-[0.6875rem] tabular-nums group-data-[ink=dark]/herocard:bg-black/10">
        {count}
      </span>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        aria-hidden="true"
        className="size-3.5 shrink-0 opacity-80 rtl:rotate-180"
        strokeWidth={2.2}
      />
    </>
  )
  const look = cn(STRIP, FROST_BASE, TAP)

  if (mobile) {
    return (
      <>
        <button type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className={look}>
          {face}
        </button>
        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title={title}
          closeOnBack
          scrollLabel={title}
        >
          <TeamList groups={groups} />
        </BottomSheet>
      </>
    )
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={look}>
          {face}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label={title}
        className="w-[min(22rem,calc(100vw-2rem))] gap-0 p-2.5"
      >
        <p className="px-1 text-eyebrow text-muted-foreground">{title}</p>
        <TeamList groups={groups} />
      </PopoverContent>
    </Popover>
  )
}
