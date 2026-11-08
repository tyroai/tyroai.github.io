import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import { useLocale } from "@/hooks/useLocale"
import { advanceInsights } from "@/features/selfservice/lib/advanceInsights"
import { locationLabel } from "@/lib/advanceLocations"
import { formatMoney } from "@/lib/amountParse"
import { capFirst } from "../formUi"

/**
 * Masaüstü alt şeridin solu (avans): "₺15.000,00 · Müşteri Ziyareti · İzmir"; tutar yokken
 * "Tutarı yaz". Eksik kalmadıysa başında yeşil ✓ (gönderime hazır; adı ekran okuyucuya).
 * Eksikler özette; gönderme denendikten sonra şeridin solunda hata cümlesi durur.
 */
export function AdvanceLead({ values }) {
  const { t, locale } = useLocale()
  const info = useMemo(() => advanceInsights(values, { locale }), [values, locale])
  const amount = info.amount.state === "ok" ? info.amount : null
  const ready = !info.missing.length
  const rest = [
    values.purpose && capFirst(t(`myspace.purpose.${values.purpose}`), locale),
    values.destination && locationLabel(t, values.destination),
  ].filter(Boolean)
  return (
    <p
      aria-live="polite"
      className="flex min-w-0 flex-1 items-center gap-1.5 text-[0.8125rem] text-muted-foreground tabular-nums"
    >
      {ready && (
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          aria-label={t("selfService.advance.summary.ready")}
          role="img"
          className="size-4 shrink-0 text-success-ink"
          strokeWidth={2}
        />
      )}
      <span className="min-w-0 truncate">
        {amount ? (
          <>
            <span className="font-semibold text-foreground">
              {formatMoney(amount.value, amount.currency, locale)}
            </span>
            {rest.map((r) => ` · ${r}`).join("")}
          </>
        ) : (
          t("selfService.advance.leadEmpty")
        )}
      </span>
    </p>
  )
}
