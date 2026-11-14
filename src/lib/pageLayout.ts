/**
 * SAYFA DÜZENİ — kişinin bir sayfa için seçtiği düzen (Profil › Görünüm › Sayfa düzeni). Her
 * sayfanın ilk seçeneği o sayfanın VARSAYILANIDIR (`DEFAULT_LAYOUTS`); ötekiler ayarda bu sırayla
 * sunulur. Anasayfa'nın varsayılanı Sahneler (ürün sahibinin kararı); ilk düzen ("standard")
 * "Yedek" adıyla ikinci sırada durur (Açık Raf kaldırıldı; kayıtlı `shelf` seçimi tanınmaz, varsayılana düşer). Seçim bu tarayıcıda saklanır (`tyro-page-layout-v1`, yalnız
 * kimlikler — kişisel veri değil) ve aynı sekmede özel olayla, öteki sekmelerde `storage` olayıyla
 * duyurulur.
 *
 * Kimlikler depolama değeridir: yayından sonra değiştirilmez ("standard" artık Yedek'in kimliği).
 * Varsayılan depoya yazılmaz ("seçmedim" ile "seçtim" ayrımı kalsın: seçmemiş kişi varsayılan
 * değişince yenisini görür); tanınmayan kayıt varsayılana düşer.
 */
const KEY = "tyro-page-layout-v1"
const EVENT = "tyro:page-layout"

export const PAGE_LAYOUTS = {
  home: ["scenes", "standard"],
  selfService: ["standard", "cards"],
} as const

export type LayoutPage = keyof typeof PAGE_LAYOUTS
export type LayoutId<P extends LayoutPage = LayoutPage> = (typeof PAGE_LAYOUTS)[P][number]

/** Sayfanın varsayılan düzeni (listesinin ilki). */
export const DEFAULT_LAYOUTS: { [P in LayoutPage]: LayoutId<P> } = {
  home: "scenes",
  selfService: "standard",
}
export const defaultLayout = <P extends LayoutPage>(page: P): LayoutId<P> => DEFAULT_LAYOUTS[page]

/** Ayarda görünen sayfalar (Profil › Görünüm › Sayfa düzeni), bu sırayla. */
export const LAYOUT_PAGES: LayoutPage[] = ["home", "selfService"]

function readAll(): Record<string, unknown> {
  if (typeof window === "undefined") return {}
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "{}")
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export function readPageLayout<P extends LayoutPage>(page: P): LayoutId<P> {
  const value = readAll()[page]
  const valid = PAGE_LAYOUTS[page] as readonly string[]
  return (
    typeof value === "string" && valid.includes(value) ? value : defaultLayout(page)
  ) as LayoutId<P>
}

export function writePageLayout<P extends LayoutPage>(page: P, id: LayoutId<P>): void {
  if (typeof window === "undefined") return
  if (!(PAGE_LAYOUTS[page] as readonly string[]).includes(id)) return
  const next = { ...readAll() }
  if (id === defaultLayout(page)) delete next[page]
  else next[page] = id
  try {
    if (Object.keys(next).length) window.localStorage.setItem(KEY, JSON.stringify(next))
    else window.localStorage.removeItem(KEY)
  } catch {
    // Depo kapalı: seçim yenilemede varsayılana döner.
  }
  window.dispatchEvent(new Event(EVENT))
}

export function subscribePageLayout(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}
