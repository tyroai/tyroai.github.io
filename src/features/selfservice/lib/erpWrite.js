import { HR_DATAVERSE_URL } from "@/lib/msal"
import { erpDeniedCause } from "@/lib/errorCause"
import { token } from "@/lib/selfServiceHttp"

/**
 * ERP'ye YAZMANIN TEK YÜZEYİ — tarayıcıdan, kişinin KENDİ oturumuyla (`hrRequest`), F&O'ya bağlı
 * Dataverse'ün sanal tablolarına. Okuma `selfServiceHttp.js`te kaldı; neyin yazılabildiğini
 * denetlemek isteyen yalnız bu dosyaya bakar. Kurallar:
 *
 * - **Donmuş beyaz liste:** yazılabilir tablo ve alanlar `WRITABLE`da. Listede olmayan ad
 *   SESSİZCE ATILMAZ, hata fırlatır (yanlış eklenmiş bir alan görünmez kalmasın).
 * - **Yalnız oluşturma (POST):** güncelleme ya da silme yolu yok.
 * - **Yeniden deneme YOK:** okumadaki 502/503/504 tekrarı burada çift kayıt demek.
 *
 * Belirteç ve gövde loglanmaz.
 */

const API = `${HR_DATAVERSE_URL}/api/data/v9.2`

export const WRITABLE = Object.freeze({
  mserp_tryaiboraxallowancetransselfentities: [
    "mserp_allowancetypeid",
    "mserp_dataareaid",
    "mserp_description",
    "mserp_email",
    "mserp_startdate",
    "mserp_enddate",
    "mserp_isworkflow",
  ],
  mserp_tryaiemployeexpenseentities: [
    "mserp_transdate",
    "mserp_workflowstatus",
    "mserp_explanation",
    "mserp_email",
    "mserp_sourcecompanyid",
    "mserp_targetcompanyid",
  ],
  mserp_tryaiemployeexpensetransentities: [
    "mserp_expnumber",
    "mserp_costtype",
    "mserp_transdate",
    "mserp_amount",
    "mserp_currency",
    "mserp_trydocumentnumber",
    "mserp_trycostlocation",
    "mserp_explanation",
    "mserp_companyname",
    "mserp_numberofpeople",
  ],
  mserp_tryaiexpenseworkflowentities: ["mserp_expnumber", "mserp_description", "mserp_dataareaid"],
  mserp_tryaiemployeexpenseattachmentsentities: [
    "mserp_expnumber",
    "mserp_dataareaid",
    "mserp_name",
    "mserp_filename",
    "mserp_filetype",
    "mserp_typeid",
    "mserp_filecontents",
    "mserp_notes",
    "mserp_restriction",
  ],
  mserp_tryaitrvcashadvanceentities: [
    "mserp_dataareaid",
    "mserp_email",
    "mserp_requesteddate",
    "mserp_requestedamountcur",
    "mserp_currencycode",
    "mserp_purpose",
    "mserp_destination",
    "mserp_targetcompanyid",
    "mserp_trypaymentmode",
    "mserp_notes",
    "mserp_tryundocumented",
    "mserp_isworkflow",
  ],
  mserp_tryaiworkflowdelegationentities: [
    "mserp_user",
    "mserp_delegateto",
    "mserp_fromdate",
    "mserp_todate",
    "mserp_type",
    "mserp_enabled",
  ],
})

export class ErpWriteError extends Error {
  /** `kind`: "denied" (yetki) · "rejected" (ERP reddetti — ileti ERP'nin) · "network" · "error". */
  constructor(kind, message, code = null) {
    super(message)
    this.kind = kind
    this.code = code
  }
}

/** Gövde beyaz listede mi; değilse fırlatır (saf, test edilir). */
export function assertWritable(entitySet, body) {
  const allowed = WRITABLE[entitySet]
  if (!allowed) throw new Error(`ERP'ye yazılamaz tablo: ${entitySet}`)
  const extra = Object.keys(body ?? {}).filter((k) => !allowed.includes(k))
  if (extra.length) throw new Error(`ERP'ye yazılamaz alan (${entitySet}): ${extra.join(", ")}`)
}

/** Dataverse'ün hata gövdesi → ERP'nin kendi cümlesi (teşhis için tek kaynak, olduğu gibi). */
export function erpMessage(body, status) {
  const msg = String(body?.error?.message ?? "").trim()
  return msg || `HTTP ${status}`
}

// Yetki reddinin cümleleri. Dataverse'ün kendi reddi 403 döner; F&O'nun entity reddi ise sanal tablo
// üzerinden 400 ("You do not have permission to execute <Entity> <işlem>", tyrotrade'de sahada
// ölçüldü). Kalıplar DAR tutulur: "insert not allowed for field …" gibi bir VERİ hatası yetki
// sayılırsa talep sessizce TYRO'ya kaçar ve ERP'deki sorun görünmez olur.
const DENIAL = [
  /is missing prv\w+ privilege/i,
  /you do not have permission to execute/i,
  /finance and operations administrator/i,
  /not a member of the organization|user is disabled|is not licensed/i,
]

/** ERP'nin cümlesi bir yetki reddi mi (kişi bu kaydı açamaz; düzeltip yeniden denemek işe yaramaz). */
export const isDenial = (message) => DENIAL.some((re) => re.test(String(message ?? "")))

const HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json; charset=utf-8",
  "OData-MaxVersion": "4.0",
  "OData-Version": "4.0",
}

async function send(url, init) {
  let res
  try {
    res = await fetch(url, init)
  } catch {
    throw new ErpWriteError("network", "network")
  }
  if (res.ok) return res
  const body = await res.json().catch(() => null)
  const message = erpMessage(body, res.status)
  if (res.status === 401 || res.status === 403 || (res.status < 500 && isDenial(message)))
    throw new ErpWriteError("denied", message, erpDeniedCause(res.status, body))
  throw new ErpWriteError(res.status >= 500 ? "error" : "rejected", message, `HTTP ${res.status}`)
}

const idFrom = (res) =>
  /\(([0-9a-f-]{36})\)\s*$/i.exec(res.headers.get("OData-EntityId") ?? "")?.[1]

/**
 * Tek kayıt oluşturur. `select` verilirse oluşan kaydın o alanları döner (ör. masraf no):
 * önce `return=representation`, dönmezse kaydın kimliğiyle bir okuma. Dönüş `{ id, record }`.
 */
export async function createRecord(entitySet, body, { select = null, auth = null } = {}) {
  assertWritable(entitySet, body)
  const bearer = auth ?? (await token(false))
  const headers = { ...HEADERS, Authorization: `Bearer ${bearer}` }
  if (select) headers.Prefer = "return=representation"
  const query = select ? `?$select=${select}` : ""
  const res = await send(`${API}/${entitySet}${query}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  const record = res.status === 201 ? await res.json().catch(() => null) : null
  const id = record?.[`${entitySet.replace(/ies$/, "y")}id`] ?? idFrom(res) ?? null
  if (!select || (record && record[select.split(",")[0]])) return { id, record }
  if (!id) return { id, record }
  // Temsil dönmediyse (sanal tablolarda olabiliyor) kaydı kimliğiyle oku. Okuma en iyi çabayla:
  // kayıt ERP'de zaten var — burada fırlatmak "hiçbir şey yazılmadı" dedirtir ve yeniden gönderilen
  // talep ikinci bir kayıt açardı. Numara okunamazsa `record` boş döner.
  try {
    const read = await send(`${API}/${entitySet}(${id})?$select=${select}`, {
      headers: { ...HEADERS, Authorization: `Bearer ${bearer}` },
    })
    return { id, record: await read.json().catch(() => null) }
  } catch {
    return { id, record: null }
  }
}
