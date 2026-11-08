import { useState } from "react"

/** Listeyi `size`lık sayfalara böler; filtre listeyi kısaltınca sayfa son sayfaya iner. */
export function usePaged(list, size) {
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(list.length / size))
  const at = Math.min(page, pages - 1)
  const items = list.slice(at * size, at * size + size)
  return { at, pages, setPage, items, from: at * size + 1, to: at * size + items.length }
}
