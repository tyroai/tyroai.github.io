import { useCallback, useEffect, useState } from "react"
import { DEFAULT_IDS, MAX_ROWS, sanitizeList } from "@/lib/marketCatalog"

const KEY = "tyro-market-list-v1"

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null")
    return v?.v === 1 ? sanitizeList(v.ids) : DEFAULT_IDS
  } catch {
    return DEFAULT_IDS
  }
}

/**
 * Kişinin Piyasa listesi — en çok `MAX_ROWS`, en az bir satır; bu tarayıcıda (`tyro-market-list-v1`,
 * kayıt defteri `data/appMeta.js`; yalnız kimlikler — tercih, kişisel veri değil).
 */
export function useMarketList() {
  const [ids, setIds] = useState(read)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 1, ids }))
    } catch {
      // Depo kapalı: liste bu oturumda kalır.
    }
  }, [ids])

  const toggle = useCallback(
    (id) =>
      setIds((list) => {
        if (list.includes(id)) return list.length > 1 ? list.filter((x) => x !== id) : list
        return list.length < MAX_ROWS ? [...list, id] : list
      }),
    [],
  )
  const reset = useCallback(() => setIds(DEFAULT_IDS), [])

  return { ids, full: ids.length >= MAX_ROWS, toggle, reset }
}
