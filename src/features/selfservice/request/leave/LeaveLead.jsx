import { useLocale } from "@/hooks/useLocale"
import { leaveWorkdays } from "@/lib/requestForm"
import { number } from "../../kinds"

/**
 * Masaüstü alt şeridin solu (izin): "3,5 iş günü · 11 → 7,5" (yıllık izinde bakiye önce → sonra);
 * tarih yokken "Tarihleri seç". Ayrıntısı etki kartında.
 */
export function LeaveLead({ values, balance }) {
  const { t, locale } = useLocale()
  const days = leaveWorkdays(values.start, values.end)
  const remain = values.kind === "annual" ? (balance?.remain ?? null) : null
  return (
    <p
      aria-live="polite"
      className="min-w-0 flex-1 truncate text-[0.8125rem] text-muted-foreground tabular-nums"
    >
      {days == null ? (
        t("selfService.leave.pickDates")
      ) : (
        <>
          <span className="font-semibold text-foreground">
            {number(days, locale)} {t("selfService.form.workdays")}
          </span>
          {remain != null && ` · ${number(remain, locale)} → ${number(remain - days, locale)}`}
        </>
      )}
    </p>
  )
}
