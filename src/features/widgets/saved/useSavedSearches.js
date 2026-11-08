import { useCallback, useEffect, useState } from "react"
import {
  addSaved,
  markSeen,
  parseSaved,
  removeSaved,
  SAVED_KEY,
  serializeSaved,
} from "@/features/widgets/lib/savedSearch"

function read() {
  try {
    return parseSaved(localStorage.getItem(SAVED_KEY))
  } catch {
    return []
  }
}

// Aynı sayfadaki kopyalar (Anasayfa kartı, header tepsisi) aynı listeyi görsün.
const listeners = new Set()

function write(list) {
  try {
    localStorage.setItem(SAVED_KEY, serializeSaved(list))
  } catch {
    // Depo kapalı: liste bu oturumda kalır.
  }
  for (const fn of listeners) fn(list)
}

/** İğnelenen aramalar (en çok iki) ve son bakış anları; bu tarayıcıda, kişinin tercihi. */
export function useSavedSearches() {
  const [list, setList] = useState(read)
  useEffect(() => {
    listeners.add(setList)
    return () => listeners.delete(setList)
  }, [])
  const apply = useCallback((fn) => {
    const prev = read()
    const next = fn(prev)
    if (next !== prev) write(next)
  }, [])
  const add = useCallback((q) => apply((l) => addSaved(l, q, Date.now())), [apply])
  const remove = useCallback((id) => apply((l) => removeSaved(l, id)), [apply])
  const seen = useCallback((id) => apply((l) => markSeen(l, id, Date.now())), [apply])
  return { list, add, remove, seen }
}
