import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { TaskCheck } from "@/features/todo/TaskCheck"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { countdown, paceOf, stepsProgress } from "@/lib/horizon"
import { cn } from "@/lib/utils"
import { DateTile } from "./DateTile"
import { countdownPhrase, longDate } from "./horizonFormat"
import { PaceChip } from "./PaceChip"
import { StepAdd } from "./StepAdd"

const PHRASE = {
  late: "text-danger-ink",
  next: "text-brand-ink",
  done: "text-success-ink",
  base: "text-muted-foreground",
}

/**
 * Hedefin ayrıntısı: büyük tarih karosu, kalan süre, tempo ("Yolunda" · "Riskte", nedeniyle — `paceOf`)
 * ve tam tarih, not, adımlar (işaretlenir, yenisi eklenir — `StepAdd`), "Tamamlandı" ve "To Do'da
 * aç". Değişiklik hemen kartta görünür, To Do'ya yazılır.
 */
export default function HorizonDetail({ item, today, tone, horizon, canOpenTodo, onClose }) {
  const { t, locale } = useLocale()
  const mobile = useIsMobile()
  const cd = countdown(today, item.dueKey)
  const progress = stepsProgress(item.steps)
  const pace = paceOf(item, today)
  const share = progress ? Math.round((progress.done / progress.total) * 100) : 0
  // Yeni adım eklenince liste sona kayar (açılışta değil): eklenen görünsün.
  const list = useRef(null)
  const count = useRef(item.steps?.length ?? 0)
  useEffect(() => {
    const n = item.steps?.length ?? 0
    if (n > count.current && list.current) list.current.scrollTop = list.current.scrollHeight
    count.current = n
  }, [item.steps?.length])
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3.5">
        <DateTile dueKey={item.dueKey} tone={tone} size="lg" />
        <div className="min-w-0">
          {!mobile && (
            <p className="line-clamp-2 text-[1rem] leading-snug font-semibold">{item.title}</p>
          )}
          <p className="truncate text-[0.75rem] text-muted-foreground">{item.listName}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] font-semibold">
            <span className={PHRASE[tone]}>
              {item.done ? t("widgets.horizon.doneState") : countdownPhrase(cd, t, locale)}
            </span>
            <PaceChip pace={pace} />
          </p>
          <p className="text-[0.75rem] text-muted-foreground [&::first-letter]:uppercase">
            {longDate(item.dueKey, locale)}
          </p>
        </div>
      </div>

      {item.note && (
        <p className="line-clamp-3 rounded-xl bg-foreground/[0.04] px-3 py-2 text-[0.8125rem] leading-relaxed whitespace-pre-line text-foreground/85">
          {item.note}
        </p>
      )}

      <section aria-label={t("widgets.horizon.stepsTitle")}>
        <div className="flex items-center justify-between text-[0.75rem]">
          <span className="font-medium text-muted-foreground">
            {t("widgets.horizon.stepsTitle")}
          </span>
          {progress && (
            <span className="font-semibold tabular-nums">
              {progress.done}/{progress.total}
            </span>
          )}
        </div>
        {progress && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.done}
            aria-label={t("widgets.horizon.steps", progress)}
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]"
          >
            <span
              className="block h-full rounded-full bg-gradient-to-r from-brand-from via-brand-via to-brand-to transition-[width] duration-500"
              style={{ width: `${share}%` }}
            />
          </div>
        )}
        {pace?.kind === "risk" && (
          <p className="mt-1.5 text-[0.75rem] text-warning-ink">
            {t(`widgets.horizon.pace.why.${pace.why}`)}
          </p>
        )}
        {progress && (
          <ul ref={list} className="mt-2 max-h-48 overflow-y-auto">
            {item.steps.map((s) => (
              <li key={s.id} className="flex min-h-9 items-center gap-2.5 pointer-coarse:min-h-11">
                <TaskCheck
                  size="sm"
                  done={s.done}
                  pending={item.pending || s.pending}
                  label={s.title}
                  onToggle={() => horizon.toggleStep(item, s)}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 text-[0.8125rem] leading-snug",
                    s.done && "text-muted-foreground line-through decoration-foreground/30",
                  )}
                >
                  {s.title}
                </span>
              </li>
            ))}
          </ul>
        )}
        {!item.done && (
          <StepAdd disabled={item.pending} onAdd={(text) => horizon.addStep(item, text)} />
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={item.done}
          disabled={item.pending}
          onClick={() => {
            horizon.setDone(item, !item.done)
            if (!item.done) onClose()
          }}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[0.8125rem] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50 pointer-coarse:h-11",
            item.done
              ? "bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.1]"
              : "bg-brand-solid text-brand-on-brand hover:opacity-90",
          )}
        >
          <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2.4} />
          {item.done ? t("widgets.horizon.reopen") : t("widgets.horizon.markDone")}
        </button>
        {canOpenTodo && (
          <Link
            to={`/todo?view=${encodeURIComponent(`list:${item.listId}`)}&task=${encodeURIComponent(item.id)}`}
            onClick={onClose}
            className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[0.8125rem] font-medium text-muted-foreground transition outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
          >
            {t("widgets.horizon.openTodo")}
            <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3.5" strokeWidth={2} />
          </Link>
        )}
      </div>
    </div>
  )
}
