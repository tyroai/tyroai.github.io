import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { animate, useMotionValue } from "motion/react"
import { PINNED_LAST } from "./controlModel"

// Fare birkaç piksel kıpırdayınca, dokunmatik kısa basılı tutunca sürüklemeye başlar (kaydırma
// bozulmasın); basılıyken parmak kayarsa sürükleme değil kaydırmadır.
const MOUSE_SLOP = 4
const TOUCH_HOLD_MS = 280
const TOUCH_SLOP = 8
// Yer değiştirdikten sonra kısa bir süre yeni hedef aranmaz: kayan kutucuklar imlecin altından
// geçerken sıra gidip gelmesin.
const SETTLE_MS = 160
const HOME = { type: "spring", bounce: 0, duration: 0.32 }

const KEY_STEP = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }

/** İmlecin altındaki (sürüklenen dışında) kutucuğun kimliği. */
function tileUnder(x, y, self) {
  for (const el of document.elementsFromPoint(x, y)) {
    const id = el.closest?.("[data-tile]")?.getAttribute("data-tile")
    if (id && id !== self) return id
  }
  return null
}

/**
 * Düzenlerken kutucukları taşıma: sürükle (fare hemen, dokunmatik kısa basılı tutunca) ya da
 * klavye (kutucuk odaktayken ok tuşları bir sıra öne/arkaya; yeni yer söylenir). Sıra sürüklerken
 * canlı değişir, öteki kutucuklar yerine kayar (`TileShell` › `layout`); sürüklenen imleci izler
 * ve bırakınca yerine oturur. Kısayollar taşınmaz (`moveTile` onu sonda tutar).
 *
 * `bind(id)` kutucuğun kabına verilecek bağları döndürür: `{ handlers, active, dragging, x, y }`.
 */
export function useTileReorder({ tiles, gridRef, onMove, announce }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [active, setActive] = useState(null)
  const [dragging, setDragging] = useState(false)
  const st = useRef(null)
  // Olay işleyicileri ve kare sonrası duyuru en güncel sırayı okusun.
  const list = useRef(tiles)
  useLayoutEffect(() => {
    list.current = tiles
  }, [tiles])

  const nodeOf = useCallback(
    (id) => gridRef.current?.querySelector(`[data-tile="${CSS.escape(id)}"]`),
    [gridRef],
  )

  // Sıra değişince sürüklenen kutucuk yeni hücresine geçer: transform, imlecin altında kalacak
  // biçimde yeniden hesaplanır (sıçrama olmaz).
  useLayoutEffect(() => {
    const s = st.current
    if (!s?.started) return
    const el = nodeOf(s.id)
    if (!el) return
    const r = el.getBoundingClientRect()
    s.nx = r.left - x.get()
    s.ny = r.top - y.get()
    x.set(s.px - s.gx - s.nx)
    y.set(s.py - s.gy - s.ny)
  }, [tiles, nodeOf, x, y])

  const blockScroll = useCallback((e) => e.preventDefault(), [])

  const start = useCallback(() => {
    const s = st.current
    if (!s || s.started) return
    s.started = true
    setActive(s.id)
    setDragging(true)
    document.addEventListener("touchmove", blockScroll, { passive: false })
  }, [blockScroll])

  const finish = useCallback(() => {
    const s = st.current
    st.current = null
    clearTimeout(s?.timer)
    document.removeEventListener("touchmove", blockScroll)
    if (!s?.started) return
    setDragging(false)
    // Yerine oturunca etkin kutucuk bırakılır (transform sıfırdayken).
    Promise.all([animate(x, 0, HOME), animate(y, 0, HOME)]).then(() =>
      setActive((cur) => (cur === s.id ? null : cur)),
    )
    const at = list.current.indexOf(s.id)
    if (at >= 0 && at !== s.from) announce?.(s.id, at)
  }, [announce, blockScroll, x, y])

  useEffect(() => () => document.removeEventListener("touchmove", blockScroll), [blockScroll])

  const bind = (id) => {
    const movable = id !== PINNED_LAST
    const handlers = movable && {
      tabIndex: 0,
      onPointerDown: (e) => {
        if (e.button !== 0 || st.current) return
        const r = e.currentTarget.getBoundingClientRect()
        const touch = e.pointerType !== "mouse"
        st.current = {
          id,
          from: list.current.indexOf(id),
          pointerId: e.pointerId,
          sx: e.clientX,
          sy: e.clientY,
          px: e.clientX,
          py: e.clientY,
          gx: e.clientX - r.left,
          gy: e.clientY - r.top,
          nx: r.left,
          ny: r.top,
          touch,
          started: false,
          movedAt: 0,
          timer: touch ? setTimeout(start, TOUCH_HOLD_MS) : 0,
        }
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // Etkin olmayan işaretçi (yapay olay): yakalamadan da sürer.
        }
      },
      onPointerMove: (e) => {
        const s = st.current
        if (!s || s.pointerId !== e.pointerId) return
        s.px = e.clientX
        s.py = e.clientY
        const far = Math.hypot(e.clientX - s.sx, e.clientY - s.sy)
        if (!s.started) {
          // Dokunmatikte basılı tutma dolmadan kayarsa kaydırmadır: bırak.
          if (s.touch) {
            if (far > TOUCH_SLOP) finish()
            return
          }
          if (far < MOUSE_SLOP) return
          start()
        }
        x.set(e.clientX - s.gx - s.nx)
        y.set(e.clientY - s.gy - s.ny)
        if (performance.now() - s.movedAt < SETTLE_MS) return
        const over = tileUnder(e.clientX, e.clientY, s.id)
        const to = over ? list.current.indexOf(over) : -1
        if (to < 0 || to === list.current.indexOf(s.id)) return
        s.movedAt = performance.now()
        onMove(s.id, to)
      },
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
      onKeyDown: (e) => {
        const step = KEY_STEP[e.key]
        if (!step || e.target !== e.currentTarget) return
        e.preventDefault()
        const at = list.current.indexOf(id)
        onMove(id, at + step)
        // Yeni yer bir sonraki çizimde belli: sırayı oradan söyle.
        requestAnimationFrame(() => {
          const now = list.current.indexOf(id)
          if (now !== at) announce?.(id, now)
          nodeOf(id)?.focus({ preventScroll: true })
        })
      },
    }
    return {
      handlers: handlers || null,
      active: active === id,
      dragging: dragging && active === id,
      x,
      y,
    }
  }
  return bind
}
