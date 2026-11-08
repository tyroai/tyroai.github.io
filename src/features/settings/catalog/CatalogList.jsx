import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { CatalogRow } from "./CatalogRow"

/**
 * Sıralanabilir liste. Sürükleme yalnız farede ve tam listede (arama/filtre açıkken sıra
 * anlamsız); klavye Alt+↑/↓ ve menü her zaman. Taşınan satır odağını korur, ekran okuyucuya
 * yeni sırası söylenir.
 */
export function CatalogList({
  kind,
  items,
  visible,
  filtered,
  sortMode,
  onOpen,
  onMove,
  onToggle,
  onCopy,
  onDelete,
  onDuplicate,
  onOpenLink,
  onTryChat,
  flashId = null,
  phone = false,
}) {
  const { t } = useLocale()
  const fine = useMediaQuery("(pointer: fine)")
  const reduce = useReducedMotion()
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [announce, setAnnounce] = useState("")
  const listRef = useRef(null)
  const refocus = useRef(null)
  const canDrag = fine && !filtered && !sortMode
  const indexOf = (id) => items.findIndex((x) => x.id === id)

  // Satır DOM'da yer değiştirince odak düşebilir: taşınanı yeniden odakla.
  useEffect(() => {
    const pending = refocus.current
    if (!pending || !listRef.current) return
    refocus.current = null
    const row = listRef.current.querySelector(`[data-row="${CSS.escape(String(pending.id))}"]`)
    const target = row?.querySelector(sortMode ? `[data-step="${pending.delta}"]` : "[data-main]")
    if (target && document.activeElement !== target) target.focus({ preventScroll: false })
  }, [items, sortMode])

  // Yeni kayıt listenin sonuna düşer: görünür alana getir (odak "Yeni" düğmesine döner).
  useEffect(() => {
    if (!flashId || !listRef.current) return
    const row = listRef.current.querySelector(`[data-row="${CSS.escape(String(flashId))}"]`)
    row?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" })
  }, [flashId, reduce])

  function move(item, delta) {
    const from = indexOf(item.id)
    const to = from + delta
    if (from < 0 || to < 0 || to >= items.length) return
    refocus.current = { id: item.id, delta }
    setAnnounce(
      t("settings.catalog.sort.moved")
        .replace("{name}", item.name)
        .replace("{n}", to + 1),
    )
    onMove(from, to, item)
  }

  function dragFor(item) {
    if (!canDrag) return undefined
    return {
      draggable: true,
      onDragStart: (e) => {
        setDragId(item.id)
        e.dataTransfer.effectAllowed = "move"
        // Firefox veri olmadan sürüklemeyi başlatmaz.
        e.dataTransfer.setData("text/plain", String(item.id))
      },
      onDragOver: (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        if (overId !== item.id) setOverId(item.id)
      },
      onDrop: (e) => {
        e.preventDefault()
        const from = indexOf(dragId)
        const to = indexOf(item.id)
        if (from >= 0 && to >= 0 && from !== to) onMove(from, to, items[from])
        setDragId(null)
        setOverId(null)
      },
      onDragEnd: () => {
        setDragId(null)
        setOverId(null)
      },
    }
  }

  return (
    <>
      <ul ref={listRef} className="divide-y divide-border/60">
        {visible.map((item) => (
          <CatalogRow
            key={item.id}
            item={item}
            kind={kind}
            position={indexOf(item.id) + 1}
            count={items.length}
            sortMode={sortMode}
            compact={phone}
            drag={dragFor(item)}
            dragging={dragId === item.id}
            dropTarget={overId === item.id && dragId !== null && dragId !== item.id}
            flash={flashId != null && String(flashId) === String(item.id)}
            onOpen={() => onOpen(item)}
            onMove={(delta) => move(item, delta)}
            onToggle={() => onToggle(item)}
            onCopy={onCopy}
            onDelete={() => onDelete(item)}
            menu={{
              phone,
              onDuplicate: () => onDuplicate(item),
              onOpenLink: () => onOpenLink(item),
              onTryChat: () => onTryChat(item),
            }}
          />
        ))}
      </ul>
      <p aria-live="polite" data-catalog-live="" className="sr-only">
        {announce}
      </p>
    </>
  )
}
