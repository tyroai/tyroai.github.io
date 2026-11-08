import { useMemo, useState } from "react"
import { TEAM_ALIASES } from "@/features/rm/lib/teamAliases"
import { uid } from "@/features/rm/lib/edit/ops"
import { lkKey, lkLocked, lkUse, countUses } from "@/features/rm/lib/edit/setup"

const FOLD = { ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c" }
const nrm = (s) =>
  String(s || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[ışğüöç]/g, (c) => FOLD[c])
    .replace(/\s+/g, " ")
    .trim()

function validTz(tz) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Kurulum listesinin taslağı (tek kayıtla yazılır): satır ekle, adını ya da alanlarını değiştir,
 * sırala, sil. Kullanılan değer silinirken kayıtların taşınacağı değer seçilir (şartname
 * "Taşı ve sil"). Satır: { k, orig (kayıttaki asıl anahtar ya da null), ...alanlar }.
 */
export function useListDraft(S, kind) {
  const [rows, setRows] = useState(() =>
    (S.lk?.[kind] || []).map((x) => ({ ...x, k: uid(), orig: lkKey(kind, x) })),
  )
  const [gone, setGone] = useState([])
  const use = useMemo(() => {
    const m = new Map()
    for (const x of S.lk?.[kind] || [])
      m.set(lkKey(kind, x), countUses(lkUse(S, kind, lkKey(kind, x))))
    return m
  }, [S, kind])

  const set = (k, field, v) =>
    setRows((rs) => rs.map((x) => (x.k === k ? { ...x, [field]: v } : x)))
  const move = (k, d) =>
    setRows((rs) => {
      const i = rs.findIndex((x) => x.k === k)
      const j = i + d
      if (i < 0 || j < 0 || j >= rs.length) return rs
      const a = rs.slice()
      ;[a[i], a[j]] = [a[j], a[i]]
      return a
    })
  const remove = (k) => {
    const x = rows.find((y) => y.k === k)
    if (!x) return
    setRows((rs) => rs.filter((y) => y.k !== k))
    if (x.orig != null) setGone((g) => [...g, { ...x, to: "" }])
  }
  const restore = (k) => {
    const x = gone.find((y) => y.k === k)
    if (!x) return
    setGone((g) => g.filter((y) => y.k !== k))
    setRows((rs) => [...rs, x])
  }
  const setTo = (k, to) => setGone((g) => g.map((y) => (y.k === k ? { ...y, to } : y)))
  const add = (o) => setRows((rs) => [...rs, { ...o, k: uid(), orig: null }])

  /** Satır hataları: { k: kod } (`rm.setup.err.*`) ve taşıma eksikleri. */
  const errors = useMemo(() => {
    const e = {}
    const seen = new Map()
    for (const x of rows) {
      const key = kind === "countries" ? x.code : x.name
      if (!String(key || "").trim()) e[x.k] = "required"
      else if (kind === "countries" && !/^[A-Z]{2}$/.test(x.code)) e[x.k] = "code"
      else if (kind === "countries" && !validTz(x.tz)) e[x.k] = "tz"
      else if (kind === "countries" && !String(x.name || "").trim()) e[x.k] = "required"
      else if (seen.has(nrm(key))) e[x.k] = "dup"
      seen.set(nrm(key), x.k)
    }
    for (const g of gone) if ((use.get(g.orig) || 0) > 0 && !g.to) e[g.k] = "moveTo"
    if (!rows.length) e._ = "empty"
    return e
  }, [rows, gone, kind, use])

  /** Kaydetmenin etkisi: ad değişen, silinen, taşınan kayıt sayıları. */
  const summary = useMemo(() => {
    let renamed = 0
    let moved = 0
    for (const x of rows) {
      if (x.orig != null && kind !== "countries" && x.name !== x.orig)
        renamed += use.get(x.orig) || 0
    }
    for (const g of gone) moved += use.get(g.orig) || 0
    return {
      renamed,
      moved,
      deleted: gone.length,
      added: rows.filter((x) => x.orig == null).length,
    }
  }, [rows, gone, kind, use])

  return {
    rows,
    gone,
    use,
    errors,
    summary,
    // Birleşen ekibin kaynakları (AI Danışman, AI Yazılım) da kilitli: adı değişirse birleşme bozulur.
    locked: (x) =>
      x.orig != null &&
      (lkLocked(kind, { name: x.orig, code: x.orig }) ||
        (kind === "teams" && !!TEAM_ALIASES[x.orig])),
    set,
    move,
    remove,
    restore,
    setTo,
    add,
  }
}

/**
 * Taslağı plana uygular. Sıra önemli: önce silinenlerin kayıtları hedefin ESKİ anahtarına taşınır
 * (hedefin adı da değişiyorsa onlar da onunla gider), sonra ad değişiklikleri iki adımda (geçici
 * ada; A↔B takası ya da silinenin adını alan satır kayıtları birleştirmesin), en son sıra.
 */
export function applyListDraft(S, kind, rows, gone, rewrite) {
  for (const g of gone) {
    const target = g.to && rows.find((x) => x.k === g.to)
    if (target) rewrite(S, kind, g.orig, target.orig ?? lkKey(kind, target))
  }
  const renamed = rows.filter((x) => x.orig != null && kind !== "countries" && x.name !== x.orig)
  for (const x of renamed) rewrite(S, kind, x.orig, `\u0000${x.k}`)
  for (const x of renamed) rewrite(S, kind, `\u0000${x.k}`, x.name)
  S.lk[kind] = rows.map((x) =>
    Object.fromEntries(Object.entries(x).filter(([f]) => f !== "k" && f !== "orig")),
  )
}
