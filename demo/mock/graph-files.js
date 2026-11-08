// Graph: OneDrive / SharePoint dosyaları, arama ve OneNote.
import { ME } from "../org.js"
import { DRIVE_ID, DRIVE_WEB, folderItems, toDriveItem, toOneNotePage } from "../state.js"
import { json, graphError, uid } from "./util.js"
import { CTX, decode, fold, paged } from "./graph-util.js"

const ODRIVEITEM = "#microsoft.graph.driveItem"

const withType = (item) => ({ "@odata.type": ODRIVEITEM, ...item })

/** KQL'den serbest metin terimleri (operatörler ve alan süzgeçleri atılır). */
function freeTerms(q) {
  return q
    .replace(/(?:^|\s)-?\w+:(?:"[^"]*"|\S+)/g, " ")
    .replace(/\b(AND|OR|NOT)\b|[()]/g, " ")
    .split(/\s+/)
    .map((t) => fold(t.replace(/^-/, "")))
    .filter((t) => t && t !== "*")
}

function searchQuery(body, gs) {
  const req = body?.requests?.[0] ?? {}
  const q = req.query?.queryString ?? ""
  const from = req.from ?? 0
  const size = req.size ?? 25
  const wantFolders = /IsContainer:true/i.test(q)
  let items = wantFolders ? folderItems(gs.files) : gs.files.map(toDriveItem)
  const terms = freeTerms(q)
  if (terms.length) items = items.filter((r) => terms.every((t) => fold(r.name).includes(t)))
  if (!wantFolders) {
    items = [...items].sort((a, b) => new Date(b.lastModifiedDateTime) - new Date(a.lastModifiedDateTime))
  }
  const total = items.length
  const hits = items.slice(from, from + size).map((r, i) => ({ hitId: r.id, rank: from + i + 1, summary: "", resource: withType(r) }))
  const container = { hits, total, moreResultsAvailable: from + size < total }
  if (req.aggregations?.length && !wantFolders) {
    const counts = {}
    for (const f of gs.files) counts[f.ext] = (counts[f.ext] ?? 0) + 1
    container.aggregations = [
      {
        field: "FileType",
        buckets: Object.entries(counts).map(([key, count]) => ({ key, count, aggregationFilterToken: `"ǂǂ${key}"` })),
      },
    ]
  }
  return json({ "@odata.context": CTX, value: [{ searchTerms: terms, hitsContainers: [container] }] })
}

function childrenOf(gs, driveId, itemId) {
  const folders = folderItems(gs.files)
  if (!itemId || itemId === "root") return folders.map(withType)
  const dir = folders.find((f) => f.id === itemId)
  if (!dir) return []
  return gs.files.filter((f) => f.folder === dir.name).map((f) => withType(toDriveItem(f)))
}

export function handleFiles({ url, method, body, path, gs }) {
  let m
  if (method === "GET") {
    if (path === "/me/drive") return json({ id: DRIVE_ID, name: "OneDrive", webUrl: DRIVE_WEB, driveType: "business", quota: { total: 1099511627776, used: 3412000000, remaining: 1096099627776, state: "normal" } })
    if (path === "/me/drive/root/children" || /^\/drives\/[^/]+\/root\/children$/.test(path)) return paged(url, childrenOf(gs, DRIVE_ID, "root"))
    if ((m = path.match(/^\/drives\/([^/]+)\/items\/([^/]+)\/children$/))) return paged(url, childrenOf(gs, decode(m[1]), decode(m[2])))
    if ((m = path.match(/^\/drives\/([^/]+)\/items\/([^/]+)\/thumbnails$/))) return json({ value: [] })
    if ((m = path.match(/^\/drives\/([^/]+)\/items\/([^/]+)\/content$/))) return new Response("demo", { headers: { "content-type": "application/octet-stream" } })
    if ((m = path.match(/^\/drives\/([^/]+)\/items\/([^/]+)$/))) {
      const id = decode(m[2])
      const file = gs.files.find((f) => f.id === id)
      const dir = folderItems(gs.files).find((f) => f.id === id)
      const item = file ? toDriveItem(file) : dir
      return item ? json({ "@odata.context": CTX, ...withType(item) }) : graphError(404, "itemNotFound", "Item not found")
    }
    if ((m = path.match(/^\/drives\/([^/]+)$/))) return json({ id: decode(m[1]), name: "OneDrive", webUrl: DRIVE_WEB, driveType: "business" })
    if (path === "/sites/root") return json({ id: "tyrotech.sharepoint.example,demo-site-0001,demo-web-0001", displayName: "TYRO Tech", name: "tyrotech", webUrl: "https://tyrotech.sharepoint.example" })
    if (path === "/me/followedSites") return paged(url, [])
    if (/^\/sites\/[^/]+\/drives$/.test(path)) return paged(url, [])
    if (/^\/sites\/[^/]+$/.test(path)) return json({ id: decode(path.split("/")[2]), displayName: "TYRO Tech", webUrl: "https://tyrotech.sharepoint.example" })
    if (/^\/groups\/[^/]+\/drive$/.test(path)) return graphError(404, "itemNotFound", "No drive")
    if (/^\/shares\//.test(path)) return graphError(404, "itemNotFound", "Share not found")
    if (/^\/sites\/[^/]*:/.test(path)) return graphError(404, "itemNotFound", "Site not found")
    if (/^\/drives\/[^/]+\/root:/.test(path)) return graphError(404, "itemNotFound", "Item not found")
    return oneNoteGet({ url, path, gs })
  }
  if (method === "POST") {
    if (path === "/search/query") return searchQuery(body, gs)
    if (/^\/drives\/[^/]+\/items\/[^/]+\/preview$/.test(path)) return graphError(403, "accessDenied", "Preview is not available in the demo")
    return oneNotePost({ path, body, gs })
  }
  if (method === "PATCH" && /^\/me\/onenote\/pages\/[^/]+\/content$/.test(path)) return new Response(null, { status: 204 })
  if (method === "DELETE" && /^\/me\/onenote\/pages\/[^/]+$/.test(path)) return new Response(null, { status: 204 })
  return null
}

// ───────────────────────────── OneNote ─────────────────────────────

function oneNoteGet({ url, path, gs }) {
  let m
  if (path === "/me/onenote/pages") {
    const rows = [...gs.notes].sort((a, b) => b.modified - a.modified)
    return paged(url, rows, toOneNotePage)
  }
  if ((m = path.match(/^\/me\/onenote\/pages\/([^/]+)\/content$/))) {
    const note = gs.notes.find((n) => n.id === decode(m[1]))
    return note
      ? new Response(note.html, { headers: { "content-type": "text/html; charset=utf-8" } })
      : graphError(404, "20102", "The page was not found.")
  }
  if (path === "/me/onenote/sections") {
    const filter = url.searchParams.get("$filter") ?? ""
    if (/displayName eq/i.test(filter)) return paged(url, [])
    const sections = [...new Set(gs.notes.map((n) => `${n.notebook}::${n.section}`))].map((k) => {
      const [notebook, section] = k.split("::")
      return { id: `1-demosection-${section}`, displayName: section, parentNotebook: { id: `1-demonotebook-${notebook}`, displayName: notebook } }
    })
    return paged(url, sections)
  }
  if (path === "/me/onenote/notebooks") {
    const notebooks = [...new Set(gs.notes.map((n) => n.notebook))].map((name, i) => ({ id: `1-demonotebook-${name}`, displayName: name, isDefault: i === 0 }))
    return paged(url, notebooks)
  }
  if (/^\/me\/onenote\/sections\/[^/]+\/pages$/.test(path)) return paged(url, [])
  return null
}

function oneNotePost({ path, body, gs }) {
  if (/^\/me\/onenote\/sections\/[^/]+\/pages$/.test(path)) {
    const title = /<title>([^<]*)<\/title>/i.exec(String(body ?? ""))?.[1] ?? "Yeni not"
    const page = { id: `1-demonote-new-${uid("n").replace(/[^a-z0-9]/gi, "")}`, title, section: "Toplantı Notları", notebook: "Satış", modified: new Date(), html: String(body ?? "") }
    gs.notes.unshift(page)
    return json(toOneNotePage(page), 201)
  }
  if (path === "/me/onenote/notebooks") return json({ id: "1-demonotebook-yeni", displayName: body?.displayName ?? "Defter" }, 201)
  if (/^\/me\/onenote\/notebooks\/[^/]+\/sections$/.test(path)) return json({ id: "1-demosection-yeni", displayName: body?.displayName ?? "Bölüm" }, 201)
  return null
}

export { ME }
