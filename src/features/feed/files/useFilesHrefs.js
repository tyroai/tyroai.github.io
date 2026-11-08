import { useCallback, useMemo } from "react"
import { ORG_CHART_URL } from "@/data/companyDocs"
import { CDN_IMAGE_COUNT, POLICY_ITEMS } from "@/features/feed/lib/corporateFiles"
import { tokenFor } from "@/features/feed/lib/filesLocation"

/**
 * Dosyalarım'ın adres yazıcıları: `hrefWith(patch)` (Dosyalarım bölümünde kalan adres),
 * `hrefFor(item)` (bir yere giden bağlantı) ve kapıların hazır adresleri (`hrefs`). Yer kapıları
 * bir YER açar → push (D-12).
 */
export function useFilesHrefs(params, pathname) {
  const hrefWith = useCallback(
    (patch) => {
      const p = new URLSearchParams(params)
      p.set("sec", "docs")
      p.delete("post")
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") p.delete(k)
        else p.set(k, v)
      }
      return `${pathname}?${p.toString()}`
    },
    [params, pathname],
  )
  const hrefFor = useCallback(
    (item) => {
      const tk = tokenFor(item)
      return tk ? hrefWith({ floc: tk, fsrc: null }) : null
    },
    [hrefWith],
  )
  const hrefs = useMemo(
    () => ({
      policy: hrefWith({ floc: "c~pol", fsrc: null }),
      cdn: hrefWith({ floc: "c~img", fsrc: null }),
      org: ORG_CHART_URL,
      onedrive: hrefWith({ floc: "od", fsrc: null }),
      spRoot: hrefWith({ floc: "sp", fsrc: null }),
      corporate: hrefWith({ floc: "c", fsrc: null }),
      policyCount: POLICY_ITEMS.length,
      imageCount: CDN_IMAGE_COUNT,
    }),
    [hrefWith],
  )
  return { hrefWith, hrefFor, hrefs }
}
