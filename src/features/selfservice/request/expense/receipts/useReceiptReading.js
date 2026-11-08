import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useToday } from "@/hooks/useToday"
import { readReceipt, warmReader } from "@/features/selfservice/lib/receiptReader"
import {
  isFillableLine,
  mergeReading,
  readingToLine,
} from "@/features/selfservice/lib/receiptReading"

// Aynı anda okunan fiş: hız için paralel, Copilot'u boğmayacak kadar.
const PARALLEL = 4
const OK = "done"
// Okunacak fiş: hiç okunmamış ya da bağlantı hatası almış. "Fiş değil", "birden çok fiş",
// "okunamadı" ajanın kesin cevabı: yeniden okumak aynı sonucu verir (fiş değiştirilir).
const pending = (status, r) => {
  const s = status[r.id]?.status
  return !s || s === "failed"
}

/** `list`i en çok `n` iş paralel çalıştırır; her öğe `fn(öğe, sıra)`. */
async function pool(list, n, fn) {
  let next = 0
  const lane = async () => {
    while (next < list.length) {
      const i = next++
      await fn(list[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, list.length) }, lane))
}

/**
 * Fişlerden doldurma (tyroReader, düğmeyle): okunmamış her fiş paralel okunur, sonuç geldiği
 * anda kendi kalemine yazılır — önce boş kalemler (tutarı ve kategorisi yok) fişlerin sırasıyla,
 * artanlar yeni kalem (sıra korunur). Kişinin yazdığı ezilmez (`mergeReading`). `status`: fiş →
 * { status: "reading" | "done" | "unreadable" | "not_receipt" | "multiple" | "failed", rowId };
 * `marks`: kalem → okunan değerler (hücredeki "fişten okundu" işareti, değer değişince söner).
 * Fiş eklenince bağlantı önceden ısınır. Bağlantı hatası alan fiş yeniden okunabilir.
 */
export function useReceiptReading(expense) {
  const { locale } = useLocale()
  const today = useToday()
  const [status, setStatus] = useState({})
  const [marks, setMarks] = useState({})
  const [run, setRun] = useState(null)
  const latest = useRef(expense)
  const alive = useRef(true)
  useEffect(() => {
    latest.current = expense
  })
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const any = expense.receipts.length > 0
  useEffect(() => {
    if (any) warmReader()
  }, [any])

  const unread = expense.receipts.filter((r) => pending(status, r))

  const start = useCallback(async () => {
    const list = latest.current.receipts.filter((r) => pending(status, r))
    if (!list.length || run) return
    setRun({ done: 0, total: list.length })
    const blanks = latest.current.rows.filter((r) => isFillableLine(r.values)).map((r) => r.id)
    const targets = list.map((r, i) => blanks[i] ?? `read-${r.id}`)
    const placed = []
    setStatus((s) => ({
      ...s,
      ...Object.fromEntries(list.map((r) => [r.id, { status: "reading" }])),
    }))
    await pool(list, PARALLEL, async (r, i) => {
      let line
      try {
        line = readingToLine(await readReceipt(r.file, { rotate: r.rotate, today }), {
          locale,
          today,
        })
      } catch {
        line = { status: "failed" }
      }
      if (!alive.current) return
      const kept = latest.current.receipts.some((x) => x.id === r.id)
      if (line.status === OK && kept) {
        // Yeni kalem, sonraki fişlerin zaten yazılmış kaleminin önüne: sıra fişlerinki.
        const before = placed.find((id, j) => j > i && id) ?? null
        latest.current.placeRow(targets[i], (cur) => mergeReading(cur, line.values, today), before)
        placed[i] = targets[i]
        setMarks((m) => ({ ...m, [targets[i]]: line.values }))
      }
      setStatus((s) => ({
        ...s,
        [r.id]: { status: kept ? line.status : "failed", rowId: placed[i] },
      }))
      setRun((p) => (p ? { ...p, done: p.done + 1 } : p))
    })
    if (alive.current) setRun(null)
  }, [status, run, today, locale])

  const count = unread.length
  // Kimliği sabit: başlık (`memo`) kalem yazılırken yeniden çizilmesin.
  return useMemo(
    () => ({ status, marks, run, unread: count, start }),
    [status, marks, run, count, start],
  )
}
