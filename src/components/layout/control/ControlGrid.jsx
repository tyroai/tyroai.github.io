import { useEffect, useId, useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { sizeOf } from "./controlModel"
import { useControlSizes } from "./controlStore"
import { navDir, neighbor } from "./gridNav"
import { TileMenu } from "./TileMenu"
import { tileTitleKey } from "./tileTitle"
import { NotchTile } from "./tiles/NotchTile"
import { OofTile } from "./tiles/OofTile"
import { PresenceTile } from "./tiles/PresenceTile"
import { RadioTile } from "./tiles/RadioTile"
import { ShortcutsTile } from "./tiles/ShortcutsTile"
import { TaskTile } from "./tiles/TaskTile"
import { FocusTile, PresentTile, ThemeTile } from "./tiles/ToggleTiles"
import { WeatherTile } from "./tiles/WeatherTile"
import { WidgetTile } from "./tiles/WidgetTile"
import { useTileReorder } from "./useTileReorder"

const OWN = {
  "toggle:focus": FocusTile,
  "toggle:present": PresentTile,
  "toggle:theme": ThemeTile,
  "toggle:notch": NotchTile,
  "tool:task": TaskTile,
  "tool:presence": PresenceTile,
  "tool:oof": OofTile,
  "tool:shortcuts": ShortcutsTile,
  radio: RadioTile,
  weather: WeatherTile,
}

// Ayrıntısı olmayan aç-kapa kutucukları `onOpen` almaz: kabın DOM öğesine sızmasın.
const NO_DETAIL = new Set(["toggle:present", "toggle:theme", "toggle:notch"])

function Tile({ id, onOpen, ...rest }) {
  const Own = OWN[id]
  if (!Own) return <WidgetTile id={id} onOpen={onOpen} {...rest} />
  return NO_DETAIL.has(id) ? <Own {...rest} /> : <Own onOpen={onOpen} {...rest} />
}

/** Ok tuşu: kutucuktan ekrandaki komşusuna; kısayol şeridinin içinde sağ/sol düğmeden düğmeye. */
function moveFocus(e, grid) {
  const dir = navDir(e.key)
  const tile = dir && e.target.closest?.("[data-tile]")
  if (!tile || !grid.contains(tile) || e.target.matches?.("input, textarea")) return
  const group = e.target.closest('[role="group"]')
  if (group && (dir === "left" || dir === "right")) {
    const items = [...group.querySelectorAll("button")]
    const at = items.indexOf(e.target)
    const rtl = getComputedStyle(group).direction === "rtl"
    const step = (dir === "right") !== rtl ? 1 : -1
    const next = items[at + step]
    if (at >= 0 && next) {
      e.preventDefault()
      next.focus()
    }
    return
  }
  const rects = [...grid.querySelectorAll(":scope > [data-tile]")].map((el) => {
    const r = el.getBoundingClientRect()
    return { id: el.dataset.tile, x: r.left, y: r.top, w: r.width, h: r.height }
  })
  const to = neighbor(rects, tile.dataset.tile, dir)
  if (!to) return
  e.preventDefault()
  grid.querySelector(`[data-tile="${CSS.escape(to)}"] button`)?.focus()
}

/**
 * Kutucuk ızgarası (dört sütun, boşluk kalmasın diye yoğun dizilim). Her kutucuğun boyu kişinin
 * seçtiği ya da varsayılan (`sizeOf`); sağ tık / uzun basış menüsü boy, kalıcı yer ve kaldırmayı
 * verir (`TileMenu`; `all` tam liste — telefonda çizilmeyen çentik kaydan düşmesin). Ok tuşları
 * ekrandaki komşuya gider (`gridNav`).
 *
 * `editing`: kutucuklar önizleme ve bir liste; "−" `onRemove`a gider, sürükle ya da ok tuşlarıyla
 * taşınır (`onMove`, yeni yer `announce` ile söylenir). `focusTile`: kurulunca odaklanacak kutucuk.
 */
export function ControlGrid({
  tiles,
  all = tiles,
  onOpen,
  editing = false,
  onRemove,
  onMove,
  announce,
  gridRef,
  focusTile,
}) {
  const { t } = useLocale()
  const own = useRef(null)
  const ref = gridRef ?? own
  const sizes = useControlSizes()
  const hint = useId()
  const bind = useTileReorder({ tiles, gridRef: ref, onMove, announce })
  // Ayrıntıdan dönünce odak onu açan kutucuğa: ızgara geçiş bitince kurulur, o an odaklanır
  // (yalnız kuruluştaki değer; liste değişince odak yerinde kalır).
  const [initial] = useState(focusTile)
  useEffect(() => {
    if (initial)
      ref.current?.querySelector(`[data-tile="${initial}"] button`)?.focus({ preventScroll: true })
  }, [initial, ref])
  return (
    <div
      ref={ref}
      className="cc-grid"
      data-editing={editing ? "" : undefined}
      role={editing ? "list" : undefined}
      aria-label={editing ? t("control.panel.tilesLabel") : undefined}
      onKeyDown={editing ? undefined : (e) => moveFocus(e, ref.current)}
    >
      {editing && (
        <span id={hint} hidden>
          {t("control.panel.reorderHint")}
        </span>
      )}
      {tiles.map((id) => {
        const size = sizeOf(id, sizes)
        const name = t(tileTitleKey(id))
        const tile = (
          <Tile
            key={id}
            id={id}
            size={size}
            name={name}
            onOpen={onOpen}
            editing={editing}
            onRemove={onRemove}
            removeLabel={t("control.panel.removeOne", { name })}
            moveHint={hint}
            drag={editing ? bind(id) : undefined}
          />
        )
        if (editing) return tile
        return (
          <TileMenu key={id} id={id} size={size} title={name} tiles={all} onOpen={onOpen}>
            {tile}
          </TileMenu>
        )
      })}
    </div>
  )
}
