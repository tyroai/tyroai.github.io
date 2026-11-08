import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

const STEPS = ["s1", "s2", "s3", "s4"]

/**
 * "Ne olacak?"ın dört adımı, "Gönder"in yoluna göre (`via`): `"chat"` — talep sohbette TYRO'ya gider ·
 * bilgiler doğrulanır · onaylayınca ERP'ye işlenir · onay akışını ERP yürütür; `"erp"` (izin, masraf —
 * `features/selfservice/lib/erpDirectPolicy.js`) — doğrudan ERP'ye işlenir · yetki yoksa kendiliğinden TYRO'ya gider · onay
 * akışını ERP yürütür · durumu bu sayfada. `tone`: "dark" bildirimlerle aynı koyu cam kartta
 * (`NextStepsTip`), "light" açık kartta (masrafın ayrıntı kartı, `ExpenseDetails`).
 */
export function NextStepsList({ tone = "dark", className, via = "chat" }) {
  const { t, locale } = useLocale()
  const dark = tone === "dark"
  return (
    <ol className={cn("space-y-2.5", className)}>
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-start gap-3 text-[0.8125rem] leading-snug">
          <span
            aria-hidden="true"
            className={cn(
              "grid size-5 shrink-0 place-items-center rounded-full text-[0.6875rem] font-semibold tabular-nums",
              i === 0
                ? dark
                  ? "bg-white text-[oklch(0.19_0.02_250)]"
                  : "bg-brand-fill-deep text-brand-on-brand"
                : dark
                  ? "bg-white/[0.12] text-white/85"
                  : "bg-foreground/[0.08] text-foreground/75",
            )}
          >
            {(i + 1).toLocaleString(locale)}
          </span>
          <span
            className={
              i === 0
                ? dark
                  ? "text-white"
                  : "text-foreground"
                : dark
                  ? "text-white/80"
                  : "text-foreground/75"
            }
          >
            {t(`selfService.form.${via === "erp" ? "nextErp" : "next"}.${s}`)}
          </span>
        </li>
      ))}
    </ol>
  )
}
