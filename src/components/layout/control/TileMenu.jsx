import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useLocale } from "@/hooks/useLocale"
import { notify } from "@/lib/notify"
import { useControlActions } from "./controlActions"
import { isBuiltin, sizeOptions, withoutTile } from "./controlModel"
import { setControlTiles, setTileSize } from "./controlStore"
import { usePinToggles } from "./pinActions"

function PinItems({ id }) {
  const { t } = useLocale()
  const pin = usePinToggles(id)
  return (
    <>
      <ContextMenuCheckboxItem checked={pin.inHeader} onCheckedChange={pin.toggleHeader}>
        {t("control.pin.header")}
      </ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem
        checked={pin.inNotch}
        disabled={pin.notchLocked}
        onCheckedChange={pin.toggleNotch}
      >
        {t("control.pin.notch")}
      </ContextMenuCheckboxItem>
      <ContextMenuSeparator />
    </>
  )
}

/**
 * Kutucuğun sağ tık menüsü (dokunmatikte uzun basış; macOS'un Denetim Merkezi gibi): boyut
 * (Küçük · Orta · Büyük — kutucuğun seçebildikleri), widget'ta kalıcı yer (header, çentik),
 * kutucuğa özgü eylem (Odak süreleri, çentiği düzenle) ve Denetim Merkezi'nden kaldır ("Geri al"lı).
 */
export function TileMenu({ id, size, title, tiles, onOpen, children }) {
  const { t } = useLocale()
  const { openNotchEdit } = useControlActions()
  const options = sizeOptions(id)
  const remove = () => {
    const prev = [...tiles]
    setControlTiles(withoutTile(tiles, id))
    notify.info(t("control.panel.removed", { name: title }), {
      action: { label: t("control.panel.undo"), onClick: () => setControlTiles(prev) },
    })
  }
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-52">
        {options.length > 1 && (
          <>
            <ContextMenuLabel>{t("control.size.title")}</ContextMenuLabel>
            <ContextMenuRadioGroup value={size} onValueChange={(v) => setTileSize(id, v)}>
              {options.map((o) => (
                <ContextMenuRadioItem key={o} value={o}>
                  {t(`control.size.${o}`)}
                </ContextMenuRadioItem>
              ))}
            </ContextMenuRadioGroup>
            <ContextMenuSeparator />
          </>
        )}
        {!isBuiltin(id) && <PinItems id={id} />}
        {id === "toggle:focus" && (
          <ContextMenuItem onSelect={() => onOpen(id)}>{t("control.focus.more")}</ContextMenuItem>
        )}
        {id === "toggle:notch" && (
          <ContextMenuItem onSelect={openNotchEdit}>{t("control.notch.edit")}</ContextMenuItem>
        )}
        <ContextMenuItem onSelect={remove}>{t("control.panel.removeFromCc")}</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
