import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Download04Icon from "@hugeicons/core-free-icons/Download04Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"
import { GHOST, ICON } from "../chips"
import { countText } from "../kinds"
import { updatedText } from "./updatedText"

// Sohbet rıhtımı pencerede Escape dinliyor: menüyü kapatan Escape rıhtımı kapatmasın.
const stopEscape = (e) => e.stopPropagation()
// Kısa menüler kipsiz (`modal={false}`): sayfa `aria-hidden` olmaz, içinde odaklanabilir öğe
// kalan gizli bölge doğmaz; odak yine menüde başlar, Escape ve dışarı dokunuş kapatır.
const ITEM = "min-h-9 text-[0.8125rem] pointer-coarse:min-h-11"

/**
 * Telefonun dönem seçicisi — tek kompakt düğme (takvim ikonu + "2026 ▾"), açılınca yıllar +
 * Tümü. Seçili dönem özeti, sekme sayılarını, raporu ve listeyi süzer (genişte `PeriodBar`).
 */
export function PeriodMenu({ years, year, onYear }) {
  const { t } = useLocale()
  // Yatay telefonda düğmenin altında yer yok (44 px'lik seçenekler kayardı): menü yanına açılır.
  const short = useMediaQuery("(max-height: 500px)")
  const all = t("selfService.allYears")
  const current = year ?? all
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("selfService.periodValue", { value: current })}
          className="-ms-2 inline-flex h-9 min-w-0 items-center gap-1.5 rounded-full px-2 text-[0.9375rem] font-semibold tabular-nums text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11 data-[state=open]:bg-accent"
        >
          <HugeiconsIcon
            icon={Calendar03Icon}
            aria-hidden="true"
            className="size-4 text-muted-foreground"
            strokeWidth={1.9}
          />
          {current}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            aria-hidden="true"
            className="size-3.5 text-muted-foreground"
            strokeWidth={2}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={short ? "right" : "bottom"}
        align="start"
        className="w-44"
        onEscapeKeyDown={stopEscape}
      >
        <DropdownMenuLabel>{t("selfService.period")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(year ?? "all")}
          onValueChange={(v) => onYear(v === "all" ? null : Number(v))}
        >
          {[...years, null].map((y) => (
            <DropdownMenuRadioItem
              key={y ?? "all"}
              value={String(y ?? "all")}
              className={cn(ITEM, "tabular-nums")}
            >
              {y ?? all}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Telefonun "⋯" menüsü: Yenile (son okuma saatiyle) ve Dışa aktar (süzülmüş listenin CSV'si).
 * Yenilerken tetik dönen ikon olur (`aria-busy`): menü kapansa da iş sürdüğü görünsün.
 */
export function ToolsMenu({ updatedAt, onRefresh, busy, onExport, exportCount }) {
  const { t, locale } = useLocale()
  const updated = updatedText(updatedAt, locale)
  const count = exportCount ?? 0
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("selfService.more")}
          aria-busy={busy || undefined}
          className={cn(GHOST, ICON, "-me-2 data-[state=open]:bg-accent")}
        >
          <HugeiconsIcon
            icon={busy ? RefreshIcon : MoreHorizontalIcon}
            className={cn(busy && "animate-spin motion-reduce:animate-none")}
            strokeWidth={1.9}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" onEscapeKeyDown={stopEscape}>
        <DropdownMenuItem onSelect={onRefresh} className={ITEM}>
          <HugeiconsIcon icon={RefreshIcon} aria-hidden="true" className="size-4" />
          <span className="min-w-0">
            <span className="block">{t("selfService.refresh")}</span>
            {updated && (
              <span className="block text-[0.6875rem] text-muted-foreground">
                {t("selfService.updated", { time: updated })}
              </span>
            )}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExport} disabled={!count} className={ITEM}>
          <HugeiconsIcon icon={Download04Icon} aria-hidden="true" className="size-4" />
          <span className="min-w-0">
            <span className="block">{t("selfService.export.label")}</span>
            <span className="block text-[0.6875rem] text-muted-foreground">
              {t("selfService.export.csv")} ·{" "}
              {countText(t, locale, "selfService.list.count", count)}
            </span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
