import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { MONTH } from "../kinds"

/** Ay süzgecinin seçenekleri `{ key, label, count }` ("Kasım 2026"), dile göre. */
export function useMonthOptions(monthOptions) {
  const { locale } = useLocale()
  const monthFmt = getDateTimeFormat(locale, MONTH)
  return useMemo(
    () =>
      monthOptions.map((o) => ({
        key: o.key,
        label: monthFmt.format(o.date),
        count: o.count,
      })),
    [monthOptions, monthFmt],
  )
}
