import { Fragment, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { AnimatedCounter } from "@/components/common/AnimatedCounter"
import { BottomSheet } from "@/components/common/BottomSheet"
import { IconTile } from "@/features/selfservice/request/field/IconTile"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"

const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
const TILE =
  "relative min-w-0 rounded-2xl px-5 py-4 text-start transition-colors hover:bg-foreground/[0.03] [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:inset-y-4 [&:not(:first-child)]:before:start-0 [&:not(:first-child)]:before:w-px [&:not(:first-child)]:before:bg-border"

function Value({ s, locale }) {
  if (typeof s.value === "number") {
    return (
      <AnimatedCounter
        value={s.value}
        locale={locale}
        fallback={new Intl.NumberFormat(locale).format(s.value)}
      />
    )
  }
  return s.value ?? "—"
}

/**
 * Sakin özet şeridi (Güvenlik ve Self Servis'in dili): küçük büyük harfli ad, büyük değer, tek
 * soluk alt satır. Yalnız dikkat hâli renk alır. Her kutu bir kısayol. Telefonda tek satır özet;
 * dokununca alt çekmecede aynı satırlar.
 * İsteğe bağlı `icon` ve `tone`: adın önünde tonlu ikon kutusu.
 * @param {{ key: string, label: string, value: number|string, caption?: string, warn?: boolean, icon?: object, tone?: string }[]} p.stats
 */
export function RmKpiStrip({ stats, onPick, phone, label }) {
  const { locale } = useRmText()
  const [open, setOpen] = useState(false)
  const fmt = (s) =>
    typeof s.value === "number" ? new Intl.NumberFormat(locale).format(s.value) : s.value
  if (phone) {
    const ordered = [...stats.filter((s) => s.warn), ...stats.filter((s) => !s.warn)]
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={cn(
            "flex min-h-11 w-full items-center gap-2 rounded-xl bg-foreground/[0.028] px-4 text-start text-sm dark:bg-foreground/[0.05]",
            RING,
          )}
        >
          <span className="flex h-5 min-w-0 flex-1 flex-wrap gap-x-1.5 overflow-hidden leading-5 tabular-nums text-foreground/70">
            {ordered.map((s, i) => (
              <span key={s.key} className="whitespace-nowrap">
                {i > 0 && <span aria-hidden="true">· </span>}
                {s.label}{" "}
                <span className={cn(s.warn && "font-semibold text-warning-ink")}>{fmt(s)}</span>
              </span>
            ))}
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
            strokeWidth={1.8}
          />
        </button>
        <BottomSheet open={open} onOpenChange={setOpen} title={label} closeOnBack>
          <ul className="divide-y divide-border/60 rounded-2xl bg-muted/40 dark:bg-white/[0.04]">
            {stats.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onPick?.(s.key)
                  }}
                  className={cn("flex min-h-14 w-full items-center gap-3 px-4 text-start", RING)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">{s.label}</span>
                    {s.caption && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.caption}
                      </span>
                    )}
                    {s.hint && (
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground/80">
                        {s.hint}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-base font-semibold tabular-nums",
                      s.warn && "text-warning-ink",
                    )}
                  >
                    {fmt(s)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </BottomSheet>
      </>
    )
  }
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "grid min-w-0 rounded-2xl bg-foreground/[0.028] dark:bg-foreground/[0.05]",
        stats.length <= 4
          ? "grid-cols-2 @[36rem]/rm:grid-cols-4"
          : "grid-cols-3 @[60rem]/rm:grid-cols-6",
      )}
    >
      {stats.map((s) => {
        const tile = (
          <button type="button" onClick={() => onPick?.(s.key)} className={cn(TILE, RING)}>
            <span className="flex min-w-0 items-center gap-2">
              {s.icon ? (
                <IconTile icon={s.icon} tone={s.tone} size="xs" className="size-6 rounded-lg" />
              ) : null}
              <span
                lang={locale}
                className="block min-w-0 truncate text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-foreground/65"
              >
                {s.label}
              </span>
            </span>
            <span
              className={cn(
                "mt-1.5 block truncate text-[1.75rem] font-semibold leading-tight tabular-nums tracking-[-0.025em]",
                s.warn && "text-warning-ink",
              )}
            >
              <Value s={s} locale={locale} />
            </span>
            <span className="mt-1.5 block min-h-[1.125rem] truncate text-[0.75rem] text-foreground/65">
              {s.caption}
            </span>
          </button>
        )
        if (!s.hint) return <Fragment key={s.key}>{tile}</Fragment>
        return (
          <Tooltip key={s.key}>
            <TooltipTrigger asChild>{tile}</TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={8}
              className="max-w-[17rem] flex-col items-start gap-0 px-3 py-2.5"
            >
              <p className="text-[0.8125rem] font-semibold text-background">{s.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-background/80">{s.hint}</p>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
