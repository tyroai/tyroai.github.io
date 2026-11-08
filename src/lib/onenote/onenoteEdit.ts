/**
 * OneNote sayfasını uygulama içinde düzenleme — saf parçalar (testli: `tests/unit/onenoteEdit.test.ts`).
 *
 * Graph sayfayı bütün olarak yeniden yazmaz; öğe öğe değiştirir (`PATCH /pages/{id}/content`,
 * komut dizisi). Bunun için içerik `?includeIDs=true` ile okunur: her paragrafın, başlığın ve madde
 * satırının OneNote'un ürettiği bir `id`si olur. Düzenleyici yalnız bu yazı öğelerini açar; görsel,
 * tablo ve ek dosya salt okunur kalır (OneNote'ta düzenlenir). Kayıtta yalnız DEĞİŞEN öğeler
 * `replace` edilir, başlık `title` hedefiyle, yeni not `body`nin sonuna `append` edilir — sayfanın
 * geri kalanına dokunulmaz.
 *
 * Biçim değişikliği de `replace`tir: paragraf başlığa ya da maddeye çevrilebilir (Graph `p`, `h1–h6`
 * ve `li`yi kimliğiyle her içerikle değiştirir). Var olan madde paragrafa çevrilmez: `li` listenin
 * içinde kalır, yerine `p` konamaz.
 */

import { imageTag, insertCommands } from "./onenoteImageInsert"
import type { ImageInsert } from "./onenoteImageInsert"

/** Düzenlenebilir yazı öğeleri. */
const TEXT_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li"])
/** Salt okunur kutu olarak gösterilenler (içleri düzenlenmez). */
const READONLY_TAGS = new Set(["table", "img", "object", "iframe"])
/** Satır içinde korunan biçim (geri kalan her etiket açılır, metni kalır). */
const INLINE = new Set(["b", "strong", "i", "em", "u", "br", "a"])

export interface EditBlock {
  /** OneNote'un ürettiği kimlik (`p:{…}{37}`); yoksa öğe hedeflenemez, salt okunur gösterilir. */
  id: string | null
  tag: string
  /** Yapılacaklar işareti gibi korunması gereken OneNote etiketi (`data-tag`). */
  dataTag: string | null
  /** Düzenleyicide gösterilen güvenli satır içi HTML. */
  html: string
  kind: "text" | "readonly"
  /** Salt okunur kutunun türü (görsel · tablo · ek). */
  what?: "image" | "table" | "file"
  /** Madde satırının listesi (madde işaretli · numaralı). */
  list?: ListKind
  /** Madde satırının listesinin kimliği (altına resim eklenirken hedef). */
  listId?: string | null
}

export type ListKind = "ul" | "ol"

/** Bir öğenin düzenleyicide değişen biçimi; verilmeyen alan öğenin kendi değerinde kalır. */
export interface BlockFormat {
  tag?: string
  /** Paragrafı maddeye çevirir (`null`: madde değil). Var olan maddede yok sayılır. */
  list?: ListKind | null
  /** Yapılacaklar işareti (`null`: kaldır). */
  dataTag?: string | null
}

/** Yalnız OneNote'un yapılacaklar işaretleri taşınır. */
const TODO_TAG = /^to-do(:completed)?$/

export interface EditableDoc {
  title: string
  blocks: EditBlock[]
}

const escapeText = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const escapeAttr = (s: string) => escapeText(s).replace(/"/g, "&quot;")

/** Yalnız güvenli bağlantılar (https · mailto) korunur. */
function safeHref(href: string | null): string | null {
  if (!href) return null
  try {
    const u = new URL(href, "https://x.invalid")
    return u.protocol === "https:" || u.protocol === "mailto:" ? u.href : null
  } catch {
    return null
  }
}

function inlineOf(node: Node): string {
  let out = ""
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      out += escapeText(child.textContent ?? "")
      return
    }
    if (child.nodeType !== 1) return
    const el = child as Element
    const tag = el.tagName.toLowerCase()
    if (tag === "br") {
      out += "<br>"
      return
    }
    const inner = inlineOf(el)
    if (!INLINE.has(tag)) {
      out += inner
      return
    }
    if (tag === "a") {
      const href = safeHref(el.getAttribute("href"))
      out += href ? `<a href="${escapeAttr(href)}">${inner}</a>` : inner
      return
    }
    const norm = tag === "strong" ? "b" : tag === "em" ? "i" : tag
    out += inner ? `<${norm}>${inner}</${norm}>` : ""
  })
  return out
}

/**
 * Satır içi HTML'i güvenli biçime indirir: yalnız kalın, eğik, altı çizili, satır sonu ve güvenli
 * bağlantı kalır; geri kalan etiketler açılır (metni korunur), öznitelik ve stil düşer. Düzenleyicinin
 * gösterdiği ve Graph'a giden içerik budur — kullanıcının yapıştırdığı biçim de buradan geçer.
 */
export function sanitizeInline(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")
  return inlineOf(doc.body)
    .replace(/(<br>)+$/, "")
    .trim()
}

/**
 * `?includeIDs=true` içeriğinden düzenleyicinin modeli: sayfa başlığı ve belge sırasıyla bloklar.
 * Yazı öğesi (`p`, `h1–h6`, `li`) kimliğiyle düzenlenebilir blok; tablo, görsel, ek salt okunur
 * kutu (içindeki paragraflar ayrıca çıkmaz). Boş paragraflar atlanır.
 */
export function parseEditable(raw: string): EditableDoc {
  const doc = new DOMParser().parseFromString(raw, "text/html")
  const title = (doc.querySelector("title")?.textContent ?? "").trim()
  const blocks: EditBlock[] = []
  const walk = (node: Element) => {
    for (const el of Array.from(node.children)) {
      const tag = el.tagName.toLowerCase()
      if (READONLY_TAGS.has(tag)) {
        const what = tag === "table" ? "table" : tag === "img" ? "image" : "file"
        blocks.push({ id: null, tag, dataTag: null, html: "", kind: "readonly", what })
        continue
      }
      if (TEXT_TAGS.has(tag)) {
        // Madde içinde iç içe liste varsa madde metni ayrı, alt liste ayrı yürünür.
        const nested = Array.from(el.children).filter((c) => /^(ul|ol)$/i.test(c.tagName))
        const clone = el.cloneNode(true) as Element
        clone.querySelectorAll("ul,ol").forEach((n) => n.remove())
        const html = sanitizeInline(clone.innerHTML)
        if (html) {
          const id = el.getAttribute("id")
          const parent = el.parentElement?.tagName.toLowerCase()
          blocks.push({
            id: id || null,
            tag,
            dataTag: el.getAttribute("data-tag"),
            html,
            kind: id ? "text" : "readonly",
            ...(tag === "li" && {
              list: parent === "ol" ? "ol" : "ul",
              listId: el.parentElement?.getAttribute("id") || null,
            }),
          })
        }
        nested.forEach(walk)
        continue
      }
      walk(el)
    }
  }
  walk(doc.body)
  return { title, blocks }
}

export interface PatchCommand {
  target: string
  action: "replace" | "append" | "insert"
  position?: "after" | "before"
  content: string
}

/** Komutun kullanıcıya söylenen türü (kaydedilemeyeni bildirmek için). */
export type CommandKind = "title" | "text" | "image" | "note"

export function commandKind(c: PatchCommand): CommandKind {
  if (c.target === "title") return "title"
  if (c.content.startsWith("<img")) return "image"
  return c.action === "replace" ? "text" : "note"
}

export interface EditChanges {
  title: string
  /** Blok kimliği → düzenleyicideki (henüz temizlenmemiş) satır içi HTML. */
  edits: Map<string, string>
  /** Blok kimliği → değişen biçim (başlık, madde, yapılacak). */
  formats?: Map<string, BlockFormat>
  /** Sayfanın sonuna eklenecek notun HTML'i (düzenleyicinin "Not ekle" alanı). */
  append: string
  /** Var olan öğelerin altına eklenen resimler. */
  images?: ImageInsert[]
}

const dataTagAttr = (tag: string | null | undefined) =>
  tag ? ` data-tag="${escapeAttr(tag)}"` : ""
/** Eklenen notta yalnız yapılacaklar işareti taşınır (yapıştırılan yabancı öznitelik değil). */
const todoAttr = (tag: string | null) => dataTagAttr(tag && TODO_TAG.test(tag) ? tag : null)

/** Öğenin yeni HTML'i: madde kendi etiketinde kalır, maddeye çevrilen paragraf tek maddeli liste. */
function blockHtml(block: EditBlock, inner: string, format: BlockFormat | undefined): string {
  const dataTag = dataTagAttr(format && "dataTag" in format ? format.dataTag : block.dataTag)
  if (block.tag === "li") return `<li${dataTag}>${inner}</li>`
  if (format?.list) return `<${format.list}><li${dataTag}>${inner}</li></${format.list}>`
  const tag = format?.tag ?? block.tag
  return `<${tag}${dataTag}>${inner}</${tag}>`
}

const BLOCK_TAGS = /^(p|div|h[1-6]|ul|ol|li|blockquote)$/

/**
 * "Not ekle" alanının HTML'i → sayfaya eklenecek bloklar: paragraf, başlık (h1–h3), madde
 * işaretli ya da numaralı liste; yapılacaklar işareti korunur. Satır içi biçim `sanitizeInline`dan
 * geçer; iç içe liste düzleşir, boş satırlar düşer.
 */
export function appendBlocksOf(html: string): string[] {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")
  const out: string[] = []
  let run = ""
  const flush = () => {
    const inner = sanitizeInline(run)
    if (inner) out.push(`<p>${inner}</p>`)
    run = ""
  }
  const items = (list: Element, into: string[]) => {
    for (const li of Array.from(list.children)) {
      if (/^(ul|ol)$/i.test(li.tagName)) {
        items(li, into)
        continue
      }
      const clone = li.cloneNode(true) as Element
      clone.querySelectorAll("ul,ol").forEach((n) => n.remove())
      const inner = sanitizeInline(clone.innerHTML)
      if (inner) into.push(`<li${todoAttr(li.getAttribute("data-tag"))}>${inner}</li>`)
      li.querySelectorAll(":scope > ul, :scope > ol").forEach((n) => items(n, into))
    }
  }
  const walk = (node: Element) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType !== 1) {
        if (child.nodeType === 3) run += escapeText(child.textContent ?? "")
        return
      }
      const el = child as Element
      const tag = el.tagName.toLowerCase()
      if (tag === "img") {
        flush()
        const img = imageTag(
          el.getAttribute("src") ?? "",
          Number(el.getAttribute("width") || (el as HTMLImageElement).naturalWidth),
          Number(el.getAttribute("height") || (el as HTMLImageElement).naturalHeight),
          el.getAttribute("alt") ?? "",
        )
        if (img) out.push(img)
        return
      }
      if (!BLOCK_TAGS.test(tag)) {
        run += el.outerHTML
        return
      }
      flush()
      if (tag === "ul" || tag === "ol") {
        const lis: string[] = []
        items(el, lis)
        if (lis.length) out.push(`<${tag}>${lis.join("")}</${tag}>`)
        return
      }
      const nested = Array.from(el.children).some(
        (c) => /^img$/i.test(c.tagName) || BLOCK_TAGS.test(c.tagName.toLowerCase()),
      )
      if (nested) {
        walk(el)
        flush()
        return
      }
      const inner = sanitizeInline(el.innerHTML)
      if (!inner) return
      const head = /^h[1-6]$/.test(tag) ? `h${Math.min(Number(tag[1]), 3)}` : "p"
      out.push(`<${head}${todoAttr(el.getAttribute("data-tag"))}>${inner}</${head}>`)
    })
  }
  walk(doc.body)
  flush()
  return out
}

/**
 * Değişikliklerden Graph komutları: başlık değiştiyse `title` · `replace`, yazısı ya da biçimi
 * değişen her öğe kimliğiyle `replace` (yapılacaklar işareti korunur), yeni not `body` · `append`.
 * Değişmeyen öğe için komut yok; hiçbir şey değişmediyse boş dizi.
 */
export function buildPatch(doc: EditableDoc, changes: EditChanges): PatchCommand[] {
  // Resim komutları önce: `replace` edilen öğenin kimliği değişebilir.
  const out: PatchCommand[] = [...insertCommands(doc, changes.images ?? [])]
  const title = changes.title.replace(/\s+/g, " ").trim()
  if (title && title !== doc.title)
    out.push({ target: "title", action: "replace", content: escapeText(title) })
  for (const block of doc.blocks) {
    if (block.kind !== "text" || !block.id) continue
    const edited = changes.edits.get(block.id)
    const format = changes.formats?.get(block.id)
    if (edited === undefined && !format) continue
    // Boşaltılan öğe silinmez (Graph'ta silme ayrı bir iş), boş paragraf olarak kalır.
    const clean = edited === undefined ? block.html : sanitizeInline(edited)
    const next = blockHtml(block, clean, format)
    if (next === blockHtml(block, block.html, undefined)) continue
    out.push({ target: block.id, action: "replace", content: next })
  }
  for (const p of appendBlocksOf(changes.append))
    out.push({ target: "body", action: "append", content: p })
  // Graph iyi biçimli (XHTML) içerik bekler: kapanmamış `<br>` reddedilebilir.
  return out.map((c) => ({ ...c, content: c.content.replace(/<br>/g, "<br />") }))
}
