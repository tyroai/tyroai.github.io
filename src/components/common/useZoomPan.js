import { useEffect, useMemo, useRef, useState } from "react"
import { anchorPan, clampPan, clampZoom, MAX_ZOOM, TAP_ZOOM, ZOOM_STEP } from "@/lib/imageRotate"

const REST = { s: 1, x: 0, y: 0 }
// Dokunuşun "kıpırdamadı" sayıldığı yol ve çift dokunuşun aralığı.
const STILL = 10
const DOUBLE_MS = 320
// Yatay kaydırmayla görsel değiştirme (yalnız 1×'te, dokunmatik).
const SWIPE = 56

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) || 1

/**
 * Işık kutusunda yakınlaştırma ve kaydırma (görsel `frameRef` çerçevesinin ortasında durur;
 * sınırlar ve yakınlaştırma noktası ona göre). Çift tık / çift dokunuş 1× ↔ 2,5× (dokunulan yer
 * yerinde kalır), ctrl/⌘ + tekerlek ve iki parmak yakınlaştırır, büyükken sürükleme ve tekerlek
 * kaydırır. Düğme ve tuş adımları yumuşak (`ease`), el hareketleri anlık. `size`: görselin
 * ölçeksiz kutusu. `resetKey` değişince (başka görsel, döndürme, çerçeve boyu) 1×'e döner.
 * `onSwipe(±1)`: 1×'te parmakla yana kaydırma.
 */
export function useZoomPan({ frameRef, size, resetKey, enabled, onSwipe }) {
  const [z, setZ] = useState({ key: resetKey, ...REST, ease: false })
  const [dragging, setDragging] = useState(false)
  const view = z.key === resetKey ? z : { key: resetKey, ...REST, ease: false }
  if (view !== z) setZ(view)

  // El hareketi olayları çizimler arasında da gelir: güncel değerler ref'te.
  const live = useRef(view)
  const env = useRef({ size, onSwipe })
  useEffect(() => {
    live.current = z
    env.current = { size, onSwipe }
  })

  const api = useMemo(() => {
    const frame = () => {
      const r = frameRef.current?.getBoundingClientRect()
      if (!r) return { cx: 0, cy: 0, width: 1, height: 1 }
      return {
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        width: r.width,
        height: r.height,
      }
    }
    const commit = (next, ease) => {
      const box = env.current.size
      if (!box) return
      const f = frame()
      const s = clampZoom(next.s)
      const v = {
        s,
        x: clampPan(next.x, s, box.width, f.width),
        y: clampPan(next.y, s, box.height, f.height),
      }
      live.current = { ...live.current, ...v, ease }
      setZ((p) => ({ ...p, ...v, ease }))
    }
    const zoomTo = (target, point, ease = true) => {
      const cur = live.current
      const f = frame()
      const s = clampZoom(target)
      const dx = point ? point.x - f.cx : 0
      const dy = point ? point.y - f.cy : 0
      commit({ s, x: anchorPan(dx, cur.x, cur.s, s), y: anchorPan(dy, cur.y, cur.s, s) }, ease)
    }
    const panBy = (dx, dy, ease = true) => {
      const cur = live.current
      commit({ s: cur.s, x: cur.x + dx, y: cur.y + dy }, ease)
    }
    const reset = () => commit(REST, true)
    const toggle = (point) => (live.current.s > 1.01 ? reset() : zoomTo(TAP_ZOOM, point))
    return {
      frame,
      set: commit,
      zoomTo,
      panBy,
      reset,
      toggle,
      zoomIn: () => zoomTo(live.current.s * ZOOM_STEP),
      zoomOut: () => zoomTo(live.current.s / ZOOM_STEP),
    }
  }, [frameRef])

  // Parmaklar ve sürmekte olan hareket (sürükleme ya da iki parmak).
  const pts = useRef(new Map())
  const gesture = useRef(null)
  const lastTap = useRef(null)
  const pointerType = useRef("mouse")
  // Bu dokunuş dizisinde iki parmak oldu mu: iki parmak bitince kalan parmak dokunuş ya da
  // kaydırma sayılmasın.
  const multi = useRef(false)
  // Çift dokunuştan hemen sonra gelen tık: görsel 1×'e küçülünce altına düşen örtüye değip
  // pencereyi kapatmasın.
  const swallowUntil = useRef(0)

  const begin = () => {
    const list = [...pts.current.values()]
    const cur = live.current
    if (list.length >= 2) {
      const [a, b] = list
      gesture.current = { kind: "pinch", d: dist(a, b), m: mid(a, b), s: cur.s, x: cur.x, y: cur.y }
    } else if (list.length === 1 && cur.s > 1) {
      const [a] = list
      gesture.current = { kind: "drag", px: a.x, py: a.y, x: cur.x, y: cur.y }
    } else gesture.current = null
    setDragging(gesture.current?.kind === "drag")
  }

  const handlers = {
    onPointerDown: (e) => {
      pointerType.current = e.pointerType
      if (e.pointerType === "mouse" && e.button !== 0) return
      const p = { x: e.clientX, y: e.clientY }
      pts.current.set(e.pointerId, { ...p, x0: p.x, y0: p.y, t0: e.timeStamp })
      if (pts.current.size > 1) multi.current = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
      begin()
    },
    onPointerMove: (e) => {
      const p = pts.current.get(e.pointerId)
      if (!p) return
      p.x = e.clientX
      p.y = e.clientY
      const g = gesture.current
      if (g?.kind === "pinch") {
        const [a, b] = [...pts.current.values()]
        const m = mid(a, b)
        const s = clampZoom((g.s * dist(a, b)) / g.d)
        const f = api.frame()
        // İki parmağın başta tuttuğu yer, ortaları nereye giderse oraya gelir.
        const x = m.x - f.cx - (s / g.s) * (g.m.x - f.cx - g.x)
        const y = m.y - f.cy - (s / g.s) * (g.m.y - f.cy - g.y)
        api.set({ s, x, y }, false)
      } else if (g?.kind === "drag") {
        api.set({ s: live.current.s, x: g.x + p.x - g.px, y: g.y + p.y - g.py }, false)
      }
    },
    onPointerUp: (e) => end(e, true),
    onPointerCancel: (e) => end(e, false),
    onDoubleClick: (e) => {
      // Dokunmatikte çift dokunuşu `end` yakalar; tarayıcının ardından gelen dblclick'i yok say.
      if (pointerType.current === "mouse") api.toggle({ x: e.clientX, y: e.clientY })
    },
  }

  const end = (e, up) => {
    const p = pts.current.get(e.pointerId)
    pts.current.delete(e.pointerId)
    if (up && p && e.pointerType !== "mouse" && pts.current.size === 0 && !multi.current) {
      const dx = p.x - p.x0
      const dy = p.y - p.y0
      const still = Math.hypot(dx, dy) < STILL && e.timeStamp - p.t0 < 300
      const prev = lastTap.current
      if (still && prev && e.timeStamp - prev.t < DOUBLE_MS && dist(prev, p) < 32) {
        lastTap.current = null
        swallowUntil.current = e.timeStamp + 500
        api.toggle({ x: p.x, y: p.y })
      } else if (still) {
        lastTap.current = { t: e.timeStamp, x: p.x, y: p.y }
      } else if (live.current.s <= 1 && Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) {
        env.current.onSwipe?.(dx < 0 ? 1 : -1)
      }
    }
    if (!pts.current.size) multi.current = false
    begin()
  }

  // ctrl/⌘ + tekerlek (dokunmatik yüzeyde iki parmak) yakınlaştırır; büyükken tekerlek kaydırır.
  // Pasif olmayan dinleyici: tarayıcının sayfa yakınlaştırmasını durdurmak için.
  useEffect(() => {
    const host = enabled ? frameRef.current?.closest("[role=dialog]") : null
    if (!host) return
    const onWheel = (e) => {
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
      const dx = e.deltaX * unit
      const dy = e.deltaY * unit
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        // Fare tekerinin bir çentiği ~100, dokunmatik yüzeyin iki parmağı birkaç birim.
        const k = Math.abs(dy) < 50 ? 0.01 : 0.0025
        api.zoomTo(live.current.s * Math.exp(-dy * k), { x: e.clientX, y: e.clientY }, false)
      } else if (live.current.s > 1) {
        e.preventDefault()
        api.panBy(-dx, -dy, false)
      }
    }
    const onClick = (e) => {
      if (e.timeStamp > swallowUntil.current) return
      e.stopPropagation()
      e.preventDefault()
    }
    host.addEventListener("wheel", onWheel, { passive: false })
    host.addEventListener("click", onClick, true)
    return () => {
      host.removeEventListener("wheel", onWheel)
      host.removeEventListener("click", onClick, true)
    }
  }, [enabled, frameRef, api])

  return {
    enabled,
    scale: view.s,
    x: view.x,
    y: view.y,
    ease: view.ease,
    zoomed: view.s > 1.001,
    dragging,
    canIn: view.s < MAX_ZOOM - 0.001,
    canOut: view.s > 1.001,
    zoomIn: api.zoomIn,
    zoomOut: api.zoomOut,
    reset: api.reset,
    panBy: api.panBy,
    frame: api.frame,
    handlers: enabled ? handlers : {},
  }
}
