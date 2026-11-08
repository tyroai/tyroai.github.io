import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence } from "motion/react"
import { useSearchParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { AddTile, DropTile } from "./AddTile"
import { EditableCard } from "./EditableCard"
import { EAGER_CARDS, EMPTY, useFarCards } from "./lazyCards"
import { useWidgetEditor } from "./widgetEditorContext"

// Kartlar oturumun ilk açılışında sırayla belirir (bölge başına, en çok ~0,8 sn); sonraki
// ziyaretlerde ve düzenlerken anında — her dönüşte tekrar eden açılış gösterisi yorar.
let entered = false

/**
 * Izgaranın o anki sütun sayısı — kap sorgusu CSS'te, sayı buradan. Boyamadan önce okunur: kartın
 * boyu (`slotSize`) tek sütunda değişir, ilk karede yanlış düzen görünmesin.
 */
function useColumns(ref, ready) {
  const [cols, setCols] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return undefined
    const read = () =>
      setCols(getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean).length || 1)
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, ready])
  return cols
}

/**
 * Bir bölgenin ızgarası. Boş alana bırakılan kart bölgenin sonuna geçer; sürüklerken sonda görünür
 * bir bırakma yeri ("Buraya bırak", `DropTile`) — sol sütunun boşluğu da hedef olsun.
 * "Widget ekle" kutusu (kataloğu açar): diğerlerde son satırdaki boşlukta (her zaman); ana bölümde
 * ve sol sütunda düzenlerken sonda (sol sütuna da doğrudan eklenebilsin).
 */
export function ZoneGrid({ zone, className, render }) {
  const { editing, drag, setDrag, setOver, layout, actions } = useWidgetEditor()
  const items = layout.items.filter((x) => x.zone === zone)
  const grid = useRef(null)
  const cols = useColumns(grid, items.length > 0)
  const cells = items.reduce((n, x) => n + (zone !== "left" && x.wide ? Math.min(2, cols) : 1), 0)
  const holes = items.length ? (cols - (cells % cols)) % cols : cols
  let tile = 0
  if (zone === "more") tile = holes
  else if (editing) tile = 1
  const dropping = editing && drag != null
  // Yalnız ilk çizimdeki kartlar: sonradan eklenen kart her zamanki gibi yerinde büyür.
  const [firstIds] = useState(() => (entered ? null : new Set(items.map((x) => x.id))))
  useEffect(() => {
    entered = true
  }, [])
  // Ekranın altındaki kartlar sonra çizilir (`lazyCards.js`); düzenlerken ve turda hepsi hemen.
  const [params] = useSearchParams()
  const far = useFarCards(grid, editing || params.has("tour"), items.length > EAGER_CARDS)

  return (
    <div
      ref={grid}
      data-zone={zone}
      onDragOver={(e) => {
        if (drag != null) e.preventDefault()
      }}
      onDrop={(e) => {
        if (drag == null) return
        e.preventDefault()
        actions.dropZone(drag, zone)
        setDrag(null)
        setOver(null)
      }}
      className={cn(className, editing && "pointer-coarse:pt-2")}
    >
      <AnimatePresence initial={firstIds != null} mode="popLayout">
        {items.map((item, i) => (
          <EditableCard
            key={item.id}
            item={item}
            render={render}
            single={cols === 1}
            enter={firstIds?.has(item.id) ? i : null}
            far={i < EAGER_CARDS ? EMPTY : far}
            order={i}
          />
        ))}
      </AnimatePresence>
      {dropping ? (
        <DropTile style={{ gridColumn: `span ${tile || 1} / span ${tile || 1}` }} />
      ) : (
        tile > 0 && (
          <AddTile
            hidden={layout.hidden}
            onOpen={() => actions.openCatalog(zone)}
            style={{ gridColumn: `span ${tile} / span ${tile}` }}
          />
        )
      )}
    </div>
  )
}
