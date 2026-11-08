import { createPortal } from "react-dom"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { useLocale } from "@/hooks/useLocale"
import "@/lib/i18n/widgetEdit"
import { NOTCH_SLOT_MAX } from "@/lib/notchSlots"
import { slotIcon } from "./slotMeta"

/**
 * Çentiğin üç yuvası, çentikteki gibi yan yana (çember + ad): tutup sürükleyerek sıra, şeridin
 * dışına bırakınca çıkar; köşedeki × de çıkarır. Klavyede yuvada sol/sağ (ya da yukarı/aşağı) ok.
 * Sürüklerken hedef yuva vurgulanır; doluyken yeni öğe gelirse şerit uyarı tonuna geçer.
 */
export function SlotWells({ items, name, drag, hint, onBegin, onMove, onRemove }) {
  const { t } = useLocale()
  const incoming = drag && drag.from === "list"
  const refused = incoming && !drag.outside && items.length >= NOTCH_SLOT_MAX
  const wells = Array.from({ length: NOTCH_SLOT_MAX }, (_, i) => items[i] ?? null)
  return (
    <div
      data-wells=""
      data-state={refused ? "full" : drag && !drag.outside ? "over" : drag ? "drag" : undefined}
      className="notch-wells"
    >
      {wells.map((id, i) => {
        const over = drag && !drag.outside && drag.index === i && !refused
        const lifted = drag?.from === "well" && drag.id === id
        if (!id)
          return (
            <div
              key={`empty-${i}`}
              data-well={i}
              data-over={over || undefined}
              className="notch-well"
            >
              <span aria-hidden="true" className="notch-well__disk notch-well__disk--empty">
                <HugeiconsIcon icon={PlusSignIcon} className="size-4" strokeWidth={2} />
              </span>
            </div>
          )
        const label = name(id)
        return (
          <div
            key={id}
            data-well={i}
            data-over={over || undefined}
            data-lifted={lifted || undefined}
            className="notch-well"
          >
            <button
              type="button"
              aria-label={t("headerWidgets.reorder", { name: label })}
              aria-describedby={hint}
              aria-keyshortcuts="ArrowLeft ArrowRight"
              data-well-item={id}
              onPointerDown={(e) => onBegin(e, id, "well")}
              onKeyDown={(e) => {
                const rtl = document.dir === "rtl"
                const step = {
                  ArrowUp: -1,
                  ArrowDown: 1,
                  ArrowLeft: rtl ? 1 : -1,
                  ArrowRight: rtl ? -1 : 1,
                }[e.key]
                if (!step) return
                e.preventDefault()
                onMove(id, step)
              }}
              className="notch-well__item"
            >
              <span aria-hidden="true" className="notch-well__disk">
                <HugeiconsIcon icon={slotIcon(id)} className="size-5" strokeWidth={1.8} />
              </span>
              <span aria-hidden="true" className="notch-well__name">
                {label}
              </span>
            </button>
            {items.length > 1 && (
              <button
                type="button"
                aria-label={t("widgetEdit.notchRemove", { name: label })}
                title={t("widgetEdit.notchRemove", { name: label })}
                onClick={() => onRemove(id)}
                className="notch-well__remove"
              >
                <span aria-hidden="true">
                  <HugeiconsIcon icon={Cancel01Icon} className="size-2.5" strokeWidth={3} />
                </span>
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** İşaretçiyi izleyen kopya (gövdede, pencerenin dönüşümünden bağımsız). */
export function DragGhost({ drag, x, y, name, full }) {
  const { t } = useLocale()
  if (!drag) return null
  const out = drag.from === "well" && drag.outside
  const refused = drag.from === "list" && !drag.outside && full
  return createPortal(
    <motion.div
      aria-hidden="true"
      style={{ x, y }}
      data-state={out ? "out" : refused ? "full" : undefined}
      className="notch-ghost"
    >
      <span className="notch-ghost__disk">
        <HugeiconsIcon icon={slotIcon(drag.id)} className="size-[1.125rem]" strokeWidth={1.8} />
      </span>
      <span className="notch-ghost__name">
        {out
          ? t("widgetEdit.notchDropOut")
          : refused
            ? t("notch.full", { n: NOTCH_SLOT_MAX })
            : name(drag.id)}
      </span>
    </motion.div>,
    document.body,
  )
}
