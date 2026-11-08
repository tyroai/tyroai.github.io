import { STATUS, graphGet } from "@/lib/graph"
import { RETRY, TODO_SCOPES, mapPool, warnFailure } from "@/lib/todo"

/**
 * To Do'nun "İşaretli e-posta" listesinde, postası artık bayraklı olmayan görevler.
 *
 * Microsoft o listeyi Outlook'un bayrağından eşitliyor ve eşitleme bilinen
 * biçimde kopabiliyor: bayrağı kaldırılan ya da silinen postanın görevi listede
 * kalıyor. Asıl kaynak postanın bayrağı. Bir görev ancak posta tarafı
 * doğrulanınca "kalmış" sayılır; emin olunamayan her durumda görev görünür
 * kalır — yanlışlıkla gizlemek, hiç gizlememekten kötü.
 *
 * Maliyet küçük tutuluyor: bayraklı postalar tek sorguda (en çok 5 sayfa)
 * okunuyor ve başlığı bayraklı bir postanın konusuyla eşleşen görevler hiç
 * sorulmuyor. Yalnız kalan adaylar için görevin bağlantısı ve postanın kendisi
 * okunuyor, aynı anda en çok iki istek (posta kutusunun eşzamanlılık sınırı).
 */

const MAIL = ["Mail.Read"]
const MAIL_PAGES = 5
const CHECK_CAP = 40
const CONCURRENCY = 2

const enc = encodeURIComponent

/**
 * Konu ile görev başlığı aynı biçime: Unicode, boşluk ve harf büyüklüğü farkı
 * yok. Eşleşmeyen bir başlık yalnız bir doğrulama isteğine mal olur, yanlış
 * gizlemeye değil.
 */
export function normSubject(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

/** Outlook bağlantısındaki posta kimliği (`?ItemID=` ya da `/read/<id>`). */
export function itemIdOf(url) {
  let parsed
  try {
    parsed = new URL(String(url ?? ""))
  } catch {
    return null
  }
  for (const [name, value] of parsed.searchParams) {
    // URLSearchParams "+"yı boşluğa çeviriyor; kimlikte boşluk olmaz.
    if (name.toLowerCase() === "itemid" && value) return value.replace(/ /g, "+")
  }
  const match = parsed.pathname.match(/\/read\/([^/]+)/i)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

/**
 * Karşılaştırma anahtarı: aynı posta EWS biçiminde ("+", "/") ya da REST
 * biçiminde ("_", "-") gelebiliyor; dolgu ("=") da her yerde yok.
 */
export function canonId(id) {
  return String(id ?? "")
    .trim()
    .replace(/-/g, "/")
    .replace(/_/g, "+")
    .replace(/=+$/, "")
}

/** Graph'ın adreste beklediği REST biçimi. */
export function restId(id) {
  return String(id ?? "")
    .trim()
    .replace(/\//g, "-")
    .replace(/\+/g, "_")
}

/** Bir görevin bağlantılarındaki posta kimlikleri, tekil. */
export function linkIds(links) {
  const seen = new Set()
  const out = []
  for (const link of links ?? []) {
    for (const id of [link?.externalId, itemIdOf(link?.webUrl)]) {
      const key = id ? canonId(id) : ""
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push(id)
    }
  }
  return out
}

/**
 * Doğrulanması gereken görevler. Aynı konulu birden çok görev olabilir (bir
 * yazışmanın iki yanıtı): o konuda bayraklı posta sayısından fazla görev
 * varsa grubun tamamı aday — hangisinin kaldığını yalnız kimlik söyler.
 */
export function candidatesOf(tasks, subjects) {
  const groups = new Map()
  for (const task of tasks) {
    const key = normSubject(task.title)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(task)
  }
  const out = []
  for (const [key, group] of groups) {
    if (group.length > (subjects.get(key) ?? 0)) out.push(...group)
  }
  return out
}

/**
 * Bir adayın hükmü. `notFlagged` kesin. Bulunamayan posta (`missing`) silinmiş
 * de olabilir, taşınmış da (kimlik taşınınca değişir); bu yüzden görevin ya da
 * bağlantının adı bayraklı bir postada geçiyorsa ya da bayraklı postaların
 * hepsi okunamadıysa karar verilmez.
 */
export function isLeftover({ state, titles, mail }) {
  if (state === "notFlagged") return true
  if (state !== "missing" || !mail.complete) return false
  return !titles.some((title) => mail.subjects.has(normSubject(title)))
}

/** Bayraklı postaların konu sayıları ve kimlikleri; okunamazsa `null`. */
async function flaggedMail(instance, account) {
  const subjects = new Map()
  const ids = new Set()
  let next = `/me/messages?$filter=${enc("flag/flagStatus eq 'flagged'")}&$select=id,subject,webLink&$top=100`
  for (let page = 0; next && page < MAIL_PAGES; page += 1) {
    const res = await graphGet(instance, account, { path: next, scopes: MAIL, retry: RETRY })
    if (res.status !== STATUS.ready) {
      warnFailure("işaretli postalar", res)
      return null
    }
    for (const message of res.data?.value ?? []) {
      const key = normSubject(message.subject)
      subjects.set(key, (subjects.get(key) ?? 0) + 1)
      for (const id of [message.id, itemIdOf(message.webLink)]) if (id) ids.add(canonId(id))
    }
    next = res.data?.["@odata.nextLink"] ?? null
  }
  return { subjects, ids, complete: !next }
}

/**
 * Postanın bayrak durumu: `flagged` · `complete` · `notFlagged` · `missing`
 * (hiçbir kimlikle bulunamadı) ya da `null` (sorulamadı). 400 o kimliğin
 * posta kimliği olmadığı anlamına geliyor; sıradaki biçim denenir.
 */
async function mailState(instance, account, ids) {
  let missing = false
  for (const id of ids) {
    const res = await graphGet(instance, account, {
      path: `/me/messages/${enc(restId(id))}?$select=flag`,
      scopes: MAIL,
      retry: RETRY,
    })
    if (res.status === STATUS.ready) return res.data?.flag?.flagStatus ?? null
    if (res.httpStatus === 404) missing = true
    else if (res.httpStatus !== 400) return null
  }
  return missing ? "missing" : null
}

async function verify(instance, account, task, mail) {
  const res = await graphGet(instance, account, {
    path: `/me/todo/lists/${enc(task.listId)}/tasks/${enc(task.id)}/linkedResources`,
    scopes: TODO_SCOPES,
    retry: RETRY,
  })
  if (res.status !== STATUS.ready) return false
  const links = res.data?.value ?? []
  const ids = linkIds(links)
  if (!ids.length || ids.some((id) => mail.ids.has(canonId(id)))) return false
  const state = await mailState(instance, account, ids)
  const titles = [task.title, ...links.map((link) => link?.displayName ?? "")]
  return isLeftover({ state, titles, mail })
}

/**
 * Postası artık bayraklı olmayan görevlerin kimlikleri; karar verilemezse
 * `null`. `tasks`: listenin açık görevleri (`id`, `listId`, `title`).
 * `known`: bu oturumda zaten kalmış bulunanlar — aday olmayı sürdürdükçe
 * yeniden sorulmaz.
 */
export async function findLeftovers(instance, account, tasks, known = new Set()) {
  if (!tasks.length) return []
  const mail = await flaggedMail(instance, account)
  if (!mail) return null
  const candidates = candidatesOf(tasks, mail.subjects)
  const out = candidates.filter((task) => known.has(task.id)).map((task) => task.id)
  const unknown = candidates.filter((task) => !known.has(task.id))
  if (unknown.length > CHECK_CAP) {
    console.warn(`[todo] işaretli e-posta: ${unknown.length} aday, ilk ${CHECK_CAP} denetlendi`)
  }
  const batch = unknown.slice(0, CHECK_CAP)
  const verdicts = await mapPool(batch, CONCURRENCY, (task) =>
    verify(instance, account, task, mail),
  )
  batch.forEach((task, i) => verdicts[i] && out.push(task.id))
  return out
}
