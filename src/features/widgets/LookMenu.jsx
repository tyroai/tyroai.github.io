import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { LookChoices } from "./LookChoices"
import { lookName } from "./lookSwatch"

/**
 * Araç şeridindeki "Görünüm" düğmesi — radyo seçenekli menü (standart · cam …).
 * Tetikleyici şeridin ok tuşu gezinmesine katılır: ref, `tabIndex`, `data-ctl`
 * ve odak şeritten gelir (`button`). Düğmede seçili görünümün adı yazıyorsa (`showValue`) ad
 * erişilebilir adın içinde de geçer.
 */
export function LookMenu({
  ref,
  name,
  looks,
  look,
  onLook,
  showValue = false,
  className,
  children,
  ...button
}) {
  const { t } = useLocale()
  const base = t("widgets.ctl.look", { name })
  const label = showValue ? `${base} — ${lookName(t, look)}` : base
  return (
    // Kilitlemeyen menü: açıkken sayfanın geri kalanı gizlenmez (şeritteki komşu düğmeler).
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          title={label}
          className={className}
          {...button}
        >
          {children}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={8}
        className="w-auto min-w-60 max-w-[calc(100vw-1.5rem)]"
      >
        <LookChoices looks={looks} look={look} onLook={onLook} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
