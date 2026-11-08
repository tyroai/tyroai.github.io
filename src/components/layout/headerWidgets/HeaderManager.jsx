import { useId, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import DragDropVerticalIcon from "@hugeicons/core-free-icons/DragDropVerticalIcon"
import MinusSignCircleIcon from "@hugeicons/core-free-icons/MinusSignCircleIcon"
import PlusSignCircleIcon from "@hugeicons/core-free-icons/PlusSignCircleIcon"
import { Reorder, useDragControls } from "motion/react"
import { LookMenu } from "@/features/widgets/LookMenu"
import { lookNotice, lookSwatch } from "@/features/widgets/lookSwatch"
import { baseLook, lookPalette } from "@/features/widgets/paletteTokens"
import { useLocale } from "@/hooks/useLocale"
import { usePalette } from "@/hooks/usePalette"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import {
  HEADER_IDS,
  HEADER_MAX,
  HEADER_SUGGESTED as SUGGESTED,
  headerLooksOf,
  addHeaderWidget,
  headerDescKey,
  headerLookOf,
  headerTitleKey,
  moveHeaderWidget,
  removeHeaderWidget,
  restoreHeader,
  setHeaderLook,
  setHeaderOrder,
} from "./headerStore"
import { trayIcon } from "./trayIcon"
import { CTL, GROUP, HEAD } from "./trayStyles"

const UNDO_MS = 8000

const focusIn = (root, selector, i) =>
  requestAnimationFrame(() => {
    const all = root.current?.querySelectorAll(selector) ?? []
    all[Math.max(0, Math.min(i, all.length - 1))]?.focus()
  })

function IconTile({ id }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-[0.625rem] bg-brand/10 text-brand"
    >
      <HugeiconsIcon icon={trayIcon(id)} className="size-[1.125rem]" strokeWidth={1.8} />
    </span>
  )
}

/**
 * Header'daki widget'ların düzenleme paneli (Anasayfa ya da Pano düzenlenirken tepsiden açılır):
 * üstte header'dakiler — kaldır, görünüm, tutup sürükle (dokunmatikte de; klavyede tutamakta
 * yukarı/aşağı ok); altta eklenebilenler, önerilenler önce. Kaldırma geri alınabilir; her
 * değişiklik canlı bölgeden duyurulur. `available`: bu kişiye açık mı (erişim kuralı).
 */
export function HeaderManager({ items, looks, available, className }) {
  const { t } = useLocale()
  const [drag, setDrag] = useState(null)
  const latest = useRef(null)
  const [showAll, setShowAll] = useState(false)
  const [notice, setNotice] = useState("")
  const root = useRef(null)
  const hint = useId()
  const name = (id) => t(headerTitleKey(id))
  const full = items.length >= HEADER_MAX
  const addable = HEADER_IDS.filter((id) => available(id) && !items.includes(id))
  const suggested = SUGGESTED.filter((id) => addable.includes(id))
  const rest = addable.filter((id) => !SUGGESTED.includes(id))
  const shown = showAll ? [...suggested, ...rest] : suggested

  function move(id, step) {
    const at = items.indexOf(id) + step
    if (at < 0 || at >= items.length) return
    moveHeaderWidget(id, at)
    setNotice(t("headerWidgets.say.moved", { name: name(id), pos: at + 1, total: items.length }))
    // Satır yer değiştirince odak düşebilir: tutamağa geri.
    requestAnimationFrame(() =>
      root.current?.querySelector(`[data-row="${id}"] [data-handle]`)?.focus(),
    )
  }

  function remove(id) {
    const i = items.indexOf(id)
    const prev = removeHeaderWidget(id)
    const said = t("headerWidgets.say.removed", { name: name(id) })
    setNotice(said)
    notify.info(said, {
      duration: UNDO_MS,
      action: { label: t("widgets.undo"), onClick: () => restoreHeader(prev) },
    })
    focusIn(root, items.length > 1 ? "[data-remove]" : "[data-add]", i)
  }

  function add(id) {
    if (full || !addHeaderWidget(id)) return
    setNotice(
      t("headerWidgets.say.added", { name: name(id), n: items.length + 1, max: HEADER_MAX }),
    )
    focusIn(root, "[data-add]", shown.indexOf(id))
  }

  return (
    <div ref={root} className={cn("flex flex-col gap-4", className)}>
      <section>
        <h3 className={cn(HEAD, "flex items-baseline justify-between")}>
          <span>{t("headerWidgets.inHeader")}</span>
          <span className="tabular-nums">
            {t("headerWidgets.count", { n: items.length, max: HEADER_MAX })}
          </span>
        </h3>
        {items.length ? (
          <Reorder.Group
            as="ul"
            axis="y"
            values={drag ?? items}
            onReorder={(next) => {
              latest.current = next
              setDrag(next)
            }}
            className={GROUP}
          >
            {(drag ?? items).map((id) => (
              <PinnedRow
                key={id}
                id={id}
                name={name(id)}
                look={headerLookOf(looks, id)}
                hint={hint}
                onMove={(step) => move(id, step)}
                onRemove={() => remove(id)}
                onLook={(value) => {
                  setHeaderLook(id, value)
                  setNotice(lookNotice(t, name(id), headerLookOf(looks, id), value))
                }}
                onDragEnd={() => {
                  if (latest.current) setHeaderOrder(latest.current)
                  latest.current = null
                  setDrag(null)
                }}
              />
            ))}
          </Reorder.Group>
        ) : (
          <p className={cn(GROUP, "px-3 py-3 text-[0.8125rem] text-muted-foreground")}>
            {t("headerWidgets.empty")}
          </p>
        )}
        <span id={hint} className="sr-only">
          {t("headerWidgets.reorderHint")}
        </span>
        <p className="hidden px-3 pt-2 text-[0.75rem] text-muted-foreground pointer-fine:block">
          {t("headerWidgets.dropHint")}
        </p>
      </section>

      {addable.length > 0 && (
        <section>
          <h3 className={HEAD}>
            {full ? t("headerWidgets.full", { n: HEADER_MAX }) : t("headerWidgets.addSection")}
          </h3>
          <ul className={GROUP}>
            {shown.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  data-add=""
                  aria-disabled={full || undefined}
                  onClick={() => add(id)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04] focus-visible:outline-none aria-disabled:cursor-default aria-disabled:opacity-45 aria-disabled:hover:bg-transparent pointer-coarse:min-h-14"
                >
                  <IconTile id={id} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.875rem] font-medium">
                      {name(id)}
                      {/* Ad görünen metinle başlar, eylem ekran okuyucuya: "Dünya saati, header'a ekle". */}
                      <span className="sr-only">, {t("headerWidgets.addAction")}</span>
                    </span>
                    {/* Gruplu listenin zemininde ikincil yazı bir ton koyu (AA). */}
                    <span className="block truncate text-[0.75rem] text-foreground/65">
                      {t(headerDescKey(id))}
                    </span>
                  </span>
                  <HugeiconsIcon
                    icon={PlusSignCircleIcon}
                    className="size-5 shrink-0 text-brand"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
          {rest.length > 0 && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-1.5 rounded-lg px-3 py-1.5 text-[0.8125rem] font-medium text-brand transition-colors hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
            >
              {t("headerWidgets.showAll", { n: rest.length })}
            </button>
          )}
        </section>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {notice}
      </p>
    </div>
  )
}

function PinnedRow({ id, name, look, hint, onMove, onRemove, onLook, onDragEnd }) {
  const { t } = useLocale()
  const controls = useDragControls()
  const [dragging, setDragging] = useState(false)
  const options = headerLooksOf(id)
  const { palette } = usePalette()
  const swatch = lookSwatch(baseLook(look), lookPalette(look), palette)
  return (
    <Reorder.Item
      as="li"
      value={id}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => {
        setDragging(false)
        onDragEnd()
      }}
      data-row={id}
      // Tutulan satır kaldırılır: zemin ve gölgeyle ötekilerin üstünden geçer.
      className={cn(
        "relative flex items-center gap-2 p-1.5",
        dragging && "z-10 rounded-xl bg-popover shadow-[0_12px_28px_-12px_rgb(15_23_42/0.35)]",
      )}
    >
      <button
        type="button"
        data-remove=""
        aria-label={t("headerWidgets.remove", { name })}
        title={t("headerWidgets.remove", { name })}
        onClick={onRemove}
        className={cn(CTL, "hover:bg-red-500/10 hover:text-red-600")}
      >
        <HugeiconsIcon icon={MinusSignCircleIcon} className="size-5" strokeWidth={1.8} />
      </button>
      <IconTile id={id} />
      <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium">{name}</span>
      {options.length > 1 && (
        <LookMenu
          name={name}
          looks={options}
          look={look}
          onLook={onLook}
          showValue
          className="relative inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-foreground/[0.05] ps-1.5 pe-2 text-[0.75rem] font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-y-2"
        >
          <span
            aria-hidden="true"
            className={cn("size-3.5 rounded-full", swatch.className)}
            style={swatch.style}
          />
          {t(`widgets.look.${baseLook(look)}`)}
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 opacity-60" strokeWidth={2} />
        </LookMenu>
      )}
      <button
        type="button"
        data-handle=""
        aria-label={t("headerWidgets.reorder", { name })}
        aria-describedby={hint}
        aria-keyshortcuts="ArrowUp ArrowDown"
        title={t("headerWidgets.reorder", { name })}
        onPointerDown={(e) => controls.start(e)}
        onKeyDown={(e) => {
          const step = { ArrowUp: -1, ArrowDown: 1 }[e.key]
          if (!step) return
          e.preventDefault()
          onMove(step)
        }}
        className={cn(CTL, "cursor-grab touch-none active:cursor-grabbing")}
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} className="size-5" strokeWidth={1.8} />
      </button>
    </Reorder.Item>
  )
}
