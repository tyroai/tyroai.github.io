import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { queryTerms } from "@/features/help/helpSearch"
import { useIsInGroup } from "@/hooks/useIsInGroup"
import { usePageAccess } from "@/hooks/usePageAccess"
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { entriesSince, latestEntryId, visibleEntries } from "@/data/changelog"
import { readSeenId, writeSeenId } from "./entryText"
import {
  countByKind,
  groupByDate,
  lastUnreadIndex,
  monthsOf,
  orderWithinDays,
  PAGE_SIZE,
  searchEntries,
} from "./changelogList"

/**
 * Yenilikler sayfasının durumu ve türetilmiş listeleri (görünüm `WhatsNewPage`te).
 *
 * Okundu işareti SAYFA AÇILINCA yazılır (sayaç sönsün), ama "son ziyaretinden bu yana" işaretleri
 * için yazılmadan ÖNCEKİ değer lazım: `useState` ilk karede, yazımdan önce okur ve ziyaret boyunca
 * sabit kalır. Sonraki ziyarette işaret en yeni kayda çekilmiş olur, yani noktalar söner.
 */
export function useChangelogView() {
  // ÜÇ DEĞERLİ: `undefined` = çözülmedi. Cevap gelmeden işaret YAZILMAZ — bekleyen kare listeyi dar
  // gösterir ve o listeden yazılan işaret yöneticiye özel kayıtları okunmuş yapardı.
  const adminVerdict = useIsInGroup(ADMIN_GROUP_ID)
  const isAdmin = adminVerdict === true
  const { canOpen } = usePageAccess()
  const [seenBefore] = useState(() => readSeenId())
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState("all")
  const [limit, setLimit] = useState(PAGE_SIZE)
  // `useLocation`: aynı sayfadayken yalnız hash değişince (kaş/başlıktan başka kayda gitmek) de
  // yeniden çizim ve kaydırma olsun.
  const targetId = useLocation().hash.slice(1)

  // Rota kapısı: açamadığı sayfayı anlatan kayıt arşivde de yok (`visibleEntries` › `canOpen`).
  const entries = useMemo(() => visibleEntries({ isAdmin, canOpen }), [isAdmin, canOpen])
  const latest = latestEntryId(entries)
  // Efektte yazılır: yazım bir olay yayınlıyor ve kenar çubuğu sayacı dinliyor — çizim sırasında
  // yazmak başka bileşenin durumunu çizim içinde güncellemek olurdu.
  useEffect(() => {
    if (latest && adminVerdict !== undefined) writeSeenId(latest)
  }, [latest, adminVerdict])

  const unreadIds = useMemo(
    () => new Set(entriesSince(seenBefore, entries).map((e) => e.id)),
    [seenBefore, entries],
  )

  return {
    isAdmin,
    entries,
    latest: entries[0] ?? null,
    unreadIds,
    returning: Boolean(seenBefore),
    query,
    kind,
    limit,
    targetId,
    setQuery: (value) => {
      setQuery(value)
      setLimit(PAGE_SIZE)
    },
    setKind: (value) => {
      setKind(value)
      setLimit(PAGE_SIZE)
    },
    setLimit,
  }
}

/** Arama + tür süzgeci + sıralama + kırpma. Arama ve süzgeç TÜM kayıtlarda çalışır, yüklenenlerde değil. */
export function useTimeline(view, locale) {
  const { entries, query, kind, limit, targetId, unreadIds } = view
  const terms = useMemo(() => queryTerms(query), [query])
  // Sekme sayıları aramaya göre: "Düzeltme 0" iken boş sekmeye basılmaz.
  const matched = useMemo(() => searchEntries(entries, terms, locale), [entries, terms, locale])
  const counts = useMemo(() => countByKind(matched), [matched])
  const ordered = useMemo(
    () => orderWithinDays(kind === "all" ? matched : matched.filter((e) => e.kind === kind)),
    [matched, kind],
  )

  // Hedef kayıt kırpmanın altında kalabilir: kırpma TÜRETİLİR (`setLimit` değil — efektte setState
  // yasak); büyük olan kazanır.
  const effectiveLimit = useMemo(() => {
    if (!targetId) return limit
    const i = ordered.findIndex((e) => e.id === targetId)
    return i < 0 ? limit : Math.max(limit, i + 1)
  }, [targetId, ordered, limit])

  // `smooth` değil: kullanıcı zaten bir bağlantıya bastı, uzun bir kayma "gitti mi?" sorusu doğurur.
  useEffect(() => {
    if (!targetId) return
    document.getElementById(targetId)?.scrollIntoView({ block: "center" })
  }, [targetId, effectiveLimit])

  const groups = useMemo(() => groupByDate(ordered, effectiveLimit), [ordered, effectiveLimit])
  const months = useMemo(() => monthsOf(ordered), [ordered])
  const visible = Math.min(ordered.length, effectiveLimit)
  // Ayraç yalnız GÖRÜNEN kayıtlarda ve arkasında okunmuş bir kayıt varken anlamlı.
  const divider = useMemo(() => {
    const at = lastUnreadIndex(ordered.slice(0, visible), unreadIds)
    return at >= 0 && at < visible - 1 ? ordered[at].id : null
  }, [ordered, visible, unreadIds])

  return {
    terms,
    counts,
    total: ordered.length,
    groups,
    months,
    visible,
    remaining: ordered.length - visible,
    effectiveLimit,
    divider,
    filtered: terms.length > 0 || kind !== "all",
  }
}
