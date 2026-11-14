import { useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/** "A", "B", … "Z", "AA" — sütun başlığı (0'dan). */
const letters = (i) => {
  let n = i + 1
  let out = ""
  while (n > 0) {
    out = String.fromCharCode(65 + ((n - 1) % 26)) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}

const HEADINGS = ["", "text-[1.375rem]", "text-[1.1875rem]", "text-[1rem]", "text-[0.9375rem]"]

/** Word: başlıklar, paragraflar, liste maddeleri (ardışıklar tek liste), tablolar. */
function Document({ blocks }) {
  const groups = []
  for (const b of blocks) {
    const last = groups[groups.length - 1]
    if (b.type === "li" && last?.type === "list") last.items.push(b.text)
    else groups.push(b.type === "li" ? { type: "list", items: [b.text] } : b)
  }
  return (
    <article className="mx-auto w-full max-w-3xl space-y-3 px-5 py-6 text-[0.875rem] leading-relaxed sm:px-8">
      {groups.map((g, i) => {
        if (g.type === "h")
          return (
            <h3
              key={i}
              className={cn("pt-2 font-semibold leading-snug", HEADINGS[Math.min(g.level, 4)])}
            >
              {g.text}
            </h3>
          )
        if (g.type === "list")
          return (
            <ul key={i} className="list-disc space-y-1 ps-6">
              {g.items.map((text, j) => (
                <li key={j} className="whitespace-pre-wrap">
                  {text}
                </li>
              ))}
            </ul>
          )
        if (g.type === "table")
          return (
            <div key={i} className="overflow-x-auto">
              <table className="min-w-full border-collapse text-[0.8125rem]">
                <tbody>
                  {g.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td
                          key={c}
                          className="border border-border/70 px-2.5 py-1.5 align-top whitespace-pre-wrap"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        return (
          <p key={i} className="whitespace-pre-wrap [overflow-wrap:anywhere]">
            {g.text}
          </p>
        )
      })}
    </article>
  )
}

/** Excel: sayfa sekmeleri ve tablo (sütun harfleri, satır numaraları; sayılar sağa yaslı). */
function Workbook({ sheets }) {
  const { t } = useLocale()
  const [at, setAt] = useState(0)
  const sheet = sheets[Math.min(at, sheets.length - 1)]
  return (
    <div className="flex h-full min-h-0 flex-col">
      {sheets.length > 1 && (
        <div
          role="tablist"
          aria-label={t("myfiles.mail.sheets")}
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-border/60 bg-card px-3 py-1.5 [scrollbar-width:none]"
        >
          {sheets.map((s, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === at}
              onClick={() => setAt(i)}
              className={cn(
                "h-8 shrink-0 rounded-lg px-3 text-[0.75rem] font-medium whitespace-nowrap outline-none transition focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:h-10",
                i === at
                  ? "bg-brand/[0.1] text-brand-ink"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      {sheet.cut?.rows || sheet.cut?.cols ? (
        <p className="shrink-0 border-b border-border/60 bg-card px-4 py-1.5 text-[0.75rem] text-muted-foreground">
          {t("myfiles.mail.previewCut")}
        </p>
      ) : null}
      {sheet.rows.length ? (
        <div
          tabIndex={0}
          className="min-h-0 flex-1 overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
        >
          <table className="border-separate border-spacing-0 text-[0.75rem] tabular-nums">
            <thead>
              <tr>
                <td className="sticky start-0 top-0 z-20 border-b border-e border-border/70 bg-muted px-2 py-1" />
                {Array.from({ length: sheet.cols }, (_, c) => (
                  <th
                    key={c}
                    scope="col"
                    className="sticky top-0 z-10 min-w-16 border-b border-e border-border/70 bg-muted px-2 py-1 text-center font-medium text-muted-foreground"
                  >
                    {letters(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((row) => (
                <tr key={row.r}>
                  <th
                    scope="row"
                    className="sticky start-0 z-10 border-b border-e border-border/70 bg-muted px-2 py-1 text-end font-medium text-muted-foreground"
                  >
                    {row.r}
                  </th>
                  {Array.from({ length: sheet.cols }, (_, c) => {
                    const cell = row.cells[c]
                    return (
                      <td
                        key={c}
                        className={cn(
                          "max-w-[22rem] truncate border-b border-e border-border/50 bg-background px-2 py-1",
                          cell?.n && "text-end",
                        )}
                      >
                        {cell?.v}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-6 text-center text-[0.8125rem] text-muted-foreground">
          {t("myfiles.mail.sheetEmpty")}
        </p>
      )}
    </div>
  )
}

/** PowerPoint: slaytlar alt alta — başlık ve yazılar. */
function Slides({ slides }) {
  const { t } = useLocale()
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-5">
      {slides.map((s, i) => (
        <section key={i} className="rounded-xl border border-border/70 bg-card p-4 text-[0.875rem]">
          <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {t("myfiles.mail.slide", { n: i + 1 })}
          </p>
          {s.title && (
            <h3 className="mt-1 text-[1.0625rem] font-semibold leading-snug">{s.title}</h3>
          )}
          {s.lines.length > 0 && (
            <div className="mt-2 space-y-1.5 leading-relaxed">
              {s.lines.map((line, j) => (
                <p key={j} className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {line}
                </p>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

/**
 * WORD · EXCEL · POWERPOINT HIZLI ÖNİZLEMESİ (`AttachmentPreviewDialog`): `data` `features/feed/lib/officePreview`
 * çıktısı. Üstte ne gösterildiğini söyleyen ince şerit (yazı ve tablo; biçim, resim, grafik yok),
 * altında türe göre gövde. Yazı React metni olarak çizilir (`innerHTML` yok): belgedeki hiçbir şey
 * çalışmaz.
 */
export function OfficeQuickLook({ data }) {
  const { t } = useLocale()
  const cut = data.cut ? t("myfiles.mail.previewCut") : null
  return (
    <div className="flex h-full flex-col bg-background">
      <p className="shrink-0 border-b border-border/60 bg-card px-4 py-1.5 text-[0.75rem] text-muted-foreground">
        {t("myfiles.mail.quickLook")}
        {cut && <span> {cut}</span>}
      </p>
      <div className="min-h-0 flex-1 overflow-auto">
        {data.type === "docx" && <Document blocks={data.blocks} />}
        {data.type === "xlsx" && <Workbook sheets={data.sheets} />}
        {data.type === "pptx" && <Slides slides={data.slides} />}
      </div>
    </div>
  )
}
