import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { CBOT_LINKS } from "@/features/widgets/lib/market"
import { cn } from "@/lib/utils"

const PILL =
  "relative inline-flex h-6 items-center gap-0.5 rounded-full bg-muted/60 px-2 text-[0.6875rem] font-medium text-foreground/80 transition after:absolute after:inset-x-0 after:-inset-y-1 pointer-coarse:after:content-[''] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/**
 * Kartın dibi: CBOT vadelileri bağlantı (veri çekilemiyor) ve kaynak ya da "güncellenemedi". Dar
 * kartta iki eş hap: solda CBOT menüsü, sağda yenile ve saat (kaynak ipucunda; bayatsa saat uyarı
 * renginde) — başlıkta yenileye yer yok.
 */
export function MarketFooter({ narrow, source, stale, when, refreshing, onRefresh }) {
  const { t } = useLocale()
  const status = when
    ? t(stale ? "widgets.market.stale" : "widgets.market.updated", { time: when })
    : source
  return (
    <div className="mt-auto flex items-center justify-between gap-x-3 gap-y-1.5 pt-3 @[26rem]/widget:flex-wrap">
      {narrow ? (
        // Dar kartta üç bağlantı tek menüde: yan yana iki satıra taşıyor, kaynağı itiyordu.
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger aria-label={t("widgets.market.cbotMenu")} className={PILL}>
            {t("widgets.market.cbotShort")}
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {CBOT_LINKS.map((l) => (
              <DropdownMenuItem key={l.id} asChild className="pointer-coarse:min-h-11">
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {t(`widgets.market.cbotRow.${l.id}`)}
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    className="ms-auto size-3"
                    strokeWidth={2}
                  />
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[0.6875rem] text-muted-foreground">{t("widgets.market.cbot")}</span>
          {CBOT_LINKS.map((l) => (
            <a key={l.id} href={l.href} target="_blank" rel="noopener noreferrer" className={PILL}>
              {t(`widgets.market.cbotRow.${l.id}`)}
              <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3" strokeWidth={2} />
            </a>
          ))}
        </span>
      )}
      {narrow ? (
        <button
          type="button"
          onClick={onRefresh}
          aria-label={`${t("widgets.market.refresh")} · ${status}`}
          title={stale ? status : `${source} · ${status}`}
          className={cn(PILL, "gap-1 whitespace-nowrap tabular-nums", stale && "text-warning-ink")}
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            className={cn("size-3", refreshing && "animate-spin")}
            strokeWidth={2}
          />
          {when ?? "—"}
        </button>
      ) : (
        <span
          title={source}
          className={cn(
            "min-w-0 truncate text-[0.6875rem]",
            stale ? "text-warning-ink" : "text-muted-foreground",
          )}
        >
          {source}
        </span>
      )}
    </div>
  )
}
