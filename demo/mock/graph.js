// Sahte Microsoft Graph yönlendiricisi. Uygulamanın bütün Graph çağrıları `graphRequest` üzerinden
// gelir; burada alan alan modüllere dağıtılır. Bilinmeyen GET'ler boş koleksiyon döner ve geliştirmede
// bir kez günlüğe yazılır (eksik ucu bulmak için).
import { ME, ascii, byId, byMail } from "../org.js"
import { attachmentMeta, buildState } from "../state.js"
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

const keyOf = (key) => decode(String(key)).toLowerCase()
const isMe = (key) => {
  const k = keyOf(key)
  return k === ME.mail || k === ME.id.toLowerCase()
}

/**
 * Kadrodaki kişinin fotoğrafı: `public/images/people/<ad-soyad>.jpg` varsa o (örn. selin-aydin.jpg),
 * yoksa `null` (uygulama baş harflerle çizer). Dosya yoksa geliştirme sunucusu HTML döndürür; türüne bakılır.
 */
const personPhotos = new Map()
async function personPhoto(ctx, key) {
  const person = byId(String(key)) ?? byMail(keyOf(key))
  if (!person) return null
  const slug = ascii(person.displayName).trim().replace(/\s+/g, "-")
  if (!personPhotos.has(slug)) {
    let bytes = null
    try {
      const res = await ctx.realFetch(`${import.meta.env.BASE_URL}images/people/${slug}.jpg`)
      if (res.ok && /^image\//.test(res.headers.get("content-type") ?? "")) bytes = await res.arrayBuffer()
    } catch {
      /* ağ yok: baş harfler */
    }
    personPhotos.set(slug, bytes)
  }
  return personPhotos.get(slug)
}

async function photoFor(ctx, key) {
  return isMe(key) ? myPhotoBytes(ctx) : personPhoto(ctx, decode(String(key)))
}

const PHOTO_META = {
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#users/$entity/photo/$entity",
  "@odata.mediaContentType": "image/jpeg",
  "@odata.mediaEtag": 'W/"demo-photo-v1"',
  id: "320x320",
  height: 320,
  width: 320,
}

const jpeg = (bytes) =>
  new Response(bytes, { headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=300" } })

async function handlePhotos({ url, method, body, path, ctx }) {
  if (method === "GET") {
    if (path === "/me/photo") return json(PHOTO_META)
    if (path === "/me/photo/$value" || /^\/me\/photos?\/[^/]+\/\$value$/.test(path)) return jpeg(await myPhotoBytes(ctx))
    const m = path.match(/^\/users\/([^/]+)\/photos?\/[^/]+\/\$value$/)
    if (m) {
      const bytes = await photoFor(ctx, m[1])
      return bytes ? jpeg(bytes) : null
    }
    return null
  }
  if (method === "POST" && path === "/$batch") {
    const requests = body?.requests ?? []
    const responses = []
    for (const r of requests) {
      const m = /^\/users\/([^/]+)\/photos?\//.exec(decode(r.url ?? ""))
      const bytes = m ? await photoFor(ctx, m[1]) : null
      responses.push(
        bytes
          ? { id: r.id, status: 200, headers: { "Content-Type": "image/jpeg" }, body: toBase64(bytes) }
          : {
              id: r.id,
              status: 404,
              headers: { "Content-Type": "application/json" },
              body: { error: { code: "ImageNotFound", message: "The photo wasn't found." } },
            },
      )
    }
    return json({ responses })
  }
  return null
}

// ───────────── posta ekleri (Keşfet kapak görselleri) ─────────────

const coverBytes = new Map()
async function coverFile(ctx, cover) {
  if (!coverBytes.has(cover.file)) {
    const res = await ctx.realFetch(`${import.meta.env.BASE_URL}${cover.file}`)
    coverBytes.set(cover.file, res.ok ? await res.arrayBuffer() : null)
  }
  return coverBytes.get(cover.file)
}

async function handleAttachments({ method, path, ctx, gs }) {
  if (method !== "GET") return null
  const m = path.match(/^\/me\/(?:mailFolders\/\w+\/)?messages\/([^/]+)\/attachments\/([^/]+)(\/\$value)?$/)
  if (!m) return null
  const msg = gs.mails.find((x) => x.id === decode(m[1]))
  if (!msg?.cover || msg.cover.id !== decode(m[2])) return null
  const bytes = await coverFile(ctx, msg.cover)
  if (!bytes) return null
  if (m[3]) return new Response(bytes, { headers: { "content-type": msg.cover.type ?? "image/jpeg" } })
  return json({
    "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#users('me')/messages('x')/attachments/$entity",
    ...attachmentMeta(msg),
    contentId: null,
    contentBytes: toBase64(bytes),
    lastModifiedDateTime: msg.received.toISOString(),
  })
}

export async function handleGraph({ url, method, headers, body: rawBody, ctx }) {
  ctx.gs ??= buildState(ctx.dataset)
  const gs = ctx.gs
  const path = decode(stripVersion(url.pathname))
  const body = parseBody(rawBody)

  const photo = await handlePhotos({ url, method, body, path, ctx })
  if (photo) return photo
  const attachment = await handleAttachments({ method, path, ctx, gs })
  if (attachment) return attachment

  const req = { url, method, headers, body, path, gs }
  const res = handleIdentity(req) ?? handleMailAndCalendar(req) ?? handleTodo(req) ?? handleFiles(req)
  if (res) return res

  logUnhandled("Graph", method, url)
  if (method === "GET") return json({ "@odata.context": "https://graph.microsoft.com/v1.0/$metadata", value: [] })
  if (method === "DELETE") return noContent()
  return json({})
}
