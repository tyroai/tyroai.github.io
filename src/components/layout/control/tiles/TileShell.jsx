import { HugeiconsIcon } from "@hugeicons/react"
import MinusSignIcon from "@hugeicons/core-free-icons/MinusSignIcon"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { tileSize } from "../controlModel"

const LAYOUT = { type: "spring", bounce: 0, duration: 0.32 }

/**
 * Kutucuğun kabı: `size` ızgarada kaç hücre kaplayacağını (kişinin seçtiği ya da varsayılan),
 * `on` simge yuvasının marka rampasıyla dolmasını söyler; `sky` hava kutucuğunun göğü
 * (`.wxd-sky` › `data-weather` · `data-time`). Sağ tık menüsü (`TileMenu`) kendi olaylarını ve
 * ref'ini buraya verir (`...rest`).
 *
 * Düzenlerken: içi önizlemedir (`inert`), sol üstte "−" kaldırır; kutucuk liste öğesidir (adı
 * `name`), sürüklenir ve klavyeyle taşınır (`drag`: `useTileReorder`ın bağları — olaylar, `x`/`y`).
 * Sıra değişince öteki kutucuklar yerlerine kayar (`layout`); taşınan imleci izler.
 */
export function TileShell({
  id,
  size,
  name,
  on = false,
  editing = false,
  onRemove,
  removeLabel,
  moveHint,
  drag,
  sky,
  className,
  children,
  ref,
  ...rest
}) {
  const moving = Boolean(drag?.active)
  const edit = editing && drag?.handlers
  return (
    <motion.div
      ref={ref}
      className={cn("cc-tile", sky && "wxd-sky cc-wx", className)}
      data-size={size ?? tileSize(id)}
      data-tile={id}
      data-on={on ? "" : undefined}
      data-dragging={drag?.dragging ? "" : undefined}
      data-weather={sky?.weather}
      data-time={sky?.time}
      layout={editing && !moving ? "position" : false}
      transition={LAYOUT}
      style={moving ? { x: drag.x, y: drag.y, zIndex: 5 } : undefined}
      role={editing ? "listitem" : undefined}
      aria-label={editing ? name : undefined}
      aria-describedby={edit ? moveHint : undefined}
      {...(edit ? drag.handlers : null)}
      {...rest}
    >
      {editing ? (
        <div inert className="contents">
          {children}
        </div>
      ) : (
        children
      )}
      {editing && (
        <button
          type="button"
          className="cc-remove"
          aria-label={removeLabel}
          title={removeLabel}
          onClick={() => onRemove(id)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <HugeiconsIcon icon={MinusSignIcon} strokeWidth={3} aria-hidden="true" />
        </button>
      )}
    </motion.div>
  )
}
