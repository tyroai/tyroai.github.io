import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import { useLocale } from "@/hooks/useLocale"
import { countLabel } from "./countLabel"

/** Çoğul biçimli sayı ("1 kişi" · "5 kişi"; Rusça/Arapça kurallarıyla) — `base.one` … `base.other`. */
export function CountText({ base, n }) {
  const { t, locale } = useLocale()
  return countLabel(t, locale, base, n)
}

/**
 * Grubun ortak işareti başlıkta BİR kez (her satırda tekrar değil): iş uygulaması "herkese açık ·
 * kilitsiz", katalog dışı ad uyarı ikonu (başlık zaten "Katalogda olmayan" diyor).
 */
export function GroupNote({ group }) {
  const { t } = useLocale()
  if (group === "other") {
    return (
      <HugeiconsIcon
        icon={Alert02Icon}
        aria-hidden="true"
        className="size-3.5 text-warning-ink"
        strokeWidth={2}
      />
    )
  }
  if (group === "business") {
    return (
      <span className="text-xs normal-case tracking-normal text-muted-foreground">
        · {t("authz.apps.public")}
      </span>
    )
  }
  return null
}
