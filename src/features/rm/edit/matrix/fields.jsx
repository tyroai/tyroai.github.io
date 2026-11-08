import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { hasDates } from "@/features/rm/lib/edit/assign"
import { num } from "@/features/rm/lib/format"
import { cn } from "@/lib/utils"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"

export const FIELD =
  "h-10 sm:h-10 sm:text-sm tabular-nums pointer-coarse:h-11 sm:pointer-coarse:h-11"
const NONE = "__none"

export function Labeled({ id, label, children, className }) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={id} id={`${id}-label`} className="text-[0.8125rem] font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

/** Proje seçimi: tarihi eksik proje seçilemez; kişinin ekibinde olduğu projeye ✓. */
export function ProjectSelect({ id, value, onChange, exclude, rid }) {
  const { rt } = useRmText()
  const { data } = useRm()
  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger
        id={id}
        className="w-full text-sm data-[size=default]:h-10 pointer-coarse:data-[size=default]:h-11"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{rt("rm.sched.pickProject")}</SelectItem>
        {data.st.projects
          .filter((p) => p.id !== exclude)
          .map((p) => (
            <SelectItem key={p.id} value={p.id} disabled={!hasDates(p)}>
              {p.code} – {p.name}
              {hasDates(p) ? "" : ` (${rt("rm.sched.noDates")})`}
              {rid && (p.team || []).some((x) => x.rid === rid) ? " ✓" : ""}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}

/** Günlük saat ve hızlı seçimler (şartname: 0 1 2 3 4 5 6 8). */
export function HoursField({ id, value, onChange, quick = [0, 1, 2, 3, 4, 5, 6, 8], min = 0 }) {
  const { rt } = useRmText()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={24}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FIELD, "w-24")}
      />
      <div role="group" aria-label={rt("rm.sched.quick")} className="flex flex-wrap gap-1">
        {quick.map((h) => (
          <button
            key={h}
            type="button"
            aria-pressed={String(h) === String(value)}
            onClick={() => onChange(String(h))}
            className={cn(
              "h-8 min-w-9 rounded-lg px-2 text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11 pointer-coarse:min-w-11",
              String(h) === String(value)
                ? "bg-foreground text-background"
                : "text-muted-foreground ring-1 ring-inset ring-border hover:text-foreground",
            )}
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Ön izleme: toplam saat ve kapasite durumu; aşımda "N s yap" önerisi. */
export function LoadLine({ text, ot, dd, peak, suggest, onSuggest }) {
  const { rt, locale } = useRmText()
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid gap-2 rounded-xl bg-foreground/[0.035] px-3.5 py-3 text-[0.8125rem] dark:bg-white/[0.05]"
    >
      <span className="tabular-nums">{text}</span>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex h-6 items-center gap-1 rounded-full px-2 text-[0.6875rem] font-medium",
            ot ? "bg-danger/10 text-danger-ink" : "bg-success/12 text-success-ink",
          )}
        >
          <HugeiconsIcon
            icon={ot ? Alert02Icon : CheckmarkCircle02Icon}
            className="size-3.5"
            strokeWidth={2}
          />
          {ot
            ? peak != null
              ? rt("rm.sched.overPeak", { d: dd, h: num(ot, locale), p: num(peak, locale) })
              : rt("rm.sched.over", { d: dd, h: num(ot, locale) })
            : rt("rm.sched.fits")}
        </span>
        {ot && onSuggest ? (
          <button
            type="button"
            onClick={onSuggest}
            className="h-8 rounded-lg border border-border/80 px-2.5 text-xs font-medium hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
          >
            {rt("rm.sched.suggest", { h: suggest })}
          </button>
        ) : null}
      </div>
    </div>
  )
}
