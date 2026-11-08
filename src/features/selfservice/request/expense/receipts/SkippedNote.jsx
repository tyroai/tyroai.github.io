import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { number } from "../../../kinds"

/**
 * Sınıra takılan son ekleme, fiş şeridinde tek satır: "2 fiş eklenmedi" (sınır yanında yazılı). Sessizce
 * kesilmesin, kişi eksik fişle göndermesin. Canlı bölge hep çizili (boşken de) ki ekran okuyucu
 * duysun; bildirim (toast) kipli pencerenin arkasında kalıp okunmuyor.
 */
export function SkippedNote({ n }) {
  const { t, locale } = useLocale()
  return (
    <p
      role="status"
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-[0.75rem] font-medium text-warning-ink",
        !n && "sr-only",
      )}
    >
      {n > 0 && (
        <>
          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">
            {t("selfService.expense.receipts.skipped", { n: number(n, locale) })}
          </span>
        </>
      )}
    </p>
  )
}
