import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useLocale } from "@/hooks/useLocale"
import "@/lib/i18n/widgetEdit"
import { WIDGET_DRAG_TYPE } from "@/lib/boardEdit"
import { NOTCH_SLOT_MAX, placeSlot } from "@/lib/notchSlots"
import { notify } from "@/lib/notify"
import { headerEligible } from "../headerWidgets/headerStore"
import { setNotchSlots, useNotchSlots } from "./notchSlotStore"
import { slotNameKey } from "./slotMeta"
import "./notchDrop.css"

const NOTCH = '[data-slot="edge-notch"], [data-slot="mobile-notch"]'
const UNDO_MS = 8000

/** Bırakılırsa ne olur: eklenir · zaten orada · (doluysa) yuvadakinin yerine geçer · giremez. */
function stateOf(id, items) {
  if (!headerEligible(id)) return "no"
  if (items.includes(id)) return "already"
  return items.length >= NOTCH_SLOT_MAX ? "full" : "ok"
}

/** Doluyken bırakılan noktanın yuvası: çentiğin uzun ekseninde eşit paylar (yuvalar sırayla). */
function slotAt(el, e, count) {
  const r = el.getBoundingClientRect()
  const edge = el.dataset.slot === "edge-notch"
  const frac = edge ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width
  return Math.max(0, Math.min(count - 1, Math.floor(frac * count)))
}

/**
 * Panodan çentiğe: düzenlerken bir kart (fareyle, HTML5 sürüklemesi) sağdaki çentiğe bırakılınca
 * yuvaya eklenir; kart panoda kalır ("Geri al"lı). Sürükleme başlayınca çentik parlar ve yanında
 * ne olacağını söyleyen küçük bir etiket belirir — doluysa bırakmadan önce görülür, bırakılırsa da
 * geri çevrilir. Çentiğin kendi dosyalarına dokunmaz: hedef `data-slot` ile bulunur, vurgu
 * `data-notch-drop` özniteliğiyle (`notchDrop.css`). `widgetId`: sürüklenen kartın görünen widget'ı.
 */
export function NotchCardDrop({ widgetId }) {
  const { t } = useLocale()
  const items = useNotchSlots()
  const [place, setPlace] = useState(null)
  const [over, setOver] = useState(false)
  const state = widgetId ? stateOf(widgetId, items) : null

  useEffect(() => {
    if (!state) return undefined
    const el = document.querySelector(NOTCH)
    if (!el) return undefined
    el.dataset.notchDrop = state
    // Etiketin yeri sürükleme başlarken bir kez ölçülür (çentik o sırada yerinden oynamaz).
    const frame = requestAnimationFrame(() =>
      setPlace({ edge: el.dataset.slot === "edge-notch", r: el.getBoundingClientRect() }),
    )
    const inside = (e) => e.target instanceof Element && e.target.closest(NOTCH)
    const onOver = (e) => {
      const hit = inside(e) && Array.from(e.dataTransfer?.types ?? []).includes(WIDGET_DRAG_TYPE)
      setOver(Boolean(hit))
      if (!hit) return delete el.dataset.notchOver
      el.dataset.notchOver = ""
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
    }
    const onDrop = (e) => {
      if (!inside(e)) return
      e.preventDefault()
      const name = t(slotNameKey(widgetId))
      const prev = items
      const undo = { label: t("widgets.undo"), onClick: () => setNotchSlots([...prev]) }
      if (state === "ok") {
        setNotchSlots(placeSlot(items, widgetId, items.length).items)
        notify.info(t("notch.added", { name, n: items.length + 1, max: NOTCH_SLOT_MAX }), {
          duration: UNDO_MS,
          action: undo,
        })
      } else if (state === "full") {
        // Dolu çentikte bırakılan yuvanın yerine geçer ("Geri al"lı).
        const { items: next, out } = placeSlot(items, widgetId, slotAt(el, e, items.length))
        setNotchSlots(next)
        notify.info(t("widgetEdit.notchReplaced", { name, old: t(slotNameKey(out)) }), {
          duration: UNDO_MS,
          action: undo,
        })
      } else if (state === "already") notify.info(t("widgetEdit.notchAlready", { name }))
      else notify.info(t("widgetEdit.notchCantDrop"))
    }
    document.addEventListener("dragover", onOver)
    document.addEventListener("drop", onDrop)
    return () => {
      cancelAnimationFrame(frame)
      delete el.dataset.notchDrop
      delete el.dataset.notchOver
      setOver(false)
      document.removeEventListener("dragover", onOver)
      document.removeEventListener("drop", onDrop)
    }
  }, [state, widgetId, items, t])

  if (!state || !place) return null
  const { r, edge } = place
  // Yan rayda solunda, dikeyde ortalı; telefon/tablet şeridinde altında, ortalı.
  const style = edge
    ? { top: r.top + r.height / 2, left: r.left - 12, translate: "-100% -50%" }
    : { top: r.bottom + 10, left: r.left + r.width / 2, translate: "-50% 0" }
  const text =
    state === "ok"
      ? t("widgetEdit.notchDropHere", { n: items.length, max: NOTCH_SLOT_MAX })
      : state === "full"
        ? t("widgetEdit.notchDropSwap")
        : state === "already"
          ? t("widgetEdit.notchAlready", { name: t(slotNameKey(widgetId)) })
          : t("widgetEdit.notchCantDrop")
  return createPortal(
    <div
      aria-hidden="true"
      style={style}
      data-tone={state === "ok" || state === "full" ? undefined : "muted"}
      data-over={over || undefined}
      className="notch-drop-label"
    >
      {text}
    </div>,
    document.body,
  )
}
