// Proje formu, silme ve yapılacak işler (şartname: çekirdek saveProject + v5.3 · v5.7 · v5.8 ·
// v5.9 · v6.0 · v6.1 · v6.5 yamaları). Form yalnız kendi alanlarını yazar; ekip, ★ yöneticiler,
// kapsam gibi formda olmayan alanlar korunur (şartname nesneyi baştan kurup sonra yamalıyordu).
import { toDay } from "@/lib/rm/engine/dates"
import { applyDates, shiftRules, uid } from "./ops"

export const NEUTRAL = "#EEEED3"
const FOLD = { ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i" }
const fold = (s) =>
  String(s || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[ışğüöçâî]/g, (c) => FOLD[c])

/** Ad'dan boş bir kod: ilk üç harf; doluysa iki harf + sıra (şartname autoCode). */
export function autoCode(st, name) {
  const base =
    fold(name)
      .replace(/[^a-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 3) || "PRJ"
  let c = base
  for (let i = 2; st.projects.some((p) => p.code === c); i++) c = base.slice(0, 2) + i
  return c
}

/** Projenin rengi ilk kategorisinin rengi; kategorisizse nötr (v6.6). */
export function projectColor(st, cats) {
  const pc = cats?.[0] && (st.pcats || []).find((x) => x.name === cats[0])
  return pc ? pc.color : NEUTRAL
}

const listOf = (st, kind, fallback) => {
  const l = (st.lk?.[kind] || []).map((x) => x.name).filter(Boolean)
  return l.length ? l : fallback
}
export const prioList = (st) => listOf(st, "prios", ["P1", "P2", "P3"])
export const statusList = (st) =>
  listOf(st, "statuses", [
    "Başlatılmadı",
    "Başlatma aşamasında",
    "Devam ediyor",
    "Takipte",
    "Beklemede",
    "Tamamlandı",
  ])

/** Yeni projenin boş formu (şartname: öncelik P2, durum "Başlatılmadı", başlangıç plan başı). */
export function blankProject(st, planStartIso) {
  const prios = prioList(st)
  const statuses = statusList(st)
  return {
    code: "",
    name: "",
    cats: [],
    country: "TR",
    prio: prios.includes("P2") ? "P2" : prios[Math.floor((prios.length - 1) / 2)] || "P2",
    status: statuses.includes("Başlatılmadı")
      ? "Başlatılmadı"
      : statuses.find((x) => x !== "Tamamlandı") || statuses[0],
    start: planStartIso,
    end: "",
    sponsor: "",
    pm: "",
    desc: "",
    todo: [],
  }
}

/** Form alanlarının hataları: { alan: kod } (`rm.pform.err.*`). Boşsa geçerli. */
export function projectErrors(st, id, f) {
  const e = {}
  const code = String(f.code || "").trim()
  if (!code) e.code = "codeRequired"
  else if (st.projects.some((x) => x.id !== id && x.code.toUpperCase() === code.toUpperCase()))
    e.code = "codeTaken"
  if (!String(f.name || "").trim()) e.name = "nameRequired"
  const s = toDay(f.start)
  const en = toDay(f.end)
  if (s == null) e.start = "startRequired"
  if (en == null) e.end = "endRequired"
  else if (s != null && en < s) e.end = "endOrder"
  return e
}

/** Yapılacak işleri temizler (boşlar düşer, 300 karakter) ve eski `tasks` alanını eşitler. */
export function syncTodo(p, todo) {
  p.todo = (todo || [])
    .filter((x) => x && String(x.t || "").trim())
    .map((x) => ({ id: x.id || uid(), t: String(x.t).trim().slice(0, 300), d: !!x.d }))
  p.tasks = p.todo.map((x) => x.t)
}

/**
 * Projeyi yazar. Yeni projede kimlik `id`. Düzenlemede tarih değiştiyse kurallar önce kayar
 * (v5.3), saati olan kişilerde toplam iş korunarak günlük saat yeniden hesaplanır (v6.1, `s0`).
 */
export function saveProject(S, id, f, { isNew, s0, workN }) {
  const fields = {
    code: String(f.code).trim().toUpperCase(),
    name: String(f.name).trim(),
    cats: f.cats.slice(),
    color: projectColor(S, f.cats),
    country: f.country || "TR",
    prio: f.prio,
    status: f.status,
    start: f.start,
    end: f.end,
    sponsor: String(f.sponsor || "").trim(),
    pm: f.pm || "Belirlenecek",
    desc: String(f.desc || "").trim(),
    effort: null,
    locked: false,
  }
  if (isNew) {
    // Simülasyondan açılan projede ekip formla gelir (şartname simgo).
    const team = (f.team || []).map((x) => ({ rid: x.rid }))
    const p = { id, ...fields, weight: 2, milestone: "", scope: "", team, mgrs: [] }
    syncTodo(p, f.todo)
    S.projects.push(p)
    return
  }
  const p = S.projects.find((x) => x.id === id)
  if (!p) return
  const old = { s: p.start, e: p.end }
  if (p.color !== fields.color && p.color0 == null) p.color0 = p.color
  Object.assign(p, fields)
  syncTodo(p, f.todo)
  if (old.s === p.start && old.e === p.end) return
  shiftRules(S, id, old, { s: p.start, e: p.end })
  if (s0 && Object.values(s0).some((x) => x.tot > 0)) applyDates(S, id, p.start, p.end, s0, workN)
}

/** Projeyi ve bütün izlerini siler: kurallar, elle günler; aksiyon ve iş bağları çözülür. */
export function deleteProject(S, id) {
  S.projects = S.projects.filter((x) => x.id !== id)
  for (const a of S.actions || []) if (a.projectId === id) a.projectId = ""
  for (const o of S.ops || []) if (o.link === id) o.link = "RUT"
  for (const k of Object.keys(S.ov || {})) if (k.startsWith(`${id}|`)) delete S.ov[k]
  S.asg = (S.asg || []).filter((x) => x.pid !== id)
}

/** Projenin iş listesi; eski düz `tasks` ("✓ …" bitmiş sayılır) listeye çevrilir (v5.4). */
export function todoOf(p) {
  if (Array.isArray(p.todo)) return p.todo.map((x) => ({ ...x }))
  return (p.tasks || [])
    .map((x) => {
      const s = String(x)
      return {
        id: uid(),
        t: s.replace(/^\s*[✔✓]\s*(Tamamlandı:)?\s*/, "").trim(),
        d: /^\s*[✔✓]/.test(s),
      }
    })
    .filter((x) => x.t)
}

/** Ayrıntı panelinden iş listesi değişikliği: fn(todo) listeyi yerinde değiştirir. */
export function changeTodo(S, id, fn) {
  const p = S.projects.find((x) => x.id === id)
  if (!p) return
  const todo = todoOf(p)
  fn(todo)
  syncTodo(p, todo)
}
