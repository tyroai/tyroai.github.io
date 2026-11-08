import { useMemo } from "react"
import {
  applyFilters,
  facetOptions,
  monthOptions,
  statusOptions,
} from "@/features/selfservice/lib/selfServiceFilters"
import { groupByMonth, inYear } from "@/lib/selfServiceModel"
import { validFilters } from "@/features/selfservice/lib/selfServiceParams"
import { summarize } from "@/lib/selfServiceReport"
import { tabOf } from "./kinds"

/**
 * "Bilgilerim" görünümünün türetilmiş verisi — hepsi bellekte tutulur (sıcak yol: yazarken
 * yalnız arama değişir). Girdi: adlı veri (`withNames`), adresteki seçimler (`readParams`) ve
 * yerel arama. Dönüş:
 *
 *   periodRecords  sekmenin seçili dönemdeki kayıtları (çipler ve seçiciler bunlardan)
 *   filters        geçerli süzgeçler { status, facet, month } (geçersiz → null = Tümü)
 *   shown, groups  süzülmüş liste ve aylık grupları
 *   statusOptions · facetOptions · monthOptions   çip ve seçici seçenekleri (sayılarıyla);
 *                  durum çiplerinin sayısı öteki süzgeçlere ve aramaya uyanlardan (`statusTotal`)
 *   summary        özet kutuları (`summarize`, dönem)
 *   failed         sekmenin bölümü okunamadı
 *   deniedDetail   okunamamanın nedeni rol yetkisiyse ERP'nin kodu (`StateDetail`), yoksa null
 *   failDetail     bölüm hangi nedenle düşerse düşsün ERP'nin kodu (yetki dışı hatalar dahil), yoksa null
 *   statusUnknown  masraf raporlarının (bir kısmının) durumu okunamadı: toplam kuralı uygulanamaz
 *   truncated      geçmiş sınıra vardı ve seçili dönem en eski yılı kapsıyor: liste eksik olabilir
 */
export function useRecordsView({ data, sel, query }) {
  const { tab, year, status, facet, month } = sel
  const all = data?.[tabOf(tab).data] ?? null
  const periodRecords = useMemo(() => (all ? inYear(all, year) : []), [all, year])
  const filters = useMemo(
    () => validFilters({ status, facet, month }, periodRecords, year),
    [status, facet, month, periodRecords, year],
  )
  const shown = useMemo(
    () => applyFilters(periodRecords, { ...filters, query }),
    [periodRecords, filters, query],
  )
  const groups = useMemo(() => groupByMonth(shown), [shown])
  // Durum çipleri dönemde bulunan kategorilerdir (seçim kaybolmasın); sayıları ise öteki süzgeç
  // ve aramayla daralmış listeden: "Tamamlandı 2"ye basınca boş liste çıkmasın.
  const narrowed = useMemo(
    () => applyFilters(periodRecords, { ...filters, status: null, query }),
    [periodRecords, filters, query],
  )
  const options = useMemo(() => {
    const counts = new Map(statusOptions(narrowed).map((o) => [o.id, o.count]))
    return {
      statusOptions: statusOptions(periodRecords).map((o) => ({
        ...o,
        count: counts.get(o.id) ?? 0,
      })),
      statusTotal: narrowed.length,
      facetOptions: facetOptions(periodRecords),
      monthOptions: monthOptions(periodRecords),
    }
  }, [periodRecords, narrowed])
  const summary = useMemo(() => (data ? summarize(data, year) : null), [data, year])
  const section = tabOf(tab).data
  const truncated = useMemo(() => {
    if (!data?.truncated?.includes(section)) return false
    const years = (all ?? []).map((r) => r.date?.getFullYear()).filter((y) => y != null)
    return year == null || !years.length || year <= Math.min(...years)
  }, [data, section, all, year])
  return {
    failed: Boolean(data?.failed?.includes(section)),
    // Bölüm rol yetkisi yüzünden okunamadıysa ERP'nin kodu (ekranda BT'ye iletilecek).
    deniedDetail: data?.denied?.[section] ?? null,
    failDetail: data?.denied?.[section] ?? data?.errors?.[section] ?? null,
    statusUnknown: tab === "expense" && Boolean(data?.failed?.includes("expenseStatus")),
    truncated,
    periodRecords,
    filters,
    shown,
    groups,
    ...options,
    summary,
  }
}
