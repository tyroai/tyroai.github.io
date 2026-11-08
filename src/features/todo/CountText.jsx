import { useLocale } from "@/hooks/useLocale"
import { formatCount } from "@/lib/intl-cache"

/** Sayaç metni: binlik ayraçlı (1.284). */
export function CountText({ n }) {
  const { locale } = useLocale()
  return formatCount(locale, n)
}
