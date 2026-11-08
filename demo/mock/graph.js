// Sahte Microsoft Graph yönlendiricisi. Uygulamanın bütün Graph çağrıları `graphRequest` üzerinden
// gelir; burada alan alan modüllere dağıtılır. Bilinmeyen GET'ler boş koleksiyon döner ve geliştirmede
// bir kez günlüğe yazılır (eksik ucu bulmak için).
import { ME } from "../org.js"
import { buildState } from "../state.js"
import { json, logUnhandled, noContent, parseBody } from "./util.js"
import { decode } from "./graph-util.js"
import { handleIdentity } from "./graph-identity.js"
import { handleMailAndCalendar } from "./graph-mail.js"
import { handleTodo } from "./graph-todo.js"
import { handleFiles } from "./graph-files.js"

const stripVersion = (p) => p.replace(/^\/(v1\.0|beta)/, "")

// ───────────── Ömer'in fotoğrafı (yalnız o; başkalarında 404 → baş harfler) ─────────────

async function myPhotoBytes(ctx) {
  if (!ctx.photo) {
    const res = await ctx.realFetch(`${import.meta.env.BASE_URL}images/omer-gumus.jpg`)
    ctx.photo = await res.arrayBuffer()
  }
  return ctx.photo
}

function toBase64(buf) {
  const bytes = new Uint8Array(buf)
  let s = ""
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

const isMe = (key) => {
  const k = decode(String(key)).toLowerCase()
  return k === ME.mail || k === ME.id.toLowerCase()
}

const PHOTO_META = {
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#users/$entity/photo/$entity",
  "@odata.mediaContentType": "image/jpeg",
  "@odata.mediaEtag": 'W/"demo-photo-v1"',
  id: "320x320",
  height: 320,
  width: 320,
}

async function handlePhotos({ url, method, body, path, ctx }) {
  if (method === "GET") {
    if (path === "/me/photo") return json(PHOTO_META)
    let m
    const isValue =
      path === "/me/photo/$value" ||
      /^\/me\/photos?\/[^/]+\/\$value$/.test(path) ||
      ((m = path.match(/^\/users\/([^/]+)\/photos?\/[^/]+\/\$value$/)) && isMe(m[1]))
    if (isValue) {
      return new Response(await myPhotoBytes(ctx), {
        headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=300" },
      })
    }
    return null
  }
  if (method === "POST" && path === "/$batch") {
    const requests = body?.requests ?? []
    const bytes = requests.some((r) => /\/photos?\//.test(r.url ?? "")) ? await myPhotoBytes(ctx) : null
    const responses = requests.map((r) => {
      const m = /^\/users\/([^/]+)\/photos?\//.exec(decode(r.url ?? ""))
      if (m && bytes && isMe(m[1])) {
        return { id: r.id, status: 200, headers: { "Content-Type": "image/jpeg" }, body: toBase64(bytes) }
      }
      return {
        id: r.id,
        status: 404,
        headers: { "Content-Type": "application/json" },
        body: { error: { code: "ImageNotFound", message: "The photo wasn't found." } },
      }
    })
    return json({ responses })
  }
  return null
}

export async function handleGraph({ url, method, headers, body: rawBody, ctx }) {
  ctx.gs ??= buildState(ctx.dataset)
  const gs = ctx.gs
  const path = decode(stripVersion(url.pathname))
  const body = parseBody(rawBody)

  const photo = await handlePhotos({ url, method, body, path, ctx })
  if (photo) return photo

  const req = { url, method, headers, body, path, gs }
  const res = handleIdentity(req) ?? handleMailAndCalendar(req) ?? handleTodo(req) ?? handleFiles(req)
  if (res) return res

  logUnhandled("Graph", method, url)
  if (method === "GET") return json({ "@odata.context": "https://graph.microsoft.com/v1.0/$metadata", value: [] })
  if (method === "DELETE") return noContent()
  return json({})
}
