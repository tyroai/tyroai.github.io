import { ymd } from "@/lib/leaveDays"
/**
 * Temsilci atamanın planı ve yazımı. Plan formun değerlerinden kurulur: izne çıkan kişi (oturumun
 * adresi), temsilci, başlangıç ve bitiş. Kayıt İK MCP'sinin `create_delegation`ıyla BİREBİR
 * (`tyro-hr-mcp` › `tools/hr.py`): kullanıcılar adresin @'ten önceki kısmı, başlangıç
 * `T00:00:00Z`, bitiş `T23:59:59Z` (aynı gün bile başlangıç < bitiş), kapsam tüm onaylar, kayıt
 * aktif. MCP F&O'nun OData ucuna (`TRYWorkflowWorkItemDelegationParameters`) yazıyor; tarayıcı
 * aynı tablonun Dataverse projeksiyonuna (`mserp_tryaiworkflowdelegationentities`). Biri
 * değişirse öteki de değişir.
 *
 * ⚠️ Saatler UTC: İstanbul'da devir 03:00'te başlar, bitişten sonraki gün 02:59'a kadar sürer.
 * MCP'yle aynı kalsın diye bilerek böyle; düzeltilecekse ikisi birlikte.
 */

const DEMO_MS = 1400

// Dataverse seçenek değerleri (EntityDefinitions'tan okundu).
export const TYPE_ALL = 200000000
export const ENABLED_YES = 200000001

/** Adresin ERP kullanıcısı: @'ten önceki kısım, küçük harf. */
export const aliasOf = (address) =>
  String(address || "")
    .split("@")[0]
    .trim()
    .toLowerCase()

/**
 * Formdan plan. Hatalar alan anahtarlarıyla (`person` · `start` · `end`) döner; `self`: kişi
 * kendini seçmiş.
 */
export function delegatePlan({ person, start, end, email }) {
  const errors = {}
  if (!person?.address) errors.person = "needPerson"
  else if (email && aliasOf(person.address) === aliasOf(email)) errors.person = "self"
  if (!start) errors.start = "needDate"
  if (!end) errors.end = "needDate"
  if (start && end && end < start) errors.end = "endBefore"
  if (Object.keys(errors).length) return { ok: false, errors }
  return {
    ok: true,
    person: { name: person.name || person.address, address: person.address },
    start,
    end,
    record: {
      mserp_user: aliasOf(email),
      mserp_delegateto: aliasOf(person.address),
      mserp_fromdate: `${ymd(start)}T00:00:00Z`,
      mserp_todate: `${ymd(end)}T23:59:59Z`,
      mserp_type: TYPE_ALL,
      mserp_enabled: ENABLED_YES,
    },
  }
}

// Yazıcı tembel: `erpWrite` MSAL'a bağlı, plan ise saf kalsın (testler ve ilk yükleme).
const writeRecord = async (set, body) =>
  (await import("@/features/selfservice/lib/erpWrite")).createRecord(set, body)

export const DELEGATE_SET = "mserp_tryaiworkflowdelegationentities"

/**
 * Yazım. `demo`: istek yok, bekleyip başarı döner (`result.demo` pencerede yazılır). `create`:
 * testte sahte yazıcı.
 *
 * ⚠️ Kaydın kimliği (`mserp_id`) GÖNDERİLMEZ — MCP de göndermiyor, kimliği F&O veriyor. F&O'da alan
 * GUID, Dataverse'te metin; sanal tablo köprüsü (`CDSVirtualEntityController`
 * › `convertEntityValueToFieldValue`) metni GUID'e çevirmiyor ve kayıt "Specified cast is not
 * valid" ile düşüyor (canlıda ölçüldü).
 */
export async function submitDelegate(plan, { onStep, demo = true, create = writeRecord } = {}) {
  onStep?.("delegate")
  if (demo) {
    await new Promise((r) => setTimeout(r, DEMO_MS))
    return { kind: "delegate", number: null, demo: true, record: plan.record }
  }
  await create(DELEGATE_SET, plan.record)
  return { kind: "delegate", number: null, record: plan.record }
}
