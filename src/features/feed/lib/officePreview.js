import { docxBlocks, OFFICE_LIMITS, slideOrder, slideText } from "@/features/feed/lib/ooxmlText"
import { readWorkbook } from "@/features/feed/lib/xlsxRead"
import { openZip } from "@/features/feed/lib/zipRead"

/**
 * Word, Excel ve PowerPoint ekinin hızlı önizlemesi — tek giriş (`AttachmentPreviewDialog` ›
 * `OfficeQuickLook`). Dosya bir ZIP'tir (`zipRead`); türüne göre yazı ve tablo çıkarılır:
 * docx `{ type: "docx", blocks, cut }`, xlsx `{ type: "xlsx", sheets, hiddenCount }`, pptx
 * `{ type: "pptx", slides, cut }`. Şifreli ya da bozuk dosyada hata atar (çağıran "önizleme yok"
 * der).
 */
export async function readOffice(blob, ext, locale = "tr") {
  const zip = await openZip(blob)
  if (ext === "docx") {
    const xml = await zip.text("word/document.xml")
    if (!xml) throw new Error("docx")
    return { type: "docx", ...docxBlocks(xml, await zip.text("word/styles.xml")) }
  }
  if (ext === "xlsx") {
    if (!zip.has("xl/workbook.xml")) throw new Error("xlsx")
    return { type: "xlsx", ...(await readWorkbook(zip, locale)) }
  }
  if (ext === "pptx") {
    const order = slideOrder(
      await zip.text("ppt/presentation.xml"),
      await zip.text("ppt/_rels/presentation.xml.rels"),
      zip.names,
    )
    if (!order.length) throw new Error("pptx")
    const slides = []
    for (const name of order.slice(0, OFFICE_LIMITS.slides))
      slides.push(slideText((await zip.text(name)) ?? ""))
    return { type: "pptx", slides, cut: order.length > OFFICE_LIMITS.slides }
  }
  throw new Error("type")
}
