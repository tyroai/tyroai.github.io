#!/usr/bin/env node
// Herkese açık depoya kurum verisi, gerçek kişi ya da gerçek kimlik kodu sızmasın diye tripwire.
// Kurum adı, gerçek adlar ve kodlar burada düz metin değil, özet (sha1) olarak tutulur
// (`leak-denylist.json`). Çıkış kodu 0 değilse sync/CI durur.
import { createHash } from "node:crypto"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, extname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const sha1 = (s) => createHash("sha1").update(s).digest("hex")
// Ad/kimlik özetleri yalnız bakımcıda (gitignore'da); yoksa (ör. CI) yalnız genel kurallar çalışır.
let deny = { words: [], guidHashes: [], guidPrefixHashes: [] }
try {
  deny = JSON.parse(readFileSync(join(ROOT, "scripts/leak-denylist.json"), "utf8"))
} catch {
  console.log("(leak-denylist.json yok: yalnız genel kurallar)")
}
const EXACT = new Set((deny.words ?? []).filter((w) => !w.prefix).map((w) => w.h))
const PREFIX = new Map() // uzunluk → özetler
for (const w of (deny.words ?? []).filter((w) => w.prefix)) {
  if (!PREFIX.has(w.n)) PREFIX.set(w.n, new Set())
  PREFIX.get(w.n).add(w.h)
}
const GUIDS = new Set(deny.guidHashes ?? [])
const GUID_PREFIXES = new Set(deny.guidPrefixHashes ?? [])

const SCAN = ["src", "public", "demo", "index.html", "README.md", "package.json", "scripts", ".github"]
// Gitignore'daki bakımcı dosyası ve denetimin kendi veri dosyası taranmaz.
const SKIP_FILES = new Set(["leak-denylist.json", "sync.private.mjs"])
const TEXT = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".css", ".html", ".json", ".svg", ".md", ".txt", ".yml"])

const fold = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .toLowerCase()

// Genel (kuruma özgü olmayan) düz metin kuralları
const RULES = [
  [/\b(?!x(?:-my)?\.)[a-z0-9][a-z0-9-]{2,}\.sharepoint\.com/i, "gerçek SharePoint adresi"],
  [/crm\d*\.dynamics\.com/i, "Dataverse adresi (demo*.crm4 hariç)"],
  [/login\.microsoftonline\.com\/(?!common|organizations)[0-9a-f-]{20,}/i, "gerçek kiracı adresi"],
]
const ALLOWED_RULE_HITS = [/demo(-hr)?\.crm4\.dynamics\.com/i, /globaldisco\.crm\.dynamics\.com/i]
const EMAIL = /\b[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})\b/g
const EMAIL_OK = (d) =>
  /(^|\.)example(\.com|\.org|\.net)?$/i.test(d) ||
  /(^|\.)invalid$/i.test(d) ||
  /users\.noreply\.github\.com$/i.test(d) ||
  /^odata\./i.test(d) ||
  /(^|\.)tyrotech\.example$/i.test(d)
const GUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi

const hits = []
function add(file, line, kind, sample) {
  hits.push({ file: relative(ROOT, file), line, kind, sample: sample.slice(0, 90) })
}

function badToken(tok) {
  const f = fold(tok)
  if (EXACT.has(sha1(f))) return true
  for (const [n, set] of PREFIX) if (f.length >= n && set.has(sha1(f.slice(0, n)))) return true
  return false
}

function scanFile(file) {
  const lines = readFileSync(file, "utf8").split("\n")
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]
    for (const [re, kind] of RULES) {
      if (re.test(ln) && !ALLOWED_RULE_HITS.some((a) => a.test(ln))) add(file, i + 1, kind, ln.trim())
    }
    for (const m of ln.matchAll(EMAIL)) if (!EMAIL_OK(m[1])) add(file, i + 1, "gerçek e-posta alanı", m[0])
    for (const m of ln.matchAll(GUID_RE))
      if (GUIDS.has(sha1(m[0].toLowerCase()))) add(file, i + 1, "gerçek kimlik kodu", "<kod>")
    for (const m of ln.matchAll(/\b[0-9a-f]{8}\b/gi))
      if (GUID_PREFIXES.has(sha1(m[0].toLowerCase()))) add(file, i + 1, "gerçek kimlik kodu öneki", "<önek>")
    if (ln.length < 6000)
      for (const w of ln.matchAll(/\p{L}{4,40}/gu))
        if (badToken(w[0])) add(file, i + 1, "yasaklı ad / kurum adı", "<belirteç>")
  }
}

function walk(p) {
  const st = statSync(p, { throwIfNoEntry: false })
  if (!st) return
  if (st.isDirectory()) {
    for (const e of readdirSync(p)) {
      if (e === "node_modules" || e === "dist" || e === ".git" || e === ".sync-tmp") continue
      walk(join(p, e))
    }
  } else if (TEXT.has(extname(p)) && !SKIP_FILES.has(p.split("/").pop())) {
    scanFile(p)
  }
}

for (const p of SCAN) walk(join(ROOT, p))

if (hits.length) {
  const byKind = {}
  for (const h of hits) (byKind[h.kind] ??= []).push(h)
  console.error(`\n✖ Sızıntı denetimi: ${hits.length} bulgu`)
  for (const [kind, list] of Object.entries(byKind)) {
    console.error(`\n  ${kind} — ${list.length}`)
    for (const h of list.slice(0, 15)) console.error(`    ${h.file}:${h.line}  ${h.sample}`)
    if (list.length > 15) console.error(`    … ${list.length - 15} bulgu daha`)
  }
  process.exit(1)
}
console.log("✔ Sızıntı denetimi temiz")
