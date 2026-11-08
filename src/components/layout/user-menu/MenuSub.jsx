import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { ITEM } from "./menuStyles"

/**
 * Kullanıcı menüsünün masaüstü alt menüsü (Tema, Dil): yana açılır. Telefonda ikisi de alttan
 * çekmecede (`PaletteSheet`, `LanguageSheet`): yana açılan liste dar ekrandan taşıyordu.
 */
export function MenuSub({ trigger, contentClassName, children }) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={ITEM}>{trigger}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent collisionPadding={8} className={contentClassName}>
        {children}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
