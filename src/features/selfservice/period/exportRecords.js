import { csvFileName, csvFor } from "@/features/selfservice/lib/selfServiceCsv"
import { lineInFacet } from "@/features/selfservice/lib/selfServiceFilters"
import { downloadText } from "./download"

/**
 * Süzülmüş listenin CSV'si (dönem çubuğunun "Dışa aktar"ı; geniş ekranda kartın tepsisinde,
 * telefonda özet satırında). Masrafta kategori süzgeci açıksa dosyaya yalnız uyan kalemler
 * girer — ekrandaki özetle aynı.
 */
export function exportRecords(t, { tab, year, view }) {
  const facet = tab === "expense" ? view.filters.facet : null
  const rows = facet
    ? view.shown.map((r) => ({ ...r, lines: r.lines.filter((l) => lineInFacet(l, facet)) }))
    : view.shown
  downloadText(csvFor(tab, rows, t), csvFileName(tab, year, t))
}
