import { errorCause } from "@/lib/errorCause"
import { graphGet, STATUS } from "@/lib/graph"
import { onSessionClear } from "@/lib/sessionCache"

/**
 * Bul › Kişiler — şirket rehberinin tamamı, tek seferde (TYRO'de ~800 hesap: bir-iki sayfa).
 * Arama bu liste üstünde istemcide yapılır (`lib/peopleIndex.js`).
 *
 * İzin merdiveni `personDirectory` ile aynı: önce `User.Read.All` (unvan, departman, ofis,
 * telefon), olmazsa `User.ReadBasic.All` (yalnız ad ve adres, `limited`). İkisi de SESSİZ;
 * `loginRequest`e kapsam eklenmez.
 *
 * Liste YALNIZ BELLEKTE, oturum başına bir kez (elle yenilenebilir); çıkışta
 * `clearCompanyDirectory` (`lib/sessionCache`). Çıkıştan önce yola çıkmış bir okuma dönünce
 * önbelleğe yazılmaz (`epoch`).
 */

const FULL =
  "id,displayName,givenName,surname,jobTitle,department,officeLocation,companyName,city,country,mail,userPrincipalName,businessPhones,mobilePhone"
const BASIC = "id,displayName,givenName,surname,mail,userPrincipalName"
// Kapalı hesaplar (ayrılanlar, oda ve ortak kutular) ve konuklar rehberde değil.
const FILTER = "accountEnabled eq true and userType eq 'Member'"
const MAX_PAGES = 12

const LADDER = [
  {
    scope: "User.Read.All",
    path: `/users?$select=${FULL}&$filter=${encodeURIComponent(FILTER)}&$count=true&$top=999`,
    limited: false,
  },
  // Temel izinle filtre alanı okunamıyor: filtresiz liste, kişi olmayanlar adresle elenir.
  { scope: "User.ReadBasic.All", path: `/users?$select=${BASIC}&$top=999`, limited: true },
]

let cached = null // { key, result }
let inflight = null // { key, promise }
let epoch = 0

export function clearCompanyDirectory() {
  cached = null
  inflight = null
  epoch += 1
}
onSessionClear(clearCompanyDirectory)

const text = (v) => String(v ?? "").trim()

/** Graph kaydı → rehber kişisi (kişi kartının `person` biçimine yakın). */
export function directoryPerson(u, limited) {
  const address = text(u?.mail || u?.userPrincipalName).toLowerCase()
  const name = text(u?.displayName)
  // Konuk hesap (#EXT#) filtresiz temel okumada gelir; şirketin kişisi değil.
  if (!u?.id || !name || !address || /#ext#/i.test(text(u.userPrincipalName))) return null
  return {
    id: u.id,
    name,
    givenName: text(u.givenName) || null,
    surname: text(u.surname) || null,
    title: limited ? null : text(u.jobTitle) || null,
    department: limited ? null : text(u.department) || null,
    office: limited ? null : text(u.officeLocation) || null,
    company: limited ? null : text(u.companyName) || null,
    city: limited ? null : text(u.city) || null,
    country: limited ? null : text(u.country) || null,
    address,
    upn: text(u.userPrincipalName).toLowerCase() || address,
    phones: limited ? [] : (u.businessPhones ?? []).map(text).filter(Boolean),
    mobile: limited ? null : text(u.mobilePhone) || null,
  }
}

async function readAll(instance, account, { scope, path }) {
  const users = []
  let next = path
  for (let page = 0; next && page < MAX_PAGES; page += 1) {
    const res = await graphGet(instance, account, {
      path: next,
      scopes: [scope],
      headers: { ConsistencyLevel: "eventual" },
      retry: 2,
    })
    if (res.status !== STATUS.ready) return page === 0 ? res : { status: STATUS.ready, users }
    users.push(...(res.data?.value ?? []))
    next = res.data?.["@odata.nextLink"] ?? null
  }
  return { status: STATUS.ready, users }
}

async function fetchDirectory(instance, account) {
  let last = { status: STATUS.denied }
  for (const step of LADDER) {
    const res = await readAll(instance, account, step)
    if (res.status === STATUS.ready) {
      const seen = new Set()
      const people = []
      for (const u of res.users) {
        const p = directoryPerson(u, step.limited)
        if (!p || seen.has(p.id)) continue
        seen.add(p.id)
        people.push(p)
      }
      return { status: STATUS.ready, people, limited: step.limited }
    }
    last = res
    // Yalnız izin reddi bir alt basamağı dener; ağ ya da sunucu hatası denemez.
    if (res.status !== STATUS.denied) break
  }
  return last
}

/** Önbellekteki rehber (bu hesabın), yoksa `null`. */
export function cachedDirectory(account) {
  return cached && cached.key === account?.homeAccountId ? cached.result : null
}

/** Rehberi okur; hazırsa önbellekten, yoldaysa aynı söz. `force`: yeniden oku. */
export function loadCompanyDirectory(instance, account, { force = false } = {}) {
  const key = account?.homeAccountId
  if (!key) return Promise.resolve({ status: STATUS.unauthenticated })
  if (!force && cached?.key === key) return Promise.resolve(cached.result)
  if (inflight?.key === key) return inflight.promise
  const started = epoch
  const promise = fetchDirectory(instance, account)
    .catch((err) => ({ status: STATUS.error, detail: errorCause("graph", err) }))
    .then((result) => {
      if (started === epoch && result.status === STATUS.ready) cached = { key, result }
      if (inflight?.promise === promise) inflight = null
      return result
    })
  inflight = { key, promise }
  return promise
}
