import { useSyncExternalStore } from "react"
import { useLocation } from "react-router-dom"
import SidebarRightIcon from "@hugeicons/core-free-icons/SidebarRightIcon"
import { useLocale } from "@/hooks/useLocale"
import {
  edgeNotchScope,
  readEdgeNotchOpen,
  subscribeEdgeNotch,
  writeEdgeNotchOpen,
} from "@/lib/edgeNotchState"
import { NO_NOTCH_PAGE_IDS } from "@/lib/navGroups"
import { useControlActions } from "../controlActions"
import { TileShell } from "./TileShell"
import { MoreButton, ToggleFace } from "./ToggleTiles"

/**
 * Çentik: dokununca sağ kenardaki ray açılır/kapanır (bu sayfanın kapsamında: Genel sayfalar ve
 * öteki sayfalar ayrı hatırlanır — `lib/edgeNotchState`); › çentiği düzenler (yuva seçici,
 * Denetim Merkezi'nin düğmesinin altında). Kullanıcı menüsünün sayfalarında çentik yok: kutucuk
 * bunu söyler, dokunuş bir şey yapmaz. Telefonda kutucuk çizilmez (çentik header'ın altında şerit).
 */
export function NotchTile(shell) {
  const { t } = useLocale()
  const { pathname } = useLocation()
  const { openNotchEdit } = useControlActions()
  const page = pathname.split("/")[1] || "myspace"
  const scope = edgeNotchScope(page)
  const open = useSyncExternalStore(
    subscribeEdgeNotch,
    () => readEdgeNotchOpen(scope),
    () => false,
  )
  const none = NO_NOTCH_PAGE_IDS.includes(page)
  return (
    <TileShell id="toggle:notch" on={open && !none} {...shell}>
      <ToggleFace
        icon={SidebarRightIcon}
        label={t("control.notch.title")}
        sub={none ? t("control.notch.none") : null}
        hint={t("control.notch.hint")}
        on={open && !none}
        disabled={none}
        onToggle={() => writeEdgeNotchOpen(!open, scope)}
      />
      <MoreButton label={t("control.notch.edit")} onClick={openNotchEdit} />
    </TileShell>
  )
}
