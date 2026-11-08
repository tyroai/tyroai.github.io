#!/usr/bin/env node
// Veri seti doğrulayıcı: `node scripts/check-dataset.mjs <id>` (örn. beyaz-esya).
// Şemayı, kişileri, saat biçimlerini, asistan kalıplarını ve içerik bolluğunu denetler.
// Hata varsa çıkış kodu 1. Uyarılar çıkışı bozmaz ama düzeltilmeli.
import { existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { byName } from "../demo/org.js"
import { buildState, occurrences } from "../demo/state.js"
import { buildCatalog } from "../demo/catalog.js"
import { fold } from "../demo/mock/graph-util.js"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const id = process.argv[2]
if (!id) {
  console.error("Kullanım: node scripts/check-dataset.mjs <veri-seti-kimliği>")
  process.exit(2)
}
const file = join(ROOT, "demo/datasets/sets", `${id}.js`)
if (!existsSync(file)) {
  console.error(`Dosya yok: demo/datasets/sets/${id}.js`)
  process.exit(2)
}

const errors = []
const warns = []
const err = (m) => errors.push(m)
const warn = (m) => warns.push(m)

const ds = (await import(file)).default
if (ds.id !== id) err(`id "${ds.id}" dosya adıyla ("${id}") aynı olmalı`)

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const FEED = ["haberler", "duyuru", "ik", "egitim", "akademi", "kulup"]
const ICONS = new Set([
  "AddInvoiceIcon", "AiBookIcon", "AiBrain02Icon", "AiChipIcon", "AiLaptopIcon", "Analytics01Icon",
  "AnalyticsUpIcon", "ArtificialIntelligenceIcon", "CargoShipIcon", "ChartHistogramIcon",
  "DocumentValidationIcon", "Office365Icon", "Package01Icon", "Robot01Icon", "SignatureIcon",
  "Target02Icon", "Telescope02Icon",
])

/** Kişi tanımı geçerli mi: kadro adı ya da "Ad Soyad (Firma)" / {name,address}. */
function checkPerson(spec, where) {
  if (spec && typeof spec === "object") return
  const m = String(spec).match(/^(.*?)\s*(?:\((.*)\))?$/)
  const name = m[1].trim()
  if (!m[2] && !byName(name)) err(`${where}: kadroda olmayan kişi "${name}" — dış kişi için "Ad Soyad (Firma Adı)" yaz`)
  if (m[2] && byName(name)) err(`${where}: "${name}" kadro üyesi; firma parantezi olmadan yaz`)
}

// ───── katalog ─────
const cat = buildCatalog(ds)
for (const c of cat) {
  if (c.icon && !ICONS.has(c.icon)) err(`katalog "${c.name}": ikon "${c.icon}" kayıtlı listede yok (${[...ICONS].join(", ")})`)
  if (!c.description) err(`katalog "${c.name}": açıklama yok`)
  if ((c.description ?? "").length > 200) err(`katalog "${c.name}": açıklama 200 karakteri aşıyor`)
}
const aiApps = cat.filter((c) => c.type === "ai").length
if (aiApps < 4) err(`en az 4 AI uygulaması (apps[type:"ai"]) gerekli, ${aiApps} var`)

// ───── takvim ─────
const meetings = ds.meetings ?? []
if (meetings.length < 12) err(`en az 12 toplantı gerekli, ${meetings.length} var`)
const recurring = meetings.filter((m) => m.recur).length
if (recurring < 3) err(`en az 3 tekrarlı toplantı (recur) gerekli, ${recurring} var`)
if (!meetings.some((m) => m.status === "notResponded")) warn("yanıt bekleyen davet (status:\"notResponded\") yok")
if (!meetings.some((m) => m.allDay)) warn("tüm gün etkinliği yok")
if (!meetings.some((m) => (m.day ?? 0) < 0 && !m.recur)) err("geçmiş (day < 0) tek seferlik toplantı yok")
if (!meetings.some((m) => (m.day ?? 0) > 0 && !m.recur)) err("gelecek (day > 0) tek seferlik toplantı yok")
if (!meetings.some((m) => m.day === 0 && !m.recur)) warn("bugüne (day: 0) düşen tek seferlik toplantı yok")
meetings.forEach((m, i) => {
  const w = `meetings[${i}] "${m.title}"`
  if (!m.title) err(`${w}: başlık yok`)
  if (!m.allDay && !HHMM.test(m.time ?? "")) err(`${w}: time "HH:MM" olmalı`)
  if (m.recur === "weekly" && !(m.weekday >= 1 && m.weekday <= 7)) err(`${w}: weekly için weekday (1=Pzt…7) gerekli`)
  if (!m.recur && m.day == null) err(`${w}: tek seferlik için day gerekli`)
  if (m.organizer) checkPerson(m.organizer, `${w} organizer`)
  for (const p of m.with ?? []) checkPerson(p, `${w} with`)
})
const now = new Date()
const st = buildState(ds, now)
const from = new Date(now.getTime() - 20 * 86400000)
const to = new Date(now.getTime() + 30 * 86400000)
const occ = occurrences(st.templates, from, to, now)
if (occ.length < 25) warn(`±30 günde yalnız ${occ.length} etkinlik oluşuyor (25+ olmalı)`)

// ───── posta ─────
const mail = ds.mail ?? []
const plain = mail.filter((m) => !m.feed)
const feed = mail.filter((m) => m.feed)
if (plain.length < 14) err(`en az 14 normal posta gerekli, ${plain.length} var`)
for (const tag of FEED) {
  const n = feed.filter((m) => m.feed === tag).length
  if (n < 1) err(`Keşfet kaynağı "${tag}" için posta yok`)
}
if (feed.length < 14) err(`en az 14 Keşfet postası gerekli, ${feed.length} var`)
if (!feed.some((m) => m.feed === "ik" && /aramıza katıl/i.test(`${m.subject} ${(Array.isArray(m.body) ? m.body.join(" ") : m.body) ?? ""}`)))
  err('İK kaynağında "aramıza katılan" yeni çalışan postası yok')
if (!feed.some((m) => m.feed === "ik" && /doğum günü|iyi ki doğdun|nice yıllara/i.test(`${m.subject} ${(Array.isArray(m.body) ? m.body.join(" ") : m.body) ?? ""}`)))
  err("İK kaynağında doğum günü postası yok")
if (plain.filter((m) => m.unread).length < 3) err("en az 3 okunmamış normal posta gerekli")
if (!plain.some((m) => m.flagged)) warn("bayraklı posta yok")
if (!mail.some((m) => m.important)) warn("önemli (important) posta yok")
mail.forEach((m, i) => {
  const w = `mail[${i}] "${m.subject}"`
  if (!m.subject) err(`${w}: konu yok`)
  if (!m.feed && !m.from) err(`${w}: from yok`)
  if (m.feed && !FEED.includes(m.feed)) err(`${w}: feed "${m.feed}" geçersiz`)
  if (m.from) checkPerson(m.from, `${w} from`)
  for (const p of m.to ?? []) checkPerson(p, `${w} to`)
  const at = m.at ?? {}
  if (at.time && !HHMM.test(at.time)) err(`${w}: at.time "HH:MM" olmalı`)
  if (!m.body && !m.preview) err(`${w}: gövde yok`)
})

// ───── görevler ─────
const lists = ds.todo?.lists ?? []
const tasks = lists.flatMap((l) => l.tasks ?? [])
if (lists.length < 3) err(`en az 3 görev listesi gerekli, ${lists.length} var`)
if (tasks.length < 18) err(`en az 18 görev gerekli, ${tasks.length} var`)
if (tasks.filter((t) => t.steps?.length).length < 3) err("en az 3 görevde adımlar (steps) olmalı")
if (!tasks.some((t) => t.due != null && t.due < 0 && t.status !== "completed" && t.completedDaysAgo == null)) warn("gecikmiş (due < 0) açık görev yok")
if (tasks.filter((t) => t.completedDaysAgo != null || t.status === "completed").length < 2) warn("tamamlanmış görev yok/az")
if (tasks.filter((t) => t.due === 0).length < 1) warn("bugüne (due: 0) düşen görev yok")

// ───── dosyalar ve notlar ─────
if ((ds.files ?? []).length < 10) err(`en az 10 dosya gerekli, ${(ds.files ?? []).length} var`)
for (const f of ds.files ?? []) {
  if (!/\.(xlsx|docx|pptx|pdf|csv)$/i.test(f.name)) err(`dosya "${f.name}": uzantı xlsx/docx/pptx/pdf/csv olmalı`)
  checkPerson(f.by ?? "Ömer Gümüş", `dosya "${f.name}" by`)
}
if ((ds.notes ?? []).length < 3) err(`en az 3 not gerekli, ${(ds.notes ?? []).length} var`)

// ───── asistan ─────
const a = ds.assistant ?? {}
if (!a.office?.greeting || !(a.office.chips?.length >= 3)) err("assistant.office: karşılama ve en az 3 öneri gerekli")
if (!a.sales?.greeting || !(a.sales.chips?.length >= 3)) err("assistant.sales: karşılama ve en az 3 öneri gerekli")
if (!a.fallback) err("assistant.fallback yok")
const answers = a.answers ?? []
if (answers.length < 9) err(`en az 9 asistan cevabı gerekli, ${answers.length} var`)
answers.forEach((x, i) => {
  try {
    new RegExp(fold(x.match), "i")
  } catch (e) {
    err(`answers[${i}]: match geçersiz regex (${e.message})`)
  }
  if (!x.text || x.text.length < 40) err(`answers[${i}] (${x.match}): metin çok kısa`)
  if (/(^|\|)(hafta|bugün)(\||$)/i.test(x.match)) err(`answers[${i}]: çıplak "hafta"/"bugün" kalıbı fazla genel`)
})
// Sıra testi: tipik sorular beklenen cevaba gitsin
const probes = [
  ["Bu hafta toplantılarım neler?", /toplant|takvim|program/i],
  ["Bu çeyrek hedef durumum nedir?", /hedef|kota|gerçekleşme/i],
  ["Haftalık satış özeti hazırla", /haftalık|özet/i],
  ["İzin bakiyem nedir?", /izin|bakiye/i],
]
for (const [q, expect] of probes) {
  const folded = fold(q)
  const hit = answers.find((x) => new RegExp(fold(x.match), "i").test(folded))
  if (!hit) err(`asistan: "${q}" sorusuna eşleşen cevap yok`)
  else if (!expect.test(`${hit.match} ${hit.text.slice(0, 60)}`)) warn(`asistan: "${q}" beklenmeyen cevaba gidiyor (kalıp: ${hit.match})`)
}

// ───── genel metin taraması ─────
const dump = JSON.stringify(ds)
for (const bad of ["undefined", "NaN", "TODO", "lorem", "Lorem", "[object"]) {
  if (dump.includes(bad)) err(`veri setinde "${bad}" geçiyor`)
}
if (!ds.weather?.now) warn("weather.now yok")
if (!ds.market?.rates) warn("market.rates yok")

console.log(`\n${id}: ${meetings.length} toplantı (${occ.length} oluşum ±30g), ${mail.length} posta (${feed.length} Keşfet), ${tasks.length} görev, ${(ds.files ?? []).length} dosya, ${(ds.notes ?? []).length} not, ${answers.length} asistan cevabı, ${cat.length} katalog öğesi`)
for (const w of warns) console.log(`  ⚠ ${w}`)
for (const e of errors) console.log(`  ✖ ${e}`)
if (errors.length) {
  console.log(`\n✖ ${errors.length} hata`)
  process.exit(1)
}
console.log("✔ geçerli")
