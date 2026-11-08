import { HugeiconsIcon } from "@hugeicons/react"
import PinIcon from "@hugeicons/core-free-icons/PinIcon"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { usePinToggles } from "./pinActions"

/**
 * Widget'ın kalıcı yeri (macOS'ta Denetim Merkezi'nden menü çubuğuna sürüklemek gibi): header'da
 * ve/veya çentikte göster (`usePinToggles`). Sabitliyken iğne marka renginde.
 */
export function PinMenu({ id, title }) {
  const { t } = useLocale()
  const pin = usePinToggles(id)
  const label = t("control.pin.menu", { name: title })
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="cc-icon-btn" aria-label={label} title={label}>
          <HugeiconsIcon
            icon={PinIcon}
            strokeWidth={1.8}
            aria-hidden="true"
            className={cn("size-[1.125rem]", (pin.inHeader || pin.inNotch) && "text-brand")}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuCheckboxItem checked={pin.inHeader} onCheckedChange={pin.toggleHeader}>
          {t("control.pin.header")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={pin.inNotch}
          disabled={pin.notchLocked}
          onCheckedChange={pin.toggleNotch}
        >
          {t("control.pin.notch")}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
