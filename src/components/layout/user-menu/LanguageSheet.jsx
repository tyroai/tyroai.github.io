import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { LOCALES } from "@/providers/LocaleProvider"

/**
 * Telefonda Dil seçimi alttan çekmecede — Tema'yla aynı kalıp (`PaletteSheet`; ürün sahibi:
 * "dil de aşağıdan açılsın aynı temadaki gibi"). Satırda dilin adı ve ✓; seçince çekmece kapanır
 * (bütün yazılar değişir, dene-bak gerekmez).
 */
export function LanguageSheet({ open, onOpenChange }) {
  const { t, locale, setLocale } = useLocale()
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t("header.language")} closeOnBack>
      <div
        role="radiogroup"
        aria-label={t("header.language")}
        className="divide-y divide-border/60 pb-2"
      >
        {LOCALES.map((code) => {
          const on = code === locale
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={on}
              lang={code}
              onClick={() => {
                setLocale(code)
                onOpenChange(false)
              }}
              className="flex min-h-14 w-full items-center gap-3 text-start text-[0.9375rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
            >
              <span className={cn("flex-1", on && "font-semibold")}>{t(`locale.${code}`)}</span>
              <span className="text-sm uppercase text-muted-foreground">{code}</span>
              <span className="grid size-5 place-items-center text-brand-ink">
                {on && <HugeiconsIcon icon={Tick02Icon} className="size-5" strokeWidth={2} />}
              </span>
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}
