import { useEffect, useRef } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import ArrowTurnBackwardIcon from "@hugeicons/core-free-icons/ArrowTurnBackwardIcon"
import PanelRightIcon from "@hugeicons/core-free-icons/PanelRightIcon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { actionButtonClass } from "@/components/common/actionButtonClass"
import { NotchCardDrop } from "@/components/layout/notch/NotchCardDrop"
import { NotchEditButton } from "@/components/layout/notch/NotchEdit"
import { useLocale } from "@/hooks/useLocale"
import "@/lib/i18n/widgetEdit"
import { shownId } from "../layoutOps"
import { useWidgetEditor } from "../widgetEditorContext"
import "./editBar.css"

const SOFT = { tone: "soft", size: "toolbar" }

/**
 * Düzenleme çubuğu — sayfanın ÜSTÜNDE, kaydırırken de orada (`sticky`), kartlardan ayrı bir
 * denetim yüzeyi: buzlu, ince kenarlı, hafif gölgeli; altında kartların araç şeritlerine yer
 * kalır (`editBar.css`). Solda kip (ikon + ad, genişte bir ipucu), sağda eylemler: Widget ekle ·
 * Çentiği düzenle · Renkli zemin · Varsayılana dön, ayraçtan sonra tek dolu düğme Bitti.
 * Dar panoda ikincil düğmeler yalnız ikon (adları ekran okuyucuda ve ipucunda). Açılınca odak ilk
 * düğmeye. Kart çentiğe sürüklenirken çentiğin bırakma yeri `NotchCardDrop`ta.
 */
export default function EditBarPanel() {
  const { t } = useLocale()
  const { layout, actions, drag } = useWidgetEditor()
  const bar = useRef(null)
  const dragged = drag != null && layout.items.find((x) => x.id === drag)

  useEffect(() => {
    bar.current?.querySelector("button")?.focus({ preventScroll: true })
  }, [])

  const backdropLabel = t("widgets.backdrop")
  return (
    <div className="board-edit-bar-wrap">
      <motion.div
        ref={bar}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.2, 0.9, 0.25, 1] }}
        role="region"
        aria-label={t(layout.labels?.bar ?? "widgets.editBar")}
        data-tour="edit-bar"
        className="board-edit-bar"
      >
        <div className="board-edit-bar__lead">
          <span aria-hidden="true" className="board-edit-bar__badge">
            <HugeiconsIcon icon={PencilEdit02Icon} className="size-4" strokeWidth={1.9} />
          </span>
          <div className="board-edit-bar__text">
            <p className="board-edit-bar__title">{t(layout.labels?.bar ?? "widgets.editBar")}</p>
            <p className="board-edit-bar__hint" title={t("widgetEdit.tip")}>
              {t("widgetEdit.tip")}
            </p>
          </div>
        </div>
        <div className="board-edit-bar__actions">
          <ActionButton
            {...SOFT}
            aria-disabled={!layout.hidden.length || undefined}
            title={t("widgets.add")}
            onClick={() => layout.hidden.length && actions.openCatalog()}
            className="board-edit-bar__btn board-edit-bar__add"
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />
            <span className="board-edit-bar__label">{t("widgets.add")}</span>
          </ActionButton>
          {/* Sağ kenar çentiğinin yuvaları (rayda kalem yok). */}
          <NotchEditButton
            className={actionButtonClass({ ...SOFT, className: "board-edit-bar__btn" })}
          >
            <HugeiconsIcon icon={PanelRightIcon} strokeWidth={1.9} aria-hidden="true" />
            <span className="board-edit-bar__label">{t("notch.edit")}</span>
          </NotchEditButton>
          <ActionButton
            {...SOFT}
            aria-pressed={layout.ambient}
            title={layout.hasGlass && !layout.ambient ? t("widgets.backdropHint") : backdropLabel}
            onClick={() => {
              layout.setAmbient(!layout.ambient)
              actions.announce(
                t(layout.ambient ? "widgets.say.backdropOff" : "widgets.say.backdropOn"),
              )
            }}
            className="board-edit-bar__btn board-edit-bar__toggle"
          >
            <span aria-hidden="true" className="board-edit-bar__swatch" />
            <span className="board-edit-bar__label">{backdropLabel}</span>
            {layout.hasGlass && !layout.ambient && (
              <span aria-hidden="true" className="board-edit-bar__dot" />
            )}
          </ActionButton>
          <ActionButton
            tone="plain"
            size="toolbar"
            aria-disabled={layout.isDefault || undefined}
            title={t("widgets.reset")}
            onClick={actions.reset}
            className="board-edit-bar__btn board-edit-bar__btn--quiet"
          >
            <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} aria-hidden="true" />
            <span className="board-edit-bar__label">{t("widgets.reset")}</span>
          </ActionButton>
          <span aria-hidden="true" className="board-edit-bar__sep" />
          <ActionButton tone="prominent" size="toolbar" onClick={actions.done}>
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.2} aria-hidden="true" />
            {t("widgets.done")}
          </ActionButton>
        </div>
      </motion.div>
      <NotchCardDrop widgetId={dragged ? shownId(dragged) : null} />
    </div>
  )
}
