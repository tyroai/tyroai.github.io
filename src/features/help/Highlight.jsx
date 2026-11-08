import { Fragment } from "react"
import { splitHighlight } from "./helpSearch"

/** Aranan kelimelerin geçtiği yerler `<mark>` ile; kelime yoksa düz metin. */
export function Highlight({ text, terms }) {
  if (!terms?.length || !text) return text
  return splitHighlight(text, terms).map((part, i) =>
    part.hit ? (
      <mark
        key={i}
        className="rounded-[0.1875rem] bg-brand-soft text-brand-on-soft [box-decoration-break:clone] dark:bg-brand/30 dark:text-foreground"
      >
        {part.text}
      </mark>
    ) : (
      <Fragment key={i}>{part.text}</Fragment>
    ),
  )
}
