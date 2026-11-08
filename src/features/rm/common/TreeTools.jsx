import { HugeiconsIcon } from "@hugeicons/react"
import UnfoldLessIcon from "@hugeicons/core-free-icons/UnfoldLessIcon"
import UnfoldMoreIcon from "@hugeicons/core-free-icons/UnfoldMoreIcon"
import { SearchField as ToolbarSearch } from "@/components/common/SearchField"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"

// Araç çubuğu hapı (`docs/design-system.md` › Araç çubuğu standardı): `control` boyu, çerçevesiz gri kapsül.
const PILL =
  "inline-flex h-control shrink-0 items-center gap-1.5 rounded-full px-3 text-callout transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/** Arama kutusu (araç satırı) = ortak `SearchField`. */
export function SearchField({ value, onChange, label, className }) {
  return (
    <ToolbarSearch
      value={value}
      onChange={onChange}
      placeholder={label}
      className={cn("min-w-[11rem] flex-1 @[48rem]/rm:max-w-xs", className)}
    />
  )
}

/** Aç/kapa filtre hapı (ör. "Yalnız aşımdakiler"): seçilince marka tonunda. `tip`: neyi filtrelediği. */
export function TogglePill({ on, onClick, icon, label, tip }) {
  const pill = (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        PILL,
        on
          ? "bg-brand/[0.08] font-medium text-foreground"
          : "bg-muted text-foreground hover:bg-accent",
      )}
    >
      <HugeiconsIcon
        icon={icon}
        className={cn("size-4", on ? "text-brand" : "text-foreground/60")}
        strokeWidth={1.8}
      />
      {label}
    </button>
  )
  if (!tip) return pill
  return (
    <Tooltip>
      <TooltipTrigger asChild>{pill}</TooltipTrigger>
      <TipBody title={label} body={tip} />
    </Tooltip>
  )
}

/** İpucu balonu: kalın başlık ve bir iki cümle (KPI şeridiyle aynı dil). */
export function TipBody({ title, body }) {
  return (
    <TooltipContent
      side="bottom"
      sideOffset={8}
      className="max-w-[17rem] flex-col items-start gap-0 px-3 py-2.5"
    >
      {title ? <p className="text-[0.8125rem] font-semibold text-background">{title}</p> : null}
      <p className={cn("text-xs leading-relaxed text-background/80", title && "mt-1")}>{body}</p>
    </TooltipContent>
  )
}

/** Tüm grupları aç ya da daralt. */
export function ExpandAll({ allClosed, onClick }) {
  const { rt } = useRmText()
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        PILL,
        "bg-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <HugeiconsIcon
        icon={allClosed ? UnfoldMoreIcon : UnfoldLessIcon}
        className="size-4"
        strokeWidth={1.8}
      />
      {rt(allClosed ? "rm.tree.expandAll" : "rm.tree.collapseAll")}
    </button>
  )
}
