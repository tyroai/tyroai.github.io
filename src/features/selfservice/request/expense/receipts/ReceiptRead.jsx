import { HugeiconsIcon } from "@hugeicons/react"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import MagicWand01Icon from "@hugeicons/core-free-icons/MagicWand01Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { countText, number } from "../../../kinds"
import { ActionTip } from "../../field/ActionTip"

const BAD = new Set(["failed", "unreadable", "not_receipt", "multiple"])

/**
 * "Fişlerden doldur" (değnek): okunmamış fiş varken; okurken "Okunuyor 2/5" ve dönen simge. Dar
 * şeritte yalnız simge (adı balonda ve ekran okuyucuda). Sonuç düğmenin yanında kısa satır:
 * "3 fiş okundu · 1 okunamadı" (canlı bölge).
 */
export function ReceiptRead({ reading, list }) {
  const { t, locale } = useLocale()
  const { run, unread, start, status } = reading
  const ok = list.filter((r) => status[r.id]?.status === "done").length
  const bad = list.filter((r) => BAD.has(status[r.id]?.status)).length
  const busy = Boolean(run)
  const label = busy
    ? t("selfService.expense.read.busy", {
        done: number(run.done, locale),
        total: number(run.total, locale),
      })
    : t("selfService.expense.read.button")
  return (
    <div className="flex min-w-0 items-center gap-2">
      <p
        aria-live="polite"
        // Dar şeritte görünmez ama ekran okuyucu sonucu yine duyar.
        className="sr-only min-w-0 truncate text-[0.75rem] @[30rem]/rcpt:not-sr-only @[30rem]/rcpt:block"
      >
        {!busy && ok > 0 && (
          <span className="text-success-ink">
            {countText(t, locale, "selfService.expense.read.done", ok)}
          </span>
        )}
        {!busy && ok > 0 && bad > 0 && <span className="text-muted-foreground"> · </span>}
        {!busy && bad > 0 && (
          <span className="text-warning-ink">
            {countText(t, locale, "selfService.expense.read.failed", bad)}
          </span>
        )}
      </p>
      {(busy || unread > 0) && (
        <ActionTip label={t("selfService.expense.read.tip")}>
          <button
            type="button"
            onClick={start}
            aria-disabled={busy || undefined}
            aria-label={
              busy ? label : t("selfService.expense.read.label", { n: number(unread, locale) })
            }
            className={cn(
              "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand/[0.1] px-3 text-[0.8125rem] font-semibold text-brand-ink transition hover:bg-brand/[0.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 aria-disabled:cursor-progress pointer-coarse:h-11 pointer-coarse:px-3.5",
            )}
          >
            <HugeiconsIcon
              icon={busy ? Loading03Icon : MagicWand01Icon}
              aria-hidden="true"
              className={cn("size-4 shrink-0", busy && "animate-spin motion-reduce:animate-none")}
              strokeWidth={1.9}
            />
            <span className="hidden whitespace-nowrap tabular-nums @[30rem]/rcpt:inline">
              {label}
            </span>
          </button>
        </ActionTip>
      )}
    </div>
  )
}
