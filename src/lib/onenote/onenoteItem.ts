import { fold } from "@/lib/fold"
import type { OneNotePage } from "./onenotePages"

/**
 * Dosya listelerindeki OneNote öğeleri (Keşfet › Bul): defter (`package.type = oneNote`), bölüm
 * dosyası (`.one`), içindekiler (`.onetoc2`). Bunların Office önizlemesi yok; Bul onları OneNote
 * kapsamında, defter ve bölüm süzgeciyle açar. Saf: testli (`tests/unit/onenoteItem.test.ts`).
 */

/** Dosya satırının okunan alanları (`lib/driveItem` › `normaliseDriveItem`). */
export interface DriveLikeItem {
  kind?: string
  name?: string
  ext?: string
  webUrl?: string
  parentPath?: string
  packageType?: string
}

/** OneNote'ta neyin açılacağı: defter adı, varsa bölüm adı. */
export interface OneNoteTarget {
  notebook: string
  section: string
}

const OWN_EXTS = new Set(["one", "onetoc2"])

/** Adres yolunun parçaları (sorgu ve parça hariç, çözülmüş). */
function pathParts(url: string | undefined): string[] {
  if (!url) return []
  try {
    return new URL(url).pathname
      .split("/")
      .filter(Boolean)
      .map((s) => decodeURIComponent(s))
  } catch {
    return []
  }
}

/** Defter mi: paket bilgisi ya da OneDrive'ın varsayılan "Notebooks" klasöründe uzantısız öğe. */
function isNotebook(item: DriveLikeItem): boolean {
  if (item.packageType === "oneNote") return true
  const parts = pathParts(item.webUrl)
  return !item.ext && parts.length > 1 && parts[parts.length - 2] === "Notebooks"
}

export function isOneNoteItem(item: DriveLikeItem | null | undefined): boolean {
  if (!item || item.kind !== "file") return false
  return OWN_EXTS.has(item.ext ?? "") || isNotebook(item)
}

/** Öğenin üst klasörünün adı: önce `parentPath`, yoksa adresin sondan ikinci parçası. */
function parentName(item: DriveLikeItem): string {
  const fromPath = (item.parentPath ?? "").split("/").filter(Boolean).pop() ?? ""
  if (fromPath && !fromPath.endsWith(":")) return fromPath
  const parts = pathParts(item.webUrl)
  return parts.length > 1 ? parts[parts.length - 2] : ""
}

/** Öğe → açılacak defter/bölüm. OneNote öğesi değilse `null`. */
export function oneNoteTarget(item: DriveLikeItem | null | undefined): OneNoteTarget | null {
  if (!item || !isOneNoteItem(item)) return null
  const name = item.name ?? ""
  if (item.ext === "one")
    return { notebook: parentName(item), section: name.replace(/\.one$/i, "") }
  if (item.ext === "onetoc2") return { notebook: parentName(item), section: "" }
  return { notebook: name, section: "" }
}

const same = (a: string, b: string) => fold(a) === fold(b)

/**
 * Hedefin sayfaları (en yeni önce korunur). Bölüm dosyasının defter adı klasörden gelir ve
 * defterin görünen adından ayrışabilir: iki ad birlikte tutmazsa yalnız bölüm adına bakılır.
 */
export function pagesOfTarget(
  pages: readonly OneNotePage[],
  target: OneNoteTarget | null,
): OneNotePage[] {
  if (!target || (!target.notebook && !target.section)) return [...pages]
  const nb = (p: OneNotePage) => !target.notebook || same(p.notebook, target.notebook)
  if (!target.section) return pages.filter(nb)
  const both = pages.filter((p) => nb(p) && same(p.section, target.section))
  return both.length ? both : pages.filter((p) => same(p.section, target.section))
}

/** Arama: her kelime başlıkta, defterde ya da bölümde geçmeli (Türkçe duyarsız). */
export function searchPages(pages: readonly OneNotePage[], text: string): OneNotePage[] {
  const words = fold(text).split(/\s+/).filter(Boolean)
  if (!words.length) return [...pages]
  return pages.filter((p) => {
    const hay = fold(`${p.title} ${p.notebook} ${p.section}`)
    return words.every((w) => hay.includes(w))
  })
}
