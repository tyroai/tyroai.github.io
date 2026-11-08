// RM verisindeki adlar ("Emrah", "Bora K.") Graph'taki kişi kayıtlarıyla eşlenir: kök kişinin
// (IT direktörü) bağlılar ağacı taranır, ad ve soyad baş harfiyle tek aday kalırsa eşleşir.
// Eşleşmeyen kişi baş harfle görünür. Bellekteki liste çıkışta temizlenir (`rmCache`).
import { graphGet, STATUS } from "@/lib/graph"
import { errorCause } from "@/lib/errorCause"
import { fetchManagerReports } from "@/lib/directReports"
import { onRmClear } from "@/lib/rm/rmCache"

/** Ürün sahibinin bilgisi: RM'deki herkes bu kişiye bağlı. */
export const RM_ORG_ROOT = "Kerem Aydın"
/**
 * Ürün sahibinin bilgisi: RM adı → kayıttaki tam ad. Aynı adlılar karışmasın, planda başka adla
 * yazılan kişi (Can = Cem Aksu) doğru kişiye bağlansın; Graph'ta bulunmasa da tam ad yazılır.
 */
export const KNOWN_NAMES = {
  Burak: "Berk Yalçın",
  "Bora K.": "Bora Kılıç",
  Fatih: "Furkan Eren",
  Can: "Cem Aksu",
}
const MAX_DEPTH = 3
const MAX_PEOPLE = 400

let state = { status: "idle", people: [] }
let inflight = null
const listeners = new Set()

function set(next) {
  state = next
  for (const fn of listeners) fn()
}

export function subscribePeople(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const peopleState = () => state

export function clearRmPeople() {
  inflight = null
  set({ status: "idle", people: [] })
}
onRmClear(clearRmPeople)

async function findRoot(instance, account, name) {
  const q = encodeURIComponent(`displayName eq '${name.replace(/'/g, "''")}'`)
  const res = await graphGet(instance, account, {
    path: `/users?$filter=${q}&$select=id,displayName,mail,userPrincipalName`,
    scopes: ["User.Read.All"],
  })
  // Okunamadıysa nedeni de döner: ekranda "rehber okunamadı"nın yanında neden kodu görünür.
  return res.status === STATUS.ready
    ? { root: res.data?.value?.[0] ?? null }
    : { root: null, detail: res.detail }
}

/** Kökün bağlılar ağacı (en çok üç kademe). */
async function loadOrg(instance, account) {
  const { root, detail } = await findRoot(instance, account, RM_ORG_ROOT)
  if (!root) return { status: "unavailable", people: [], detail: detail ?? null }
  const seen = new Map()
  let level = [root.id]
  for (let depth = 0; depth < MAX_DEPTH && level.length && seen.size < MAX_PEOPLE; depth++) {
    const next = []
    for (const id of level) {
      const res = await fetchManagerReports(instance, account, id)
      if (res.status !== STATUS.ready) continue
      for (const p of res.people) {
        if (seen.has(p.id)) continue
        seen.set(p.id, p)
        next.push(p.id)
      }
    }
    level = next
  }
  return { status: "ready", people: [...seen.values()] }
}

/** Ağacı bir kez yükler; ikinci çağıran aynı isteği bekler. */
export function ensurePeople(instance, account) {
  if (state.status === "ready" || !instance || !account) return
  inflight ??= loadOrg(instance, account)
    .then((r) => set(r))
    .catch((err) => set({ status: "unavailable", people: [], detail: errorCause("graph", err) }))
  set({ ...state, status: "loading" })
}

const fold = (s) =>
  String(s || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\s]/gu, " ")
    .trim()

/**
 * RM adlarını kişi kayıtlarıyla eşler: { [RM adı]: kayıt }. Önce soyad baş harfi verilenler
 * ("Bora K."), sonra yalın adlar kalan adaylar içinden; tek aday kalmazsa eşleşme yok.
 */
export function matchPeople(names, people) {
  const parsed = names.map((name) => {
    const t = fold(name).split(/\s+/).filter(Boolean)
    return { name, first: t[0] || "", rest: t.slice(1).map((x) => x[0]) }
  })
  const cands = people.map((p) => {
    const words = fold(p.name).split(/\s+/).filter(Boolean)
    const given = fold(p.givenName).split(/\s+/).filter(Boolean)
    return {
      p,
      first: new Set([...(given.length ? given : words.slice(0, 1)), words[0]]),
      last: words.slice(1),
    }
  })
  const out = {}
  const taken = new Set()
  for (const x of parsed) {
    const full = KNOWN_NAMES[x.name]
    if (!full) continue
    const hit = cands.find((c) => !taken.has(c.p.id) && fold(c.p.name) === fold(full))
    if (hit) {
      out[x.name] = hit.p
      taken.add(hit.p.id)
    }
  }
  const ordered = [...parsed].sort((a, b) => b.rest.length - a.rest.length)
  for (const x of ordered) {
    if (!x.first || out[x.name] || KNOWN_NAMES[x.name]) continue
    const hit = cands.filter(
      (c) =>
        !taken.has(c.p.id) &&
        c.first.has(x.first) &&
        x.rest.every((i) => c.last.some((w) => w.startsWith(i))),
    )
    if (hit.length === 1) {
      out[x.name] = hit[0].p
      taken.add(hit[0].p.id)
    }
  }
  return out
}

/** Eşleşen kişinin kayıttaki adı; yoksa bilinen tam adı, o da yoksa RM'deki ad. */
export function fullName(people, name) {
  return people?.get(name)?.name || KNOWN_NAMES[name] || name
}
