/*
 * Morph select — Arc (uiarc.dev) › morph-select bileşeninden JSX'e uyarlandı.
 *
 * MIT License · Copyright (c) 2026 Elia Kuratli
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions: The above copyright
 * notice and this permission notice shall be included in all copies or substantial portions of
 * the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * Uyarlama: form alanı biçimi — tetik kabın tamamını kaplar, açılınca aynı yüzey aşağı doğru
 * listeye büyür (gerekirse `panelWidth` kadar genişler; altta yer yoksa yukarı). İkonlar Hugeicons, renkler temadan,
 * CSS modülü yerine Tailwind; arama Türkçe harfleri katlar (ı/i, ş/s…).
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { filterSections, foldText, normalizeItems, optionMatches, realValue } from "@/lib/optionItems"
import { cn } from "@/lib/utils"

const ENTER = [0.16, 1, 0.3, 1]
const STANDARD = [0.22, 1, 0.36, 1]
// Süreli yaylar katılık/sönüm olarak: yarıda yön değişirse hız korunur.
const physical = (duration, bounce) => {
  const root = (2 * Math.PI) / (duration * 1.2)
  return { type: "spring", stiffness: root * root, damping: 2 * (1 - bounce) * root, mass: 1 }
}
const GROW = physical(0.4, 0.12)
const SHRINK = physical(0.34, 0)
const GLIDE = physical(0.28, 0.08)
const WIDTH = physical(0.42, 0.16)
const NARROW = physical(0.42, 0)
const FLY = physical(0.3, 0.06)
const RADIUS = { closed: 12, open: 16 }
const TYPEAHEAD_RESET = 600
const PAGE = 8

const VALUE = {
  enter: (c) =>
    c.fly
      ? { opacity: 1, x: c.fly.x, y: c.fly.y, filter: "blur(0px)" }
      : { opacity: 0, x: 0, y: `${c.dir * 0.5}em`, filter: "blur(4px)" },
  rest: { opacity: 1, x: 0, y: 0, filter: "blur(0px)" },
  exit: (c) => ({
    opacity: 0,
    x: 0,
    y: c.fly ? "-0.3em" : `${c.dir * -0.45}em`,
    filter: "blur(2px)",
    transition: { duration: 0.12, ease: STANDARD },
  }),
}
const FADE = {
  enter: { opacity: 0 },
  rest: { opacity: 1, x: 0, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, transition: { duration: 0.1 } },
}

const DEFAULT_STRINGS = {
  clear: "Clear search",
  close: "Close list",
  empty: (q) => `No matches for “${q}”`,
  count: (n) => `${n}`,
}

/**
 * Tetiği listeye dönüşen seçici: açılınca tetik yüzeyi listeye büyür, vurgu seçenekler arasında
 * kayar, seçilen etiket listeden kalkıp tetiğe oturur. Gruplar, harf atlaması, uzun listede arama
 * ve listbox klavye düzeni (oklar, Home/End, PageUp/Down, Enter, Escape, Tab).
 * `items`: `{ value, label, meta?, keywords?, icon?, disabled?, aliasOf? }` ya da `{ label, options: […],
 * hideOnSearch? }`. İsteğe bağlı: `aliasOf` başka bir seçeneğin kopyası (ör. "son kullanılanlar"
 * bölümü; kendi `value`'su tekil olmalı) — seçilince asıl değer seçilir; `hideOnSearch` bölümü
 * aramada gizler (sonuçlar iki kez görünmesin).
 * Etiket dışarıda çiziliyorsa `labelledBy`; tetiğin kimliği `id` (form etiketi ve hata odağı için).
 * Escape yalnız listeyi kapatır (yayılmaz; açıkken kök `data-morph-open` taşır).
 */
export function MorphSelect({
  id,
  label,
  labelledBy,
  items,
  value,
  defaultValue = null,
  onValueChange,
  placeholder = "Select",
  searchable = "auto",
  searchPlaceholder,
  panelWidth = 0,
  maxListHeight = 296,
  align = "start",
  disabled = false,
  invalid = false,
  describedBy,
  strings: stringsProp,
  className,
}) {
  const strings = { ...DEFAULT_STRINGS, ...stringsProp }
  const reduced = Boolean(useReducedMotion())
  const uid = useId().replace(/:/g, "")
  const ownLabelId = `${uid}-label`
  const labelId = labelledBy ?? ownLabelId
  const listId = `${uid}-list`
  const optionId = (i) => `${uid}-o${i}`

  const rootRef = useRef(null)
  const anchorRef = useRef(null)
  const lidRef = useRef(null)
  const faceRef = useRef(null)
  const scrollRef = useRef(null)
  const triggerRef = useRef(null)
  const inputRef = useRef(null)
  const slotRef = useRef(null)
  const seeRef = useRef(null)
  const optionRefs = useRef(new Map())

  const sections = useMemo(() => normalizeItems(items), [items])
  const all = useMemo(() => sections.flatMap((s) => s.options), [sections])
  const indexOf = useMemo(() => new Map(all.map((o, i) => [o.value, i])), [all])
  const canSearch = searchable === "auto" ? all.length > 8 : searchable

  const [inner, setInner] = useState(defaultValue)
  const selected = value !== undefined ? value : inner
  const selectedOption = selected == null ? undefined : all.find((o) => o.value === selected)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(null)
  const [change, setChange] = useState({ key: 0, value: null, dir: 1, fly: null })
  const [announcement, setAnnouncement] = useState("")

  const needle = foldText(query.trim())
  const visible = useMemo(() => filterSections(sections, needle), [needle, sections])
  const enabled = useMemo(() => visible.flatMap((s) => s.options).filter((o) => !o.disabled), [visible])
  const current =
    active !== null && enabled.some((o) => o.value === active) ? active : (enabled[0]?.value ?? null)
  const resultCount = visible.reduce((n, s) => n + s.options.length, 0)

  /* Tek yüzey: genişlik, yükseklik ve köşe yayla tetikle açık liste arasında gider. */
  const shapeW = useMotionValue("100%")
  const shapeH = useMotionValue("100%")
  const radius = useMotionValue(RADIUS.closed)
  const sizes = useRef({ trigger: 0, lid: 0, listW: 0, listH: 0 })
  const live = useRef({ open: false, reduced: false, measured: false })
  useLayoutEffect(() => {
    live.current.reduced = reduced
  }, [reduced])

  const place = useCallback(
    (animated) => {
      const { trigger, lid, listW, listH } = sizes.current
      if (!trigger || !lid) return
      const isOpen = live.current.open
      const next = isOpen
        ? { w: Math.max(trigger, listW), h: lid + listH, r: RADIUS.open }
        : { w: trigger, h: lid, r: RADIUS.closed }
      if (!animated || live.current.reduced || !live.current.measured) {
        shapeW.jump(next.w)
        shapeH.jump(next.h)
        radius.jump(next.r)
        live.current.measured = true
        return
      }
      const lastW = typeof shapeW.get() === "number" ? shapeW.get() : next.w
      const lastH = typeof shapeH.get() === "number" ? shapeH.get() : next.h
      const spring = next.w * next.h >= lastW * lastH ? GROW : SHRINK
      animate(shapeW, next.w, isOpen ? spring : next.w < lastW ? NARROW : WIDTH)
      animate(shapeH, next.h, spring)
      animate(radius, next.r, spring)
    },
    [radius, shapeH, shapeW],
  )

  const read = useCallback(() => {
    const anchor = anchorRef.current
    const face = faceRef.current
    const lid = lidRef.current
    if (!anchor || !face || !lid) return null
    const w = anchor.offsetWidth
    rootRef.current?.style.setProperty("--ms-trigger-w", `${w}px`)
    return { trigger: w, lid: lid.offsetHeight, listW: face.offsetWidth, listH: face.offsetHeight }
  }, [])

  useLayoutEffect(() => {
    const measure = () => {
      const next = read()
      if (!next) return
      const prev = sizes.current
      const changed =
        next.trigger !== prev.trigger ||
        next.lid !== prev.lid ||
        (live.current.open && (next.listW !== prev.listW || next.listH !== prev.listH))
      sizes.current = next
      if (changed) place(live.current.measured)
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(anchorRef.current)
    observer.observe(faceRef.current)
    return () => observer.disconnect()
  }, [place, read])

  // Liste kaydırılan kabın (form gövdesi) dibine sığsın, alt çerçeveye değmesin: önce kabın alt
  // dolgusu açılır (kap büyüyebiliyorsa pencere aşağı uzar). Yine sığmazsa (uzun masraf
  // tablosunun son satırı) ve tetiğin üstünde daha çok yer varsa liste yukarı açılır; o da
  // yetmezse liste kalan yere kısalır (taban 120 px). Kapanınca dolgu geri alınır.
  const [up, setUp] = useState(false)
  const padRef = useRef(null)
  const unpad = useCallback(() => {
    const pad = padRef.current
    if (!pad) return
    pad.box.style.paddingBottom = pad.was
    padRef.current = null
  }, [])
  const fitList = useCallback(() => {
    const root = rootRef.current
    const anchor = anchorRef.current
    const face = faceRef.current
    const list = scrollRef.current
    if (!root || !anchor || !face || !list) return false
    root.style.setProperty("--ms-list-max", `${maxListHeight}px`)
    let box = root.parentElement
    while (box && box !== document.body) {
      const oy = getComputedStyle(box).overflowY
      if (oy === "auto" || oy === "scroll") break
      box = box.parentElement
    }
    if (box === document.body) box = null
    unpad()
    const lid = lidRef.current?.offsetHeight ?? 0
    const GAP = 20
    const need = lid + face.offsetHeight + GAP
    // Görünür pencere: kaydırılan kap (yoksa ekran), ekranla kesişimi.
    const bounds = () => {
      const r = box?.getBoundingClientRect()
      return { top: Math.max(0, r?.top ?? 0), bottom: Math.min(window.innerHeight, r?.bottom ?? Infinity) }
    }
    let extra = 0
    let pad = 0
    if (box) {
      // Listenin dibi ile kabın İÇERİĞİNİN dibi (son çocuk + alt dolgu) arasındaki açık.
      const last = box.lastElementChild?.getBoundingClientRect().bottom ?? 0
      pad = parseFloat(getComputedStyle(box).paddingBottom) || 0
      extra = anchor.getBoundingClientRect().top + need - (last + pad)
      if (extra > 0) {
        padRef.current = { box, was: box.style.paddingBottom }
        box.style.paddingBottom = `${pad + extra}px`
      }
    }
    const over = anchor.getBoundingClientRect().top + need - bounds().bottom
    if (over <= 0) {
      setUp(false)
      return false
    }
    // Aşağıda yer yok: dolgu geri alınır (pencere ortalıysa tetik yerine döner), üstteki yer ölçülür.
    unpad()
    const overUp = bounds().top + need - anchor.getBoundingClientRect().bottom
    const flip = overUp < over
    setUp(flip)
    const cut = flip ? overUp : over
    // Aşağı açılıp kısalan listede büyüyemeyen dolgu geri alınmış kalır (boş kaydırma çubuğu olmasın).
    if (!flip && box && extra > 0) {
      padRef.current = { box, was: box.style.paddingBottom }
      box.style.paddingBottom = `${Math.max(pad, pad + extra - over)}px`
    }
    if (cut > 0) root.style.setProperty("--ms-list-max", `${Math.max(120, list.offsetHeight - cut)}px`)
    return flip
  }, [maxListHeight, unpad])
  useEffect(() => unpad, [unpad])

  useLayoutEffect(() => {
    if (live.current.open === open) return
    live.current.open = open
    // Yön yalnız açılışta seçilir: kapanırken yüzey aynı kenara katlansın.
    const flip = open ? fitList() : false
    if (!open) unpad()
    sizes.current = read() ?? sizes.current
    place(true)
    // Kaydırılan kapta (form gövdesi) açılan liste görünür alana gelsin.
    const see = seeRef.current
    if (!see) return
    // Kapanınca işaret de söner: yüksekliği kalırsa kapta boş bir kaydırma payı bırakır.
    if (!open) {
      see.style.height = ""
      see.style.top = ""
      return
    }
    see.style.height = `${sizes.current.lid + sizes.current.listH}px`
    // Yukarı açılan listede işaret tetiğin üstüne uzanır.
    if (flip) see.style.top = `${-sizes.current.listH}px`
    see.scrollIntoView?.({ block: "nearest", behavior: reduced ? "auto" : "smooth" })
  }, [open, place, read, reduced, fitList, unpad])

  /* Vurgu seçenekler arasında kendi yayıyla kayar; etkin seçenek yokken söner. */
  const hy = useMotionValue(0)
  const hh = useMotionValue(0)
  const ho = useMotionValue(0)
  const scrollIntent = useRef(false)
  useLayoutEffect(() => {
    const node = open && current !== null ? optionRefs.current.get(current) : undefined
    if (!node) {
      animate(ho, 0, { duration: reduced || !open ? 0 : 0.12, ease: STANDARD })
      return
    }
    const top = node.offsetTop
    const height = node.offsetHeight
    if (ho.get() < 0.05 || reduced) {
      hy.jump(top)
      hh.jump(height)
    } else {
      animate(hy, top, GLIDE)
      animate(hh, height, GLIDE)
    }
    animate(ho, 1, { duration: reduced ? 0 : 0.12, ease: ENTER })
    const scroller = scrollRef.current
    if (scroller && scrollIntent.current) {
      scrollIntent.current = false
      const pad = 6
      if (top < scroller.scrollTop + pad) scroller.scrollTop = top - pad
      else if (top + height > scroller.scrollTop + scroller.clientHeight - pad)
        scroller.scrollTop = top + height - scroller.clientHeight + pad
    }
  }, [current, hh, ho, hy, open, reduced, visible])

  /* Odak kapakta kalır: aramalı listede arama kutusu, değilse etkin seçeneği taşıyan tetik. */
  const pendingFocus = useRef(null)
  useLayoutEffect(() => {
    const target = pendingFocus.current
    pendingFocus.current = null
    if (target === "input") inputRef.current?.focus({ preventScroll: true })
    if (target === "trigger") triggerRef.current?.focus({ preventScroll: true })
  }, [open])

  const typeahead = useRef({ buffer: "", at: 0 })
  // Boşluk keydown'da açar/seçer; keyup'taki tıklama bunu geri almasın.
  const suppressClick = useRef(false)
  const touchOpen = useRef(false)

  const openList = (focus, seed = "") => {
    if (disabled || open) return
    setQuery(seed)
    // Seçili değerin ilk görünümü etkin olur (kopyası üstteyse liste kaymadan orada açılır).
    const first = all.find((o) => realValue(o) === selected)?.value ?? selected
    setActive(focus !== undefined ? focus : first)
    scrollIntent.current = true
    // Dokunuşla açılan aramalı listede ekran klavyesi kendiliğinden açılıp listeyi örtmesin.
    pendingFocus.current = canSearch ? (touchOpen.current ? null : "input") : "trigger"
    setAnnouncement("")
    setOpen(true)
  }

  const close = useCallback((restoreFocus) => {
    typeahead.current.buffer = ""
    if (restoreFocus) pendingFocus.current = "trigger"
    setOpen(false)
  }, [])

  const commit = (option, source) => {
    if (!option || option.disabled) return
    const target = realValue(option)
    if (target !== selected) {
      let fly = null
      const slot = slotRef.current
      const part = source?.querySelector("[data-part='value']")
      if (!reduced && part && slot) {
        const from = part.getBoundingClientRect()
        const to = slot.getBoundingClientRect()
        fly = { x: from.left - to.left, y: from.top + from.height / 2 - (to.top + to.height / 2) }
      }
      const from = selected == null ? -1 : (indexOf.get(selected) ?? -1)
      const to = indexOf.get(target) ?? 0
      const dir = from < 0 ? 1 : Math.sign(to - from) || 1
      setChange((c) => ({ key: c.key + 1, value: target, dir, fly }))
      if (value === undefined) setInner(target)
      onValueChange?.(target, option)
    }
    close(true)
  }

  const typeTo = (char) => {
    const now = performance.now()
    const state = typeahead.current
    state.buffer = now - state.at > TYPEAHEAD_RESET ? char : state.buffer + char
    state.at = now
    const buffer = foldText(state.buffer)
    const repeated = buffer.split("").every((c) => c === buffer[0])
    const search = repeated ? buffer[0] : buffer
    const pool = all.filter((o) => !o.disabled)
    const at = pool.findIndex((o) => o.value === (open ? current : selected))
    const offset = repeated || buffer.length === 1 ? 1 : 0
    const ordered = [...pool.slice(at + offset), ...pool.slice(0, at + offset)]
    return ordered.find((o) => foldText(o.label).startsWith(search))
  }

  const move = (to) => {
    if (to == null) return
    scrollIntent.current = true
    setActive(to)
  }

  const onKey = (e, fromInput) => {
    const { key } = e
    touchOpen.current = false
    if (key === " " && !fromInput) suppressClick.current = true
    const printable = key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey
    const typing =
      performance.now() - typeahead.current.at < TYPEAHEAD_RESET && typeahead.current.buffer.length > 0

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter"].includes(key) || (key === " " && !typing)) {
        e.preventDefault()
        openList()
      } else if (key === "Home" || key === "End") {
        e.preventDefault()
        const pool = all.filter((o) => !o.disabled)
        openList((key === "Home" ? pool[0] : pool[pool.length - 1])?.value ?? null)
      } else if (printable) {
        e.preventDefault()
        if (canSearch) openList(undefined, key)
        else openList(typeTo(key)?.value ?? selected)
      }
      return
    }

    const at = enabled.findIndex((o) => o.value === current)
    const caretKeys = fromInput && query.length > 0
    const pick = () => commit(enabled[at], optionRefs.current.get(current ?? ""))
    switch (key) {
      case "ArrowDown":
        e.preventDefault()
        return move(enabled[Math.min(enabled.length - 1, at + 1)]?.value)
      case "ArrowUp":
        e.preventDefault()
        if (e.altKey) return pick()
        return move(enabled[Math.max(0, at - 1)]?.value)
      case "PageDown":
        e.preventDefault()
        return move(enabled[Math.min(enabled.length - 1, at + PAGE)]?.value)
      case "PageUp":
        e.preventDefault()
        return move(enabled[Math.max(0, at - PAGE)]?.value)
      case "Home":
      case "End":
        if (caretKeys) return
        e.preventDefault()
        return move(enabled[key === "Home" ? 0 : enabled.length - 1]?.value)
      case "Enter":
        e.preventDefault()
        return pick()
      case "Escape":
        e.preventDefault()
        e.stopPropagation()
        return close(true)
      case "Tab":
        return close(false)
    }
    if (fromInput) return
    if (key === " " && !typing) {
      e.preventDefault()
      return pick()
    }
    if (printable) {
      e.preventDefault()
      move(typeTo(key)?.value)
    }
  }

  // Dışarı basış ya da odağın çıkması listeyi tetiğe geri katlar.
  useEffect(() => {
    if (!open) return
    const down = (e) => !rootRef.current?.contains(e.target) && close(false)
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [close, open])
  const onBlur = (e) => {
    const next = e.relatedTarget
    if (open && next && !e.currentTarget.contains(next)) close(false)
  }

  const onQuery = (next) => {
    setQuery(next)
    setActive(null)
    scrollIntent.current = true
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    const text = foldText(next.trim())
    const pool = sections.flatMap((s) => (s.hideOnSearch ? [] : s.options))
    const count = text ? pool.filter((o) => optionMatches(o, text)).length : all.length
    setAnnouncement(text ? (count ? strings.count(count) : strings.empty(next.trim())) : "")
  }

  const renderValue = (o) =>
    o ? (
      <>
        {o.icon && (
          <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center text-muted-foreground">
            {o.icon}
          </span>
        )}
        <span className="min-w-0 truncate">{o.label}</span>
      </>
    ) : (
      <span className="truncate font-normal text-muted-foreground">{placeholder}</span>
    )

  const showSearch = open && canSearch
  const layer = change.value === selected ? change : { ...change, fly: null }
  const end = align === "end"
  // Yukarı açılış satır içi stille (yeni sınıf yok): yüzey ve kapak alttan tutunur, liste kapağın
  // üstünde, ayraç listenin altında.
  const edge = up ? { top: "auto", bottom: 0 } : undefined

  return (
    <div
      ref={rootRef}
      data-ms-root=""
      data-morph-open={open || undefined}
      data-invalid={invalid || undefined}
      onBlur={onBlur}
      style={{ "--ms-panel-w": `${panelWidth}px`, "--ms-list-max": `${maxListHeight}px` }}
      className={cn(
        "group/ms relative w-full min-w-0 text-[0.875rem] [--ms-h:2.5rem] pointer-coarse:[--ms-h:2.75rem]",
        open && "z-30",
        className,
      )}
    >
      {!labelledBy && (
        <span id={ownLabelId} className="sr-only">
          {label}
        </span>
      )}
      <div ref={anchorRef} className="relative h-(--ms-h) w-full">
        <span ref={seeRef} aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0" />
        <motion.div
          data-ms-shape=""
          style={{ width: shapeW, height: shapeH, borderRadius: radius, ...edge }}
          className={cn(
            "absolute top-0 overflow-clip bg-background shadow-xs transition-[background-color,box-shadow] duration-200",
            "after:pointer-events-none after:absolute after:inset-0 after:z-[2] after:rounded-[inherit] after:border after:border-border after:transition-colors",
            "has-[[data-ms-trigger]:focus-visible]:ring-2 has-[[data-ms-trigger]:focus-visible]:ring-brand/25 has-[[data-ms-trigger]:focus-visible]:after:border-brand/60",
            "group-data-[invalid]/ms:ring-2 group-data-[invalid]/ms:ring-destructive/15 group-data-[invalid]/ms:after:border-destructive/70",
            end ? "end-0" : "start-0",
            open
              ? "bg-popover shadow-lg ring-0 after:border-border"
              : !disabled && "pointer-fine:hover:after:border-foreground/25",
            disabled && "opacity-55",
          )}
        >
          <div ref={lidRef} style={edge} className="absolute inset-x-0 top-0 z-[1] h-(--ms-h)">
            <button
              ref={triggerRef}
              id={id}
              type="button"
              role="combobox"
              data-ms-trigger=""
              aria-labelledby={id ? `${labelId} ${id}` : labelId}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={listId}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              aria-activedescendant={
                open && !canSearch && current !== null ? optionId(indexOf.get(current) ?? 0) : undefined
              }
              disabled={disabled}
              inert={showSearch || undefined}
              tabIndex={showSearch ? -1 : 0}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false
                  return
                }
                if (open) close(true)
                else openList()
              }}
              onPointerDown={(e) => (touchOpen.current = e.pointerType === "touch")}
              onKeyDown={(e) => onKey(e, false)}
              onKeyUp={(e) => {
                if (e.key === " ") window.setTimeout(() => (suppressClick.current = false))
              }}
              className="absolute inset-0 flex w-full cursor-pointer items-center gap-2 bg-transparent pe-9 ps-3 text-start font-medium whitespace-nowrap outline-none [-webkit-tap-highlight-color:transparent] [touch-action:manipulation] disabled:cursor-not-allowed"
            >
              <span ref={slotRef} className={cn("relative block h-full min-w-0 flex-1", showSearch && "opacity-0")}>
                <AnimatePresence initial={false} custom={layer}>
                  <motion.span
                    key={selected ?? "__empty"}
                    custom={layer}
                    variants={reduced ? FADE : VALUE}
                    initial="enter"
                    animate="rest"
                    exit="exit"
                    transition={
                      reduced
                        ? { duration: 0.12 }
                        : layer.fly
                          ? { x: FLY, y: FLY, opacity: { duration: 0 } }
                          : { y: GLIDE, opacity: { duration: 0.2, ease: ENTER }, filter: { duration: 0.22, ease: ENTER } }
                    }
                    className="absolute inset-0 flex min-w-0 items-center gap-2"
                  >
                    {renderValue(selectedOption)}
                  </motion.span>
                </AnimatePresence>
              </span>
            </button>

            {canSearch && (
              <motion.div
                inert={!showSearch || undefined}
                initial={false}
                animate={showSearch ? { opacity: 1, filter: "blur(0px)" } : { opacity: 0, filter: reduced ? "blur(0px)" : "blur(2px)" }}
                transition={showSearch ? { duration: 0.18, ease: ENTER, delay: reduced ? 0 : 0.04 } : { duration: 0.1, ease: STANDARD }}
                className={cn("absolute inset-0 flex items-center gap-2 pe-0.5 ps-3", !showSearch && "pointer-events-none")}
              >
                <HugeiconsIcon icon={Search01Icon} aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                <input
                  ref={inputRef}
                  type="text"
                  role="combobox"
                  aria-labelledby={labelId}
                  aria-expanded={open}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={open && current !== null ? optionId(indexOf.get(current) ?? 0) : undefined}
                  placeholder={searchPlaceholder ?? selectedOption?.label}
                  value={query}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => onQuery(e.target.value)}
                  onKeyDown={(e) => onKey(e, true)}
                  className="no-ios-zoom h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                />
                <AnimatePresence initial={false}>
                  {query && (
                    <motion.button
                      key="clear"
                      type="button"
                      aria-label={strings.clear}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onQuery("")
                        inputRef.current?.focus()
                      }}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.1 } }}
                      transition={reduced ? { duration: 0 } : GLIDE}
                      className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground/[0.08] text-muted-foreground hover:text-foreground"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                    </motion.button>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  aria-label={strings.close}
                  onClick={() => close(true)}
                  className="size-9 shrink-0 rounded-full pointer-fine:hover:bg-foreground/[0.08] pointer-coarse:size-11"
                />
              </motion.div>
            )}

            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{ rotate: open ? 180 : 0 }}
              transition={reduced ? { duration: 0 } : GLIDE}
              className="pointer-events-none absolute end-3 top-1/2 -mt-2 grid size-4 place-items-center text-muted-foreground"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" strokeWidth={1.8} />
            </motion.span>
          </div>

          <motion.div
            ref={faceRef}
            inert={!open || undefined}
            aria-hidden={!open || undefined}
            initial={false}
            animate={open ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: reduced ? 0 : up ? 6 : -6, filter: reduced ? "blur(0px)" : "blur(2px)" }}
            transition={
              open
                ? { y: GROW, opacity: { duration: 0.2, ease: ENTER, delay: reduced ? 0 : 0.04 }, filter: { duration: 0.22, ease: ENTER, delay: 0.04 } }
                : { duration: 0.1, ease: STANDARD }
            }
            style={up ? { top: "auto", bottom: "var(--ms-h)", paddingTop: "0.375rem", paddingBottom: 0 } : undefined}
            className={cn(
              "absolute top-(--ms-h) w-[max(var(--ms-trigger-w),min(var(--ms-panel-w),calc(100vw-2rem)))] px-1.5 pb-1.5",
              end ? "end-0" : "start-0",
              !open && "pointer-events-none",
            )}
          >
            <span
              aria-hidden="true"
              style={{ insetInline: "0.875rem", ...(up ? { bottom: 0 } : { top: 0 }) }}
              className="pointer-events-none absolute h-px bg-border/70"
            />
            {/* Kayan kap listbox'ın kendisi: odak arama kutusunda kalır (aria-activedescendant),
                açık bir combobox'ın listesi olarak tanınır (axe: scrollable-region-focusable). */}
            <div ref={scrollRef} id={listId} role="listbox" aria-labelledby={labelId} style={up ? { paddingTop: 0, paddingBottom: "0.375rem" } : undefined} className={cn(
                "max-h-(--ms-list-max) overflow-x-hidden overscroll-contain pt-1.5 [scrollbar-width:thin]",
                // Kapalı liste kaydırılamaz (inert): klavyeyle ulaşılamayan kayan bölge kalmasın.
                open ? "overflow-y-auto" : "overflow-y-hidden",
              )}>
              <div className="relative grid grid-cols-[minmax(0,1fr)] gap-0.5">
                <motion.span
                  aria-hidden="true"
                  style={{ y: hy, height: hh, opacity: ho }}
                  className="pointer-events-none absolute inset-x-0 top-0 rounded-[0.625rem] bg-foreground/[0.065]"
                />
                {visible.map((section) => {
                  const rows = section.options.map((o) => {
                    const index = indexOf.get(o.value) ?? 0
                    const isSelected = realValue(o) === selected
                    return (
                      <div
                        key={o.value}
                        id={optionId(index)}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={o.disabled || undefined}
                        data-active={o.value === current || undefined}
                        ref={(node) => {
                          if (node) optionRefs.current.set(o.value, node)
                          else optionRefs.current.delete(o.value)
                        }}
                        onPointerMove={(e) => {
                          if (e.pointerType === "mouse" && !o.disabled && o.value !== current) setActive(o.value)
                        }}
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={(e) => commit(o, e.currentTarget)}
                        className={cn(
                          "relative flex min-h-9 cursor-pointer items-center gap-2 rounded-[0.625rem] pe-2.5 ps-2 text-foreground/75 select-none transition-colors pointer-coarse:min-h-11",
                          "data-[active]:text-foreground aria-selected:text-foreground aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
                        )}
                      >
                        <span data-part="value" className="flex min-w-0 flex-1 items-center gap-2 font-medium">
                          {o.icon && (
                            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center text-muted-foreground">
                              {o.icon}
                            </span>
                          )}
                          <span className="min-w-0 truncate">{o.label}</span>
                        </span>
                        {o.meta && (
                          <span className="max-w-[55%] shrink-0 truncate text-[0.75rem] text-muted-foreground tabular-nums">
                            {o.meta}
                          </span>
                        )}
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          aria-hidden="true"
                          strokeWidth={2}
                          className={cn(
                            "size-4 shrink-0 text-brand-ink transition-[opacity,transform] duration-200 motion-reduce:transition-none",
                            isSelected ? "scale-100 opacity-100" : "scale-60 opacity-0",
                          )}
                        />
                      </div>
                    )
                  })
                  return section.label ? (
                    <div key={section.key} role="group" aria-labelledby={`${uid}-${section.key}`} className="grid grid-cols-[minmax(0,1fr)] gap-0.5 [&+&]:mt-1">
                      <div id={`${uid}-${section.key}`} role="presentation" className="px-2.5 pb-1 pt-2 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
                        {section.label}
                      </div>
                      {rows}
                    </div>
                  ) : (
                    <div key={section.key} role="presentation" className="grid grid-cols-[minmax(0,1fr)] gap-0.5 [&+&]:mt-1">
                      {rows}
                    </div>
                  )
                })}
                {resultCount === 0 && (
                  <p className="px-2.5 pb-3.5 pt-3 text-[0.8125rem] text-muted-foreground">{strings.empty(query.trim())}</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  )
}

export default MorphSelect
