#!/usr/bin/env node
/**
 * Kaynak uygulamayı (SALT OKUNUR) bu depoya uyarlar.
 *
 * - Kaynağa YAZMAZ: yalnız `git archive HEAD` ile commit'li hâli okur, hiçbir git komutu
 *   kaynağın çalışma kopyasını ya da dizinini değiştirmez.
 * - Çıktı (üretilmiş, elle düzenleme): src/, public/, index.html, tsconfig.json, scripts/vite/.
 * - Elle yazılan her şey demo/ altında: overlay (dosya değiştirme), shims, mock, veri setleri.
 * - Sıra: arşiv → dışlama → çıpalı yamalar → metin/yol dönüşümü → overlay → yazma → bağımlılıklar
 *   → sızıntı denetimi.
 *
 *   npm run sync            # kaynağın commit'li HEAD'inden
 *   SYNC_TMP=/yol npm run sync
 */
import { execFileSync, execSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, extname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  ARCHIVE_PATHS,
  DICT_OVERRIDES,
  DROP_DEPS,
  EXCLUDE,
  EXCLUDE_PREFIX,
  GENERATED_FILES,
  KEEP_DEV_DEPS,
  PATCHES,
  POST_PATCHES,
  SOURCE,
  TEXT_EXT,
  prefixMap,
  seenGuidHashes,
  seenGuidPrefixHashes,
  transformPath,
  transformText,
} from "./sync.config.mjs"

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const STR = '"(?:[^"\\\\]|\\\\.)*"'

/** Sözlük dosyasında değer değiştir / anahtar sil / sona anahtar ekle. Kayıp anahtar için uyarı. */
function applyDictOverrides(text, ov, label) {
  let s = text
  for (const [key, value] of Object.entries(ov.replace ?? {})) {
    const re = new RegExp(`("${escapeRe(key)}":\\s*)${STR}`)
    if (!re.test(s)) console.warn(`  ! ${label}: "${key}" bulunamadı (replace)`)
    else s = s.replace(re, (_m, p1) => p1 + JSON.stringify(value))
  }
  for (const key of ov.drop ?? []) {
    const re = new RegExp(`\\n  "${escapeRe(key)}":\\s*${STR},?`)
    if (!re.test(s)) console.warn(`  ! ${label}: "${key}" bulunamadı (drop)`)
    else s = s.replace(re, "")
  }
  const adds = Object.entries(ov.add ?? {})
  if (adds.length) {
    const lines = adds.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n")
    if (!/\n}\s*$/.test(s)) throw new Error(`${label}: dosya sonu '}' değil, anahtar eklenemedi`)
    s = s.replace(/\n}\s*$/, `\n${lines}\n}\n`)
  }
  return s
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`
const git = (...args) =>
  execFileSync("git", ["--no-optional-locks", "-C", SOURCE, ...args], { encoding: "utf8" }).trim()
const sha1 = (s) => createHash("sha1").update(s).digest("hex")

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)))
}

const rev = git("rev-parse", "HEAD")
const committedAt = git("log", "-1", "--format=%cI")
console.log(`Kaynak: ${rev.slice(0, 8)} (${committedAt}) — yalnız commit'li hâl okunuyor`)

const tmpBase = process.env.SYNC_TMP ?? join(ROOT, ".sync-tmp")
mkdirSync(tmpBase, { recursive: true })
const snap = mkdtempSync(join(tmpBase, "snap-"))
const out = mkdtempSync(join(tmpBase, "out-"))

try {
  // 1) Arşiv
  execSync(
    `git --no-optional-locks -C ${q(SOURCE)} archive --format=tar HEAD ${ARCHIVE_PATHS.map(q).join(" ")} | tar -x -C ${q(snap)}`,
    { stdio: "inherit", shell: "/bin/sh" },
  )

  // 2) Bağımlılıklar için kaynağın package.json'u (dışlamadan önce oku)
  const srcPkg = JSON.parse(readFileSync(join(snap, "package.json"), "utf8"))

  // 3) Dışlama
  for (const rel of listFiles(snap)) {
    if (EXCLUDE.some((e) => rel === e || rel.startsWith(e + "/")) || EXCLUDE_PREFIX.some((p) => rel.startsWith(p))) {
      rmSync(join(snap, rel), { force: true })
    }
  }

  // 4) Çıpalı yamalar (özgün metin üzerinde). Çıpa yoksa dur.
  for (const p of PATCHES) {
    const f = join(snap, p.file)
    if (!existsSync(f)) throw new Error(`Yama dosyası yok: ${p.file}`)
    const text = readFileSync(f, "utf8")
    const found = typeof p.find === "string" ? text.includes(p.find) : p.find.test(text)
    if (!found) throw new Error(`Yama çıpası bulunamadı (kaynak değişmiş olabilir): ${p.file} › ${String(p.find).slice(0, 70)}`)
    writeFileSync(f, typeof p.find === "string" ? text.replace(p.find, () => p.replace) : text.replace(p.find, p.replace))
  }

  // 5) Dönüşüm: metin içeriği + yol adları → out
  let nText = 0
  let nBin = 0
  for (const rel of listFiles(snap)) {
    const dest = join(out, transformPath(rel))
    mkdirSync(dirname(dest), { recursive: true })
    if (TEXT_EXT.has(extname(rel))) {
      writeFileSync(dest, transformText(readFileSync(join(snap, rel), "utf8")))
      nText++
    } else {
      cpSync(join(snap, rel), dest)
      nBin++
    }
  }
  console.log(`Dönüştürüldü: ${nText} metin, ${nBin} ikili dosya`)

  // 5b) Yorumlarda kısaltılmış (ilk 8 hane) kalan gerçek kimlik kodları: sahte önekle değiştir
  const textRels = listFiles(out).filter((r) => TEXT_EXT.has(extname(r)))
  if (prefixMap.size) {
    let changed = 0
    for (const rel of textRels) {
      const f = join(out, rel)
      const t = readFileSync(f, "utf8")
      let c = t
      for (const [real, fake] of prefixMap)
        c = c.replace(new RegExp(`(?<![0-9A-Za-z])${real}(?![0-9A-Za-z])`, "g"), fake)
      if (c !== t) {
        writeFileSync(f, c)
        changed++
      }
    }
    console.log(`Kimlik kodu önekleri: ${prefixMap.size} önek, ${changed} dosya`)
  }

  // 5c) Dönüşüm sonrası yamalar (kurgusal içerik). Eşleşmezse dur.
  for (const p of POST_PATCHES) {
    const f = join(out, p.file)
    if (!existsSync(f)) throw new Error(`Son yama dosyası yok: ${p.file}`)
    const t = readFileSync(f, "utf8")
    const c = t.replace(p.find, p.replace)
    if (c === t) throw new Error(`Son yama eşleşmedi (kaynak değişmiş olabilir): ${p.file} › ${String(p.find).slice(0, 60)}`)
    writeFileSync(f, c)
  }

  // 5d) Sözlük geçersiz kılmaları (Hakkımızda ve Ekibimiz)
  for (const [lang, ov] of Object.entries(DICT_OVERRIDES)) {
    const f = join(out, `src/data/strings.${lang}.js`)
    if (!existsSync(f)) throw new Error(`Sözlük yok: ${lang}`)
    writeFileSync(f, applyDictOverrides(readFileSync(f, "utf8"), ov, `strings.${lang}`))
  }

  // 5e) Tamamen üretilen dosyalar
  for (const [rel, gen] of Object.entries(GENERATED_FILES)) {
    const f = join(out, rel)
    mkdirSync(dirname(f), { recursive: true })
    writeFileSync(f, gen())
  }

  // 6) Overlay (temiz yazılmış, dönüşüme girmez): kök yapısını yansıtır
  const overlay = join(ROOT, "demo/overlay")
  if (existsSync(overlay)) {
    cpSync(overlay, out, { recursive: true, force: true })
    console.log(`Overlay uygulandı: ${listFiles(overlay).length} dosya`)
  }

  // 7) Yaz: üretilmiş yolları sil, sonra kopyala
  for (const p of ["src", "public", "index.html", "tsconfig.json", "scripts/vite"]) {
    rmSync(join(ROOT, p), { recursive: true, force: true })
  }
  for (const rel of listFiles(out)) {
    const dest = join(ROOT, rel)
    mkdirSync(dirname(dest), { recursive: true })
    cpSync(join(out, rel), dest)
  }

  // 8) package.json: bağımlılıklar kaynaktan, betikler ve kimlik bu depodan
  const pkgPath = join(ROOT, "package.json")
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
  const deps = Object.fromEntries(
    Object.entries(srcPkg.dependencies ?? {}).filter(([k]) => !DROP_DEPS.includes(k)),
  )
  pkg.dependencies = Object.fromEntries(Object.entries(deps).sort(([a], [b]) => a.localeCompare(b)))
  pkg.devDependencies = Object.fromEntries(
    KEEP_DEV_DEPS.filter((k) => srcPkg.devDependencies?.[k]).map((k) => [k, srcPkg.devDependencies[k]]),
  )
  pkg.engines = srcPkg.engines
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")

  // 9) Kayıtlar: kaynak sürümü ve gerçek kimlik kodu özetleri (düz kod değil)
  mkdirSync(join(ROOT, "demo"), { recursive: true })
  writeFileSync(
    join(ROOT, "demo/SOURCE_REV.json"),
    JSON.stringify({ rev: rev.slice(0, 12), committedAt, syncedAt: new Date().toISOString() }, null, 2) + "\n",
  )
  const denyPath = join(ROOT, "scripts/leak-denylist.json")
  const deny = JSON.parse(readFileSync(denyPath, "utf8"))
  // Her sync'te baştan: önceki (hatalı) çalıştırmalardan kalan özetler birikmesin.
  deny.guidHashes = [...seenGuidHashes].sort()
  deny.guidPrefixHashes = [...seenGuidPrefixHashes].sort()
  writeFileSync(denyPath, JSON.stringify(deny, null, 2) + "\n")
  console.log(`Gerçek kimlik kodu özeti: ${seenGuidHashes.size} (düz kod yazılmadı)`)
} finally {
  rmSync(snap, { recursive: true, force: true })
  rmSync(out, { recursive: true, force: true })
}

// 10) Sızıntı denetimi
const scan = spawnSync("node", [join(ROOT, "scripts/leak-scan.mjs")], { stdio: "inherit" })
process.exit(scan.status ?? 1)
