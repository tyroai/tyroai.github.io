import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat, getNumberFormat } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { PageBody } from "../paging/Pager"

const OPTS_DAY = { day: "numeric", month: "short", timeZone: "UTC" }
const SIGNED = { signDisplay: "exceptZero" }
const TREND = {
  up: "bg-success/10 text-success-ink",
  down: "bg-danger/10 text-danger-ink",
  flat: "bg-muted text-foreground/75",
}

/**
 * COT: her pazarda fonların net pozisyonu (uzun − kısa, kontrat) ve haftalık değişimi; ipucunda
 * uzun · kısa · açık pozisyon. Alt satırda verinin tarihi ve kaynak.
 */
export function CotView({ cot, pager }) {
  const { t, locale } = useLocale()
  const num = getNumberFormat(locale)
  const signed = getNumberFormat(locale, SIGNED)
  if (!cot.data)
    return (
      <p className="mt-3 text-[0.8125rem] leading-snug text-muted-foreground">
        {cot.loading ? t("widgets.trader.cotLoading") : t("widgets.trader.cotError")}
      </p>
    )
  return (
    <>
      <PageBody pager={pager} className="mt-2 grid gap-x-3 gap-y-1 @[26rem]/widget:grid-cols-2">
        {pager.items.map((m) => {
          const name = t(`widgets.trader.cot.${m.id}`)
          const trend = m.netChange > 0 ? "up" : m.netChange < 0 ? "down" : "flat"
          const detail = t("widgets.trader.cotDetail", {
            long: num.format(m.long),
            short: num.format(m.short),
            oi: num.format(m.oi ?? 0),
          })
          return (
            <li
              key={m.id}
              title={detail}
              className="flex h-8 min-w-0 items-center gap-2 rounded-lg px-1.5 transition-colors hover:bg-muted/60"
            >
              <span className="min-w-0 flex-1 truncate text-[0.75rem] text-muted-foreground">
                {name}
              </span>
              <span className="shrink-0 text-[0.8125rem] font-semibold tabular-nums">
                {signed.format(m.net)}
              </span>
              {/* Dar kartta (içerik < 16rem) hapta yalnız ok: sayıyla en dar kartta taşıyordu;
                  değişim ekran okuyucuda ve ipucunda. */}
              {m.netChange != null && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-flex h-5 shrink-0 items-center gap-0.5 rounded-md px-1 text-[0.6875rem] font-semibold tabular-nums",
                    TREND[trend],
                  )}
                >
                  <span>{trend === "up" ? "▲" : trend === "down" ? "▼" : "•"}</span>
                  <span className="@max-[16rem]/widget:hidden">
                    {num.format(Math.abs(m.netChange))}
                  </span>
                </span>
              )}
              <span className="sr-only">
                {t("widgets.trader.cotSr", {
                  name,
                  net: signed.format(m.net),
                  change: signed.format(m.netChange ?? 0),
                })}
                , {detail}
              </span>
            </li>
          )
        })}
      </PageBody>
      <p className="mt-auto truncate pt-2 text-[0.6875rem] text-muted-foreground">
        {t("widgets.trader.cotSource", {
          date: getDateTimeFormat(locale, OPTS_DAY).format(new Date(`${cot.data.asOf}T12:00:00Z`)),
        })}
      </p>
    </>
  )
}
