import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import DashboardSquare01Icon from "@hugeicons/core-free-icons/DashboardSquare01Icon"
import MinusSignIcon from "@hugeicons/core-free-icons/MinusSignIcon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { Reorder } from "motion/react"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { WIDGET_DRAG_TYPE, requestToHeader } from "@/lib/boardEdit"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { HeaderManager } from "./HeaderManager"
import { useHeaderFlash } from "./headerFlash"
import "./trayFlash.css"
import "./trayAdd.css"
import { headerTitleKey, removeHeaderWidget, restoreHeader, setHeaderOrder } from "./headerStore"
import { StackGlyph, TrayIcon } from "./trayParts"
import { TRAY_BTN } from "./trayStyles"

const HeaderCatalog = lazy(() => import("./catalog/HeaderCatalog"))
const UNDO_MS = 8000
const hasWidget = (e) => Array.from(e.dataTransfer?.types ?? []).includes(WIDGET_DRAG_TYPE)

/** Panodan bir kart sürükleniyor mu: tepsi o sırada bırakma yeri olduğunu gösterir. */
function useBoardDrag() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const start = (e) => hasWidget(e) && setOn(true)
    const stop = () => setOn(false)
    document.addEventListener("dragstart", start)
    document.addEventListener("dragend", stop)
    document.addEventListener("drop", stop)
    return () => {
      document.removeEventListener("dragstart", start)
      document.removeEventListener("dragend", stop)
      document.removeEventListener("drop", stop)
    }
  }, [])
  return on
}

/**
 * Düzenlerken tepsideki ikon: tutup yana sürüklenir; köşedeki "−" çıkarır (iOS gibi). Rozet ikonun
 * KENDİ köşesinde (yalnız 6 px dışarıda) ve ikonlar arası 12 px: eskiden rozet iki ikonun arasına
 * düşüyor, soldakine aitmiş gibi durup sağdakini siliyordu. Rozetin üstüne gelince silinecek ikon
 * kırmızı halkayla işaretlenir (`trayFlash.css`).
 */
function EditIcon({ id, chip, onOpen, onRemove, onDragEnd }) {
  const { t } = useLocale()
  const flash = useHeaderFlash()
  const name = t(headerTitleKey(id))
  return (
    <Reorder.Item
      as="div"
      value={id}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.1 }}
      className="tray-edit-item relative"
    >
      <TrayIcon
        id={id}
        title={name}
        live={false}
        chip={id === "radio" ? undefined : chip}
        onClick={(e) => onOpen(e.currentTarget, id)}
        className={cn("cursor-grab active:cursor-grabbing", flash?.id === id && "tray-flash")}
      />
      <button
        type="button"
        aria-label={t("headerWidgets.remove", { name })}
        title={t("headerWidgets.remove", { name })}
        onClick={onRemove}
        data-remove=""
        // Hedef 24 px (WCAG 2.5.8), görünen daire 16 px ikonun köşesinde; dokunmatikte payı komşu
        // ikona taşmayacak kadar.
        className="group/minus absolute -top-1.5 -start-1.5 z-10 grid size-[max(1.5rem,24px)] place-items-center rounded-full focus-visible:outline-none pointer-coarse:after:absolute pointer-coarse:after:-inset-1"
      >
        <span className="grid size-4 place-items-center rounded-full bg-foreground/70 text-background ring-2 ring-background transition-colors group-hover/minus:bg-red-600 group-focus-visible/minus:ring-brand">
          <HugeiconsIcon
            icon={MinusSignIcon}
            className="size-2.5"
            strokeWidth={3}
            aria-hidden="true"
          />
        </span>
      </button>
    </Reorder.Item>
  )
}

/**
 * Tepsinin "+" düğmesi: paletin degradesinde küçük bir disk (sayfanın "Yeni sohbet"iyle aynı
 * renkler), yanında ad yalnız tepsi boşken ya da kart sürüklenirken. Boyu header'ın öteki ikon
 * düğmeleriyle aynı (dokunmatikte görünmez payla 44 px; header düğmeleri büyümez).
 */
function AddButton({ label, showLabel = false, title, onClick }) {
  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      onClick={onClick}
      data-label={showLabel || undefined}
      className="tray-add"
    >
      <span aria-hidden="true" className="tray-add__disk">
        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2.4} className="size-3.5" />
      </span>
      {showLabel && (
        <span aria-hidden="true" className="tray-add__label">
          {label}
        </span>
      )}
    </button>
  )
}

/**
 * Anasayfa ya da Pano düzenlenirken header'daki tepsi: kesik çizgili kap, ikonlarda "−",
 * tutup sürükleyerek sıra, sonda "+" (boşken "Widget ekle"). İkona ya da "+"ya basınca
 * düzenleme paneli (`HeaderManager`) tepsinin altında açılır; telefonda çekmecede. Panodan
 * sürüklenen kart buraya bırakılınca header'a taşınır (`requestToHeader`).
 */
export function EditTray({ ref, inline, mobile, items, looks, available }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [catalog, setCatalog] = useState(false)
  const [over, setOver] = useState(false)
  const [order, setOrder] = useState(null)
  const latest = useRef(null)
  const opener = useRef(null)
  const focusId = useRef(null)
  const dragging = useBoardDrag()
  const flash = useHeaderFlash()
  const title = t("headerWidgets.title")

  function openFrom(el, id = null) {
    opener.current = el
    focusId.current = id
    // Panel zaten açıksa yalnız odak o satıra (açılışın odağı yalnız ilk açılışta).
    if (open && id) document.querySelector(`[data-row="${id}"] [data-handle]`)?.focus()
    setOpen(true)
  }

  function remove(id) {
    const prev = removeHeaderWidget(id)
    notify.info(t("headerWidgets.say.removed", { name: t(headerTitleKey(id)) }), {
      duration: UNDO_MS,
      action: { label: t("widgets.undo"), onClick: () => restoreHeader(prev) },
    })
  }

  const drop = {
    onDragOver(e) {
      if (!hasWidget(e)) return
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setOver(true)
    },
    onDragLeave(e) {
      if (!e.currentTarget.contains(e.relatedTarget)) setOver(false)
    },
    onDrop(e) {
      setOver(false)
      if (!hasWidget(e)) return
      e.preventDefault()
      requestToHeader(e.dataTransfer.getData(WIDGET_DRAG_TYPE))
    },
  }

  const group = (
    <div
      ref={ref}
      data-tour="tray"
      role="group"
      aria-label={title}
      {...drop}
      data-drag={dragging || undefined}
      data-over={over || undefined}
      data-empty={!items.length || undefined}
      className="tray-edit"
    >
      {inline ? (
        <>
          <Reorder.Group
            as="div"
            axis="x"
            values={order ?? items}
            onReorder={(next) => {
              latest.current = next
              setOrder(next)
            }}
            className="flex items-center gap-3"
          >
            {(order ?? items).map((id) => (
              <EditIcon
                key={id}
                id={id}
                chip={looks[id]}
                onOpen={openFrom}
                onRemove={() => remove(id)}
                onDragEnd={() => {
                  if (latest.current) setHeaderOrder(latest.current)
                  latest.current = null
                  setOrder(null)
                }}
              />
            ))}
          </Reorder.Group>
          <AddButton
            label={dragging ? t("headerWidgets.drop") : t("headerWidgets.addShort")}
            showLabel={dragging || !items.length}
            title={t("headerWidgets.add")}
            onClick={(e) => openFrom(e.currentTarget)}
          />
        </>
      ) : items.length ? (
        <button
          type="button"
          aria-label={t("headerWidgets.manage")}
          title={t("headerWidgets.manage")}
          onClick={(e) => openFrom(e.currentTarget)}
          className={cn(
            TRAY_BTN,
            "h-8 min-w-8 px-1.5 text-brand hover:bg-brand/10",
            flash && items.includes(flash.id) && "tray-flash",
          )}
        >
          <StackGlyph items={items} top={items[0]} live={false} />
        </button>
      ) : (
        <AddButton
          label={t("headerWidgets.manage")}
          title={t("headerWidgets.manage")}
          onClick={(e) => openFrom(e.currentTarget)}
        />
      )}
    </div>
  )

  const body = <HeaderManager items={items} looks={looks} available={available} />
  // Katalog ayrı pencere: panel kapanır, katalog açılır (iç içe pencere yok).
  const catalogButton = (
    <button
      type="button"
      onClick={() => {
        setOpen(false)
        setCatalog(true)
      }}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-medium text-brand transition-colors hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
    >
      <HugeiconsIcon icon={DashboardSquare01Icon} className="size-4" strokeWidth={1.8} />
      {t("headerWidgets.catalog.open")}
    </button>
  )
  const catalogDialog = catalog && (
    <Suspense fallback={null}>
      <HeaderCatalog open onOpenChange={setCatalog} available={available} />
    </Suspense>
  )
  if (mobile)
    return (
      <>
        {group}
        <BottomSheet open={open} onOpenChange={setOpen} title={title}>
          <div className="flex justify-end pb-2">{catalogButton}</div>
          {body}
        </BottomSheet>
        {catalogDialog}
      </>
    )
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>{group}</PopoverAnchor>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        collisionPadding={12}
        aria-label={title}
        // Tepsideki başka bir ikona basmak paneli kapatmaz: odak o satıra gider.
        onInteractOutside={(e) => {
          if (ref.current?.contains(e.target)) e.preventDefault()
        }}
        onOpenAutoFocus={(e) => {
          const row = focusId.current
          const el = row && e.currentTarget.querySelector(`[data-row="${row}"] [data-handle]`)
          if (!el) return
          e.preventDefault()
          el.focus()
        }}
        onCloseAutoFocus={(e) => {
          if (!opener.current?.isConnected) return
          e.preventDefault()
          opener.current.focus()
        }}
        className="max-h-[min(36rem,calc(100dvh-5rem))] w-[min(23rem,calc(100vw-1.5rem))] gap-0 overflow-y-auto overscroll-contain rounded-[1.5rem] p-3 text-sm shadow-[0_28px_70px_-24px_rgb(15_23_42/0.45)]"
      >
        <div className="flex items-center justify-between gap-2 ps-3 pt-1 pb-3">
          <h2 className="text-[0.9375rem] font-bold tracking-tight">{title}</h2>
          {catalogButton}
        </div>
        {body}
      </PopoverContent>
      {catalogDialog}
    </Popover>
  )
}
