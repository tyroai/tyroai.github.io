import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import LayerAddIcon from "@hugeicons/core-free-icons/LayerAddIcon"
import Move01Icon from "@hugeicons/core-free-icons/Move01Icon"
import PanelTopIcon from "@hugeicons/core-free-icons/PanelTopIcon"
import { useLocale } from "@/hooks/useLocale"
import { CardChoice } from "./CardChoice"
import { focusSlot } from "./focusSlot"
import { shownId } from "./layoutOps"
import { useWidgetEditor } from "./widgetEditorContext"

/**
 * Yuvanın üstündeki sorular (`CardChoice`): ana bölümde bir kart bunun üstüne bırakılınca
 * "üst üste koy ya da yerine taşı"; bu kart header'a eklenirken "burada da kalsın mı".
 */
export function SlotChoices({ item, name }) {
  const { t } = useLocale()
  const { editing, choice, headerChoice, layout, actions } = useWidgetEditor()
  // Soru dışarıdan kapanıp odak boşa düşerse karta (düzenlerken şeridine, değilse tutamağına).
  const back = () =>
    focusSlot({ id: item.id, zone: item.zone, ctl: editing ? undefined : "handle" })
  if (choice?.to === item.id) {
    const dragged = name(shownId(layout.items.find((x) => x.id === choice.from) ?? item))
    return (
      <CardChoice
        label={t("widgets.drop.aria", { name: dragged })}
        title={t("widgets.drop.title", { name: dragged })}
        options={[
          { key: "stack", label: t("widgets.drop.stack"), icon: LayerAddIcon },
          { key: "move", label: t("widgets.drop.move"), icon: Move01Icon },
        ]}
        cancelLabel={t("widgets.drop.cancel")}
        onChoose={actions.choose}
        onGone={back}
      />
    )
  }
  if (headerChoice?.id === item.id) {
    const widget = name(headerChoice.memberId)
    return (
      <CardChoice
        label={t("widgets.headerChoice.aria", { name: widget })}
        title={t("widgets.headerChoice.title", { name: widget })}
        detail={t("widgets.headerChoice.detail")}
        // Varsayılan (birincil, odakta) güvenli olan: kart yerinde de kalsın — panoda boşluk açılmaz.
        options={[
          { key: "copy", label: t("widgets.headerChoice.copy"), icon: Copy01Icon },
          { key: "move", label: t("widgets.headerChoice.move"), icon: PanelTopIcon },
        ]}
        cancelLabel={t("widgets.drop.cancel")}
        onChoose={actions.chooseHeader}
        onGone={back}
      />
    )
  }
  return null
}
