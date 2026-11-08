import { useId, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import DragDropVerticalIcon from "@hugeicons/core-free-icons/DragDropVerticalIcon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import "@/lib/i18n/widgetEdit"
import {
  BUILTIN_SLOTS,
  DEFAULT_SLOTS,
  NOTCH_SLOT_MAX,
  isBuiltinSlot,
  moveSlot,
  placeSlot,
  toggleSlot,
} from "@/lib/notchSlots"
import { cn } from "@/lib/utils"
import { TrayAccess } from "../headerWidgets/HeaderWidgets"
import { HEADER_IDS, HEADER_SUGGESTED } from "../headerWidgets/headerStore"
import { GROUP, HEAD } from "../headerWidgets/trayStyles"
import { setNotchSlots, useNotchSlots } from "./notchSlotStore"
import { slotIcon, slotNameKey } from "./slotMeta"
import { slotShortKey } from "./slotShort"
import { DragGhost, SlotWells } from "./SlotWells"
import { useSlotDrag } from "./useSlotDrag"
import "./notchPicker.css"

// Yerleşik üçlü önce, sonra header'a en çok yakışan widget'lar; gerisi "Tümü"nde.
const FIRST = [...BUILTIN_SLOTS, ...HEADER_SUGGESTED]
const ROW =
  "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04] focus-visible:outline-none aria-disabled:cursor-default aria-disabled:opacity-45 aria-disabled:hover:bg-transparent pointer-coarse:min-h-14"
const LINK =
  "mt-1.5 rounded-lg px-3 py-1.5 text-[0.8125rem] font-medium text-brand transition-colors hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
// Geri çevrilen bırakmanın notu bu kadar görünür kalır.
const NOTE_MS = 4000

/**
 * Eklenebilen satır: basınca çentiğe eklenir (`role="checkbox"`), fareyle satırdan, dokunmatikte
 * sondaki tutamaktan sürüklenip yuvaya bırakılır.
 */
function AddRow({ id, name, disabled, onToggle, onBegin }) {
  return (
    <li className="flex items-center">
      <button
        type="button"
        role="checkbox"
        aria-checked="false"
        aria-disabled={disabled || undefined}
        data-check={id}
        onClick={onToggle}
        onPointerDown={(e) => e.pointerType !== "touch" && onBegin(e, id, "list")}
        className={cn(ROW, "min-w-0 flex-1 cursor-grab active:cursor-grabbing")}
      >
        <span
          aria-hidden="true"
          className="grid size-5 shrink-0 place-items-center rounded-full border border-foreground/25"
        />
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-[0.625rem] bg-brand/10 text-brand"
        >
          <HugeiconsIcon icon={slotIcon(id)} className="size-[1.125rem]" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium">{name}</span>
      </button>
      <span aria-hidden="true" onPointerDown={(e) => onBegin(e, id, "list")} className="notch-grip">
        <HugeiconsIcon icon={DragDropVerticalIcon} className="size-5" strokeWidth={1.8} />
      </span>
    </li>
  )
}

/**
 * Çentiğin yuva seçicisi: üstte çentiğin üç yuvası yan yana (`SlotWells`; sürükle-bırakla sıra,
 * dışarı bırakınca ya da × ile çıkar), altta eklenebilenler — basınca ya da yuvaya sürükleyince
 * eklenir. En çok üç: doluyken gelen bırakma geri çevrilir ve sakin bir notla söylenir; son kalan
 * çıkarılamaz. Her değişiklik canlı bölgeden duyurulur.
 */
function SlotList({ available }) {
  const { t } = useLocale()
  const items = useNotchSlots()
  const [showAll, setShowAll] = useState(false)
  const [notice, setNotice] = useState("")
  const [refusal, setRefusal] = useState(false)
  const timer = useRef(0)
  const root = useRef(null)
  const hint = useId()
  const name = (id) => t(slotNameKey(id))
  // Yuvaların altında çentikteki gibi kısa ad (dar kutu).
  const shortName = (id) => t(isBuiltinSlot(id) ? slotNameKey(id) : slotShortKey(id))
  const full = items.length >= NOTCH_SLOT_MAX
  const rest = [...FIRST, ...HEADER_IDS].filter(
    (id, i, all) =>
      all.indexOf(id) === i && !items.includes(id) && (isBuiltinSlot(id) || available(id)),
  )
  const firstCount = rest.filter((id) => FIRST.includes(id)).length
  const isDefault =
    items.length === DEFAULT_SLOTS.length && items.every((id, i) => id === DEFAULT_SLOTS[i])
  const shown = showAll ? rest : rest.slice(0, firstCount)

  function refuse() {
    setRefusal(true)
    setNotice(t("widgetEdit.notchFullDrop", { n: NOTCH_SLOT_MAX }))
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setRefusal(false), NOTE_MS)
  }

  function remove(id) {
    const next = toggleSlot(items, id)
    if (next.length === items.length) return
    setNotchSlots(next)
    setRefusal(false)
    setNotice(t("notch.removed", { name: name(id) }))
  }

  function add(id, index = items.length) {
    const { items: next, result, out } = placeSlot(items, id, index)
    if (result === "full") return refuse()
    setNotchSlots(next)
    setRefusal(false)
    setNotice(
      result === "replaced"
        ? t("widgetEdit.notchReplaced", { name: name(id), old: name(out) })
        : t("notch.added", { name: name(id), n: next.length, max: NOTCH_SLOT_MAX }),
    )
    focusOn(`[data-well-item="${id}"]`)
  }

  const focusOn = (sel) => requestAnimationFrame(() => root.current?.querySelector(sel)?.focus())

  const dnd = useSlotDrag(({ id, from, index, outside }) => {
    if (from === "well") {
      if (outside) return items.length > 1 ? remove(id) : setNotice(t("notch.keepOne"))
      return move(id, index - items.indexOf(id), index)
    }
    if (!outside) add(id, index ?? items.length)
  })

  // Tek dokunuşla Posta · Takvim · Saatler; odak ilk yuvaya.
  function reset() {
    setNotchSlots([...DEFAULT_SLOTS])
    setRefusal(false)
    setNotice(t("notch.resetDone"))
    focusOn(`[data-well-item="${DEFAULT_SLOTS[0]}"]`)
  }

  function move(id, step, to = null) {
    const next = to == null ? moveSlot(items, id, step) : placeSlot(items, id, to).items
    if (next.every((x, i) => x === items[i])) return
    setNotchSlots(next)
    setNotice(
      t("headerWidgets.say.moved", {
        name: name(id),
        pos: next.indexOf(id) + 1,
        total: next.length,
      }),
    )
    focusOn(`[data-well-item="${id}"]`)
  }

  return (
    <div ref={root} className="flex flex-col gap-4">
      <section>
        <h3 className={cn(HEAD, "flex items-baseline justify-between")}>
          <span>{t("notch.inNotch")}</span>
          <span className="tabular-nums">
            {t("headerWidgets.count", { n: items.length, max: NOTCH_SLOT_MAX })}
          </span>
        </h3>
        <SlotWells
          items={items}
          name={shortName}
          drag={dnd.drag}
          hint={hint}
          onBegin={dnd.begin}
          onMove={(id, step) => move(id, step)}
          onRemove={remove}
        />
        <span id={hint} className="sr-only">
          {t("widgetEdit.notchWellHint")}
        </span>
        {refusal ? (
          <p className="notch-note" data-tone="warning">
            {t("widgetEdit.notchFullDrop", { n: NOTCH_SLOT_MAX })}
          </p>
        ) : (
          items.length === 1 && <p className="notch-note">{t("notch.keepOne")}</p>
        )}
        {!isDefault && (
          <button type="button" onClick={reset} className={LINK}>
            {t("notch.reset")}
          </button>
        )}
      </section>
      {rest.length > 0 && (
        <section>
          <h3 className={HEAD}>
            {full ? t("notch.full", { n: NOTCH_SLOT_MAX }) : t("headerWidgets.addSection")}
          </h3>
          <ul className={GROUP}>
            {shown.map((id) => (
              <AddRow
                key={id}
                id={id}
                name={name(id)}
                disabled={full}
                onBegin={dnd.begin}
                onToggle={() => {
                  if (dnd.justDragged()) return
                  if (full) return refuse()
                  add(id)
                }}
              />
            ))}
          </ul>
          {shown.length < rest.length && (
            <button type="button" onClick={() => setShowAll(true)} className={LINK}>
              {t("headerWidgets.showAll", { n: rest.length - shown.length })}
            </button>
          )}
        </section>
      )}
      <DragGhost drag={dnd.drag} x={dnd.x} y={dnd.y} name={name} full={full} />
      <p role="status" aria-live="polite" className="sr-only">
        {notice}
      </p>
    </div>
  )
}

/**
 * Çentiği düzenle penceresi (ilk basışta iner): masaüstünde ve tablette `anchor`a bağlı açılır
 * pencere (Anasayfa'nın düzenleme çubuğundaki düğme), telefonda alttan çekmece — header tepsisinin
 * paneli gibi. Kapanınca odak düzenle düğmesine (`opener`) döner.
 */
export default function NotchSlotPicker({ anchor, opener, open, onOpenChange, mobile, side }) {
  const { t } = useLocale()
  const title = t("notch.edit")
  const list = <TrayAccess>{(available) => <SlotList available={available} />}</TrayAccess>
  if (mobile)
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange} title={title}>
        {list}
      </BottomSheet>
    )
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor virtualRef={anchor} />
      <PopoverContent
        side={side}
        align="end"
        sideOffset={side === "left" ? 14 : 8}
        collisionPadding={12}
        aria-label={title}
        // Düzenle düğmesine basmak pencereyi kapatıp yeniden açmasın: düğme kendisi kapatır.
        onInteractOutside={(e) => {
          if (opener.current?.contains(e.target)) e.preventDefault()
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          opener.current?.focus()
        }}
        className="max-h-[min(36rem,calc(100dvh-5rem))] w-[min(23rem,calc(100vw-1.5rem))] gap-0 overflow-y-auto overscroll-contain rounded-[1.5rem] p-3 text-sm shadow-[0_28px_70px_-24px_rgb(15_23_42/0.45)]"
      >
        <h2 className="ps-3 pt-1 pb-3 text-[0.9375rem] font-bold tracking-tight">{title}</h2>
        {list}
      </PopoverContent>
    </Popover>
  )
}
