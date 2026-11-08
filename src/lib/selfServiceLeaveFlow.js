import { chunks } from "@/lib/selfServiceOdata"

/**
 * İZNİN ONAY SONUCU — F&O'nun "İzin talep iş akışı"ndan (saf; istek çağıranda).
 *
 * İzin satırının durum alanı (`mserp_status`) iş akışından geçen izinlerde "None" kalıyor: akışın
 * sonucu oraya yazılmıyor. Ölçüldü (yılın ikinci yarısı, 2.119 satır): Completed 1.396 · None 648 ·
 * izin kağıdı 75; iptal ve onay adımı değerleri HİÇ kullanılmıyor. "None" satırların akışı
 * çoğunlukla bitmiş (300 örnekte 253 bitti · 12 bekliyor · 16 hatada · 2 iptal · 17 akışsız) ve
 * biten akışın izni bakiyeye "kullanılan" olarak sayılıyor — yani onaylanmış izin.
 *
 * Akış kaydı `mserp_tryaiworkflowtrackingstatustableentities`te: bağlam tablosu izin tablosu
 * (`CONTEXT_TABLE`), bağlam kaydı izin satırının ERP kayıt numarası (RecId). O numara satırın
 * Dataverse kimliğinin son sekiz baytında (little-endian) — `recIdOf`.
 */

// İzin tablosunun F&O tablo numarası (akış kayıtlarının `ContextTableId`si; canlıda ölçüldü).
export const CONTEXT_TABLE = 66271
export const FLOW_ENTITY = "mserp_tryaiworkflowtrackingstatustableentities"

// `mserp_trackingstatus` seçenek değerleri → sonuç. Etiket kişinin Dataverse dilinde gelebildiği
// için sayıyla eşlenir (değerler bu ortamın seçenek kümesinden okundu).
const OUTCOME = Object.freeze({
  200000000: "pending",
  200000001: "completed",
  200000002: "canceled",
  200000003: "stopped",
  200000004: "stopped",
})

/** Sanal tablo kimliği → ERP kayıt numarası ("1d2add75-030f-4007-8780-b0066fd63cfe" → 5637725828). */
export function recIdOf(id) {
  const hex = String(id ?? "")
    .replace(/-/g, "")
    .slice(16)
  if (!/^[0-9a-f]{16}$/i.test(hex)) return null
  let n = 0n
  for (let i = 14; i >= 0; i -= 2) n = (n << 8n) | BigInt(Number.parseInt(hex.slice(i, i + 2), 16))
  return n > 0n && n <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(n) : null
}

/** Sonucu sorulacak satır mı: durum alanı kesin bir sonuç söylemiyorsa (iptal / tamam / kağıt değil). */
export function needsFlow(row) {
  const s = String(
    row?.["mserp_status@OData.Community.Display.V1.FormattedValue"] ?? row?.mserp_status ?? "",
  ).toLowerCase()
  return !/cancel|completed|permission paper/.test(s)
}

/** Kayıt numaraları → akış sorguları (öbek başına bir istek). */
export function flowQueries(recIds) {
  return chunks([...new Set(recIds.filter(Boolean))]).map((part) => ({
    entity: FLOW_ENTITY,
    params: {
      $select: "mserp_contextrecid,mserp_trackingstatus,mserp_instancenumber",
      $filter: `mserp_contexttableid eq ${CONTEXT_TABLE} and (${part
        .map((r) => `mserp_contextrecid eq ${r}`)
        .join(" or ")})`,
    },
  }))
}

/**
 * Akış satırları → `Map(kayıt no → sonuç)`. Bir izin birden çok akış taşıyabilir (iptal edilip
 * yeniden gönderilen): son örnek (en büyük örnek numarası) geçerlidir.
 */
export function flowOutcomes(rows) {
  const best = new Map()
  for (const r of rows ?? []) {
    const rec = Number(r.mserp_contextrecid)
    const nr = Number(r.mserp_instancenumber) || 0
    const outcome = OUTCOME[r.mserp_trackingstatus]
    if (!rec || !outcome) continue
    const prev = best.get(rec)
    if (!prev || nr > prev.nr) best.set(rec, { nr, outcome })
  }
  return new Map([...best].map(([rec, v]) => [rec, v.outcome]))
}
