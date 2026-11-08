import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { causeText } from "@/lib/causeText"

/** Hata kodundan neden cümlesi ve kod (`lib/causeText`); `ErrorCause` ve balonlar kullanır. */
export function useCause(detail) {
  const { t } = useLocale()
  return useMemo(() => causeText(t, detail), [detail, t])
}
