import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { RefObject } from "react"
import type { BlockFormat, EditableDoc, EditBlock, ListKind } from "@/lib/onenote/onenoteEdit"
import { blockAt, caretOffset, clearShortcut, placeCaret, shortcutAt } from "./richText"

/** Öğenin düzenleyicideki biçimi; `html` biçim değişirken yazının o anki hâli (yeniden çizim için). */
export type DraftFormat = BlockFormat & { html?: string }

export type FormatCommand = "h1" | "h2" | "bold" | "italic" | "underline" | "ul" | "ol" | "todo"

export interface BarState {
  /** Biçimin uygulanacağı yer: var olan öğe (`block`), sona eklenecek not (`new`) ya da hiçbiri. */
  where: "block" | "new" | null
  id: string | null
  bold: boolean
  italic: boolean
  underline: boolean
  heading: string | null
  list: ListKind | null
  todo: boolean
  /** Var olan madde: listeden çıkarılamaz, başlığa çevrilemez (Graph `li`yi `p` ile değiştirmez). */
  lockBlock: boolean
}

const EMPTY: BarState = {
  where: null,
  id: null,
  bold: false,
  italic: false,
  underline: false,
  heading: null,
  list: null,
  todo: false,
  lockBlock: false,
}

const isTodo = (tag: string | null | undefined) => Boolean(tag?.includes("to-do"))

/** Yapılacaklar işaretini ekler/kaldırır; öğenin öbür OneNote etiketleri (önemli, soru…) kalır. */
function toggleTodo(tag: string | null | undefined): string | null {
  const rest = (tag ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("to-do"))
  if (isTodo(tag)) return rest.join(", ") || null
  return ["to-do", ...rest].join(", ")
}

/** Öğenin geçerli biçimi: düzenleyicide değiştiyse o, yoksa sayfadaki. */
export function effectiveFormat(block: EditBlock, f: DraftFormat | undefined) {
  return {
    tag: f?.tag ?? block.tag,
    list: block.tag === "li" ? (block.list ?? "ul") : (f?.list ?? null),
    dataTag: f && "dataTag" in f ? (f.dataTag ?? null) : block.dataTag,
  }
}

const cmdState = (cmd: string) => {
  try {
    return document.queryCommandState(cmd)
  } catch {
    return false
  }
}

interface Options {
  doc: EditableDoc | null
  root: RefObject<HTMLElement | null>
  bar: RefObject<HTMLElement | null>
  area: RefObject<HTMLElement | null>
  nodes: RefObject<Map<string, HTMLElement>>
  onChange: () => void
}

/**
 * Biçim çubuğunun durumu ve komutları. Satır içi biçim (kalın, eğik, altı çizili) tarayıcının
 * düzenleme komutuyla yazının içinde kalır; başlık, madde ve yapılacak var olan öğede ÖĞENİN
 * biçimidir (`formats` → kayıtta `replace`), "Not ekle" alanında doğrudan HTML'dir.
 */
export function useFormatBar({ doc, root, bar, area, nodes, onChange }: Options) {
  const [formats, setFormats] = useState<Map<string, DraftFormat>>(() => new Map())
  const [state, setState] = useState<BarState>(EMPTY)
  const byId = useMemo(
    () => new Map((doc?.blocks ?? []).filter((b) => b.id).map((b) => [b.id as string, b])),
    [doc],
  )
  // Klavyeyle çubuğa geçilince odak yazıdan çıkar: son seçim ve hedef burada saklanır.
  const last = useRef<{ el: HTMLElement; range: Range } | null>(null)
  const pending = useRef<{ id: string; offset: number | null } | null>(null)

  const read = useCallback(() => {
    const active = document.activeElement as HTMLElement | null
    if (!active || !root.current?.contains(active)) return
    if (bar.current?.contains(active)) return
    const target = active.closest<HTMLElement>("[data-ed]")
    if (!target) {
      last.current = null
      setState((s) => (s.where ? EMPTY : s))
      return
    }
    const sel = window.getSelection()
    if (sel?.rangeCount) last.current = { el: target, range: sel.getRangeAt(0).cloneRange() }
    const marks = {
      bold: cmdState("bold"),
      italic: cmdState("italic"),
      underline: cmdState("underline"),
    }
    let next: BarState
    if (target.dataset.ed === "new") {
      const block = blockAt(target)
      const tag = block?.tagName.toLowerCase() ?? null
      const list = block?.closest("ul,ol")
      next = {
        ...marks,
        where: "new",
        id: null,
        heading: tag && /^h[1-6]$/.test(tag) ? tag : null,
        list: list && target.contains(list) ? (list.tagName.toLowerCase() as ListKind) : null,
        todo: isTodo(block?.closest("[data-tag]")?.getAttribute("data-tag")),
        lockBlock: false,
      }
    } else {
      const id = target.dataset.ed ?? ""
      const block = byId.get(id)
      if (!block) return
      const f = effectiveFormat(block, formats.get(id))
      next = {
        ...marks,
        where: "block",
        id,
        heading: /^h[1-6]$/.test(f.tag) && !f.list ? f.tag : null,
        list: f.list,
        todo: isTodo(f.dataTag),
        lockBlock: block.tag === "li",
      }
    }
    setState((s) => (JSON.stringify(s) === JSON.stringify(next) ? s : next))
  }, [root, bar, byId, formats])

  useEffect(() => {
    document.addEventListener("selectionchange", read)
    return () => document.removeEventListener("selectionchange", read)
  }, [read])

  useEffect(() => {
    // Kalın/eğik `<b>`/`<i>` olsun (stil özniteliği değil); yeni satır `<p>`.
    document.execCommand("styleWithCSS", false, "false")
    document.execCommand("defaultParagraphSeparator", false, "p")
  }, [])

  // Biçim değişen öğe yeniden çizilir: odak ve imleç eski yerine.
  useLayoutEffect(() => {
    const p = pending.current
    if (!p) return
    pending.current = null
    const el = nodes.current.get(p.id)
    if (!el) return
    el.focus()
    placeCaret(el, p.offset)
    read()
  }, [formats, nodes, read])

  const setFormat = useCallback(
    (id: string, next: (f: ReturnType<typeof effectiveFormat>) => BlockFormat) => {
      const block = byId.get(id)
      if (!block) return
      const el = nodes.current.get(id)
      pending.current = { id, offset: el ? caretOffset(el) : null }
      const html = el?.innerHTML
      setFormats((prev) => {
        const m = new Map(prev)
        const cur = prev.get(id)
        m.set(id, { ...cur, ...next(effectiveFormat(block, cur)), html: html ?? cur?.html })
        return m
      })
      onChange()
    },
    [byId, nodes, onChange],
  )

  /** Klavyeyle çubuktan (ya da dosya penceresinden) dönünce odağı ve seçimi yazıya geri verir. */
  const refocus = useCallback(() => {
    const l = last.current
    if (!l || !l.el.isConnected) return false
    if (document.activeElement === l.el) return true
    l.el.focus()
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(l.range)
    return true
  }, [])

  const run = (cmd: FormatCommand) => {
    if (!state.where) return
    refocus()
    if (cmd === "bold" || cmd === "italic" || cmd === "underline") {
      document.execCommand(cmd)
    } else if (state.where === "block" && state.id) {
      if (state.lockBlock && cmd !== "todo") return
      if (cmd === "h1" || cmd === "h2")
        setFormat(state.id, (f) => ({ tag: f.tag === cmd && !f.list ? "p" : cmd, list: null }))
      else if (cmd === "ul" || cmd === "ol")
        setFormat(state.id, (f) => ({ tag: "p", list: f.list === cmd ? null : cmd }))
      else setFormat(state.id, (f) => ({ dataTag: toggleTodo(f.dataTag) }))
      return
    } else if (area.current) {
      newAreaCommand(area.current, cmd, state)
    }
    onChange()
    read()
  }

  /**
   * "Not ekle" alanının tuşları: satır başı kısayolu (boşlukta `- `, `1. `, `[] `); boş yapılacak
   * satırında Enter kutudan çıkar (listede boş maddede Enter'ın listeden çıkması gibi).
   */
  const onAreaKey = (e: KeyboardEvent) => {
    const el = area.current
    if (!el) return
    if (e.key === "Enter" && !e.shiftKey) {
      const host = blockAt(el)?.closest("[data-tag]")
      if (!host || !el.contains(host) || host.textContent?.trim()) return
      e.preventDefault()
      host.removeAttribute("data-tag")
    } else if (e.key === " ") {
      const kind = shortcutAt(el)
      if (!kind) return
      e.preventDefault()
      clearShortcut(el)
      newAreaCommand(el, kind, { ...EMPTY, where: "new" })
    } else return
    onChange()
    read()
  }

  return { state, formats, run, onAreaKey, refocus }
}

/** "Not ekle" alanında başlık, liste ve yapılacak: tarayıcının blok komutları. */
function newAreaCommand(el: HTMLElement, cmd: FormatCommand, state: BarState) {
  if (cmd === "h1" || cmd === "h2") {
    if (state.list) return
    document.execCommand("formatBlock", false, state.heading === cmd ? "p" : cmd)
  } else if (cmd === "ul" || cmd === "ol") {
    document.execCommand(cmd === "ul" ? "insertUnorderedList" : "insertOrderedList")
  } else if (cmd === "todo") {
    let block = blockAt(el)
    if (!block) {
      document.execCommand("formatBlock", false, "p")
      block = blockAt(el)
    }
    const host = block?.closest("li") ?? block
    if (!host) return
    const next = toggleTodo(host.getAttribute("data-tag"))
    if (next) host.setAttribute("data-tag", next)
    else host.removeAttribute("data-tag")
  }
}
