// Kaynaklar düzenlemesi (şartname çekirdek rRes/addR + v5.3 kişiye özel saatler): kişi ekle,
// alanlarını değiştir (ad değişince projelerdeki ad geçen alanlar da), sil (ekip, kural ve elle
// günlerden de çıkar). Hepsi taslağı yerinde değiştirir.
import { makeTeamIndex } from "@/lib/rm/engine/teams"
import { KNOWN_NAMES } from "../peopleDirectory"
import { uid } from "./ops"

const LEADS = ["devLead", "biLead", "fiLead", "scmLead", "aiLead", "paLead"]
const lower = (s) => String(s || "").toLocaleLowerCase("tr-TR")
export const splitNames = (v) =>
  String(v || "")
    .split(/[,;/]/)
    .map((x) => x.trim())
    .filter((x) => x && x !== "—" && x !== "-")

// Şartname slug: Türkçe harfler katlanır, harf-rakam dışı düşer.
const FOLD = { ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c" }
const slug = (s) =>
  lower(s)
    .replace(/[ışğüöç]/g, (c) => FOLD[c])
    .replace(/[^a-z0-9]/g, "")

/** Ad hatası: "required" · "taken" ya da null (aynı ad büyük/küçük harf duyarsız). */
export function nameError(S, name, exceptId = null) {
  const n = String(name || "").trim()
  if (!n) return "required"
  if (S.resources.some((r) => r.id !== exceptId && lower(r.name) === lower(n))) return "taken"
  return null
}

/** Yeni kişi; kimlik addan (çakışırsa sona alt çizgi). Döner: kimlik. */
export function addPerson(S, { name, team, role, manager }) {
  const n = String(name).trim()
  let id = `r_${slug(n) || uid()}`
  while (S.resources.some((r) => r.id === id)) id += "_"
  S.resources.push({
    id,
    name: n,
    team,
    role,
    manager: String(manager || "").trim(),
    closing: false,
  })
  return id
}

/**
 * Bir adı planın her yerinde değiştirir: kişi adı, kişilerin yöneticisi, yönetici listesi, projenin
 * PM'i ve sorumluları (virgüllü liste), aksiyonun sahibi ve takipçisi, BT işinin sorumlusu.
 */
export function renameEverywhere(S, old, nv) {
  const ren = (v) =>
    splitNames(v)
      .map((x) => (x === old ? nv : x))
      .join(", ")
  for (const r of S.resources) {
    if (r.name === old) r.name = nv
    if (r.manager === old) r.manager = nv
  }
  for (const m of S.mgrs || []) if (m.name === old) m.name = nv
  for (const p of S.projects) {
    for (const k of LEADS) if (splitNames(p[k]).includes(old)) p[k] = ren(p[k])
    if (p.pm === old) p.pm = nv
  }
  for (const a of S.actions || []) {
    if (a.owner === old) a.owner = nv
    if (a.follower === old) a.follower = nv
  }
  for (const o of S.ops || []) if (o.assignee === old) o.assignee = nv
}

/** Planda kişi adı geçen her değer (tekrarlarıyla): ad, yönetici, PM, sorumlu, sahip, iş sahibi. */
function nameUses(S) {
  const out = []
  for (const r of S.resources) out.push(r.name, r.manager)
  for (const m of S.mgrs || []) out.push(m.name)
  for (const p of S.projects) {
    out.push(p.pm)
    for (const k of LEADS) out.push(...splitNames(p[k]))
  }
  for (const a of S.actions || []) out.push(a.owner, a.follower)
  for (const o of S.ops || []) out.push(o.assignee)
  return out.map((x) => String(x || "").trim()).filter((x) => x && x !== "—" && x !== "-")
}

/** Planda geçen farklı kişi adları (Graph eşleşmesi bunların hepsine yapılır). */
export function planNames(S) {
  return [...new Set(nameUses(S))]
}

/**
 * Planda kısa yazılan adlar → Graph'taki ad soyad (`people`: ad → kayıt; yoksa bilinen tam ad).
 * Yalnız farklı olanlar; yeni ad başka bir kişinin adıyla çakışıyorsa atlanır. `uses`: kaç yerde.
 */
export function namePairs(S, people) {
  const count = new Map()
  for (const x of nameUses(S)) count.set(x, (count.get(x) || 0) + 1)
  const taken = new Set(S.resources.map((r) => lower(r.name)))
  const out = []
  for (const [old, uses] of count) {
    const nv = String(people?.get(old)?.name || KNOWN_NAMES[old] || "").trim()
    if (!nv || nv === old) continue
    const isPerson = S.resources.some((r) => r.name === old)
    if (isPerson && taken.has(lower(nv))) continue
    out.push({ old, nv, uses })
  }
  return out.sort((a, b) => a.nv.localeCompare(b.nv, "tr"))
}

/** Çiftleri planın her yerine uygular (`namePairs`). */
export function migrateNames(S, pairs) {
  for (const { old, nv } of pairs) renameEverywhere(S, old, nv)
}

/**
 * Kişinin alanlarını yazar. Ad değişince ad geçen her alan da yeni ada geçer
 * (`renameEverywhere`); tam gün ekibe geçen kişide kapanış desteği kalkar.
 */
export function updatePerson(S, id, patch) {
  const r = S.resources.find((x) => x.id === id)
  if (!r) return
  if (patch.name != null && patch.name.trim() !== r.name) {
    renameEverywhere(S, r.name, patch.name.trim())
  }
  for (const k of ["team", "role", "manager", "closing", "dh", "sup", "dev", "note"]) {
    if (k in patch) r[k] = patch[k]
  }
  if ("team" in patch && makeTeamIndex(S).isFullDay(r)) r.closing = false
}

/**
 * Kişiye özel saatlerin hatası: { alan: kod } (`rm.people.err.*`). Danışmanda destek +
 * yazılımcıyla çalışma günlük saatten az olmalı; günlük saat en az 1 (şartname v5.3).
 */
export function hoursErrors(S, r, x) {
  const e = {}
  const full = makeTeamIndex(S).isFullDay(r)
  for (const [k, max] of [
    ["dh", 16],
    ["sup", 12],
    ["dev", 12],
  ]) {
    const v = x[k]
    if (v === "" || v == null) continue
    if (Number.isNaN(+v) || +v < 0 || +v > max) e[k] = "range"
  }
  const S0 = S.settings || {}
  const dh = x.dh === "" ? +S0.dayHours : +x.dh
  const sup = x.sup === "" ? +S0.support : +x.sup
  const dev = x.dev === "" ? +S0.dev : +x.dev
  if (!e.dh && dh < 1) e.dh = "min1"
  if (!full && !e.dh && !e.sup && !e.dev && sup + dev >= dh) e.sup = "consSum"
  return e
}

/** Kişiyi siler; proje ekiplerinden, ad geçen alanlardan, kurallardan ve elle günlerden de çıkar. */
export function deletePerson(S, id) {
  const r = S.resources.find((x) => x.id === id)
  if (!r) return
  S.resources = S.resources.filter((x) => x.id !== id)
  for (const p of S.projects) {
    p.team = (p.team || []).filter((x) => x.rid !== id)
    p.mgrs = (p.mgrs || []).filter((x) => x !== id)
    for (const k of LEADS) {
      if (splitNames(p[k]).includes(r.name))
        p[k] = splitNames(p[k])
          .filter((x) => x !== r.name)
          .join(", ")
    }
    if (p.pm === r.name) p.pm = "Belirlenecek"
  }
  for (const k of Object.keys(S.ov || {})) if (k.endsWith(`|${id}`)) delete S.ov[k]
  S.asg = (S.asg || []).filter((a) => a.rid !== id)
}
