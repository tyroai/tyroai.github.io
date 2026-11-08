import { highlightRanges } from "@/lib/filesFormat"

/** Sorgunun geçtiği yerler vurgulu (Türkçe harf duyarsız; `innerHTML` yok). */
export function SpotlightMark({ text, query }) {
  const ranges = query ? highlightRanges(text, query) : []
  if (!ranges.length) return text
  const out = []
  let at = 0
  ranges.forEach(([a, b], i) => {
    if (a > at) out.push(text.slice(at, a))
    out.push(
      <mark key={i} className="rounded-sm bg-brand/[0.14] text-inherit">
        {text.slice(a, b)}
      </mark>,
    )
    at = b
  })
  if (at < text.length) out.push(text.slice(at))
  return out
}
