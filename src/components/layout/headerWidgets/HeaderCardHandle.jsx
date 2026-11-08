import { CardHandle } from "@/features/widgets/CardHandle"
import { looksOf } from "@/features/widgets/layout"
import { lookNotice } from "@/features/widgets/lookSwatch"
import { useLocale } from "@/hooks/useLocale"
import { notify } from "@/lib/notify"
import {
  RENDER_AS,
  headerTitleKey,
  removeHeaderWidget,
  restoreHeader,
  setHeaderLook,
} from "./headerStore"
import { sayInHeader } from "./headerSay"

const UNDO_MS = 8000

/**
 * Header'da açılan widget'ın tutamağı — panodaki kartınki gibi (•••), ama kartın ALT kenarında:
 * üst kenar header'ın ikonuna yaslı. Menü: Görünüm (header'daki ayrı) · Header'dan kaldır
 * ("Geri al"lı).
 */
export function HeaderCardHandle({ id, look }) {
  const { t } = useLocale()
  // Tyrofy'ın sahnesinde tutamak yok (ürün sahibi: iki seçenek gereksiz); header'dan kaldırmak
  // header'ın düzenleme panelinde.
  if (id === "radio") return null
  const name = t(headerTitleKey(id))
  return (
    <CardHandle
      name={name}
      info={t(`widgets.info.${RENDER_AS[id] ?? id}`)}
      looks={looksOf(id)}
      look={look}
      onLook={(value) => {
        setHeaderLook(id, value)
        sayInHeader(lookNotice(t, name, look, value))
      }}
      onRemove={() => {
        const prev = removeHeaderWidget(id)
        notify.info(t("headerWidgets.say.removed", { name }), {
          duration: UNDO_MS,
          action: { label: t("widgets.undo"), onClick: () => restoreHeader(prev) },
        })
      }}
      removeLabel={t("headerWidgets.removeShort")}
      className="top-auto bottom-0 translate-y-1/2"
    />
  )
}
