// tyroRM belge deposu: Dataverse `tyro_rmdoc` tablosu. Plan tek satırda JSON durur (tür "plan");
// plan geçmişi aynı tabloda "snapshot" satırları. Yazma sürüm etiketiyle (ETag, If-Match):
// başkası arada kaydettiyse 412 döner ve hiçbir şey ezilmez.
import { DV_API_BASE, DV_FORBIDDEN, DV_SESSION_EXPIRED, getDataverseToken } from "@/lib/dataverse"
import { httpCause } from "@/lib/errorCause"
import { msalInstance } from "@/lib/msal"
import { suspectSession } from "@/lib/sessionHealth"

const SET = "tyro_rmdocs"
const META = "tyro_rmdocid,tyro_name,tyro_kind,tyro_note,modifiedon,_modifiedby_value"
const FORMATTED = "OData.Community.Display.V1.FormattedValue"
export const RM_CONFLICT = "conflict"
export const RM_NOT_MODIFIED = "not-modified"

function parseBody(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const token = await getDataverseToken()
  const res = await fetch(`${DV_API_BASE}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      "Content-Type": "application/json; charset=utf-8",
      Prefer: `odata.include-annotations="${FORMATTED}"`,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (res.status === 304) return { status: 304, data: null }
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    const err = new Error(`Dataverse ${res.status}: ${text.slice(0, 300) || res.statusText}`)
    // Ekranda neden: HTTP durumu, Dataverse kodu, eksik yetkinin adı (kişisel veri yok).
    err.detail = httpCause("dataverse", res.status, parseBody(text))
    if (res.status === 412) err.code = RM_CONFLICT
    else if (res.status === 401) {
      err.code = DV_SESSION_EXPIRED
      suspectSession(msalInstance)
    } else if (res.status === 403) err.code = DV_FORBIDDEN
    throw err
  }
  return { status: res.status, data: res.status === 204 ? null : await res.json() }
}

function metaOf(row) {
  return {
    id: row.tyro_rmdocid,
    etag: row["@odata.etag"] ?? null,
    name: row.tyro_name ?? "",
    kind: row.tyro_kind ?? "",
    note: row.tyro_note ?? "",
    modifiedOn: row.modifiedon ?? null,
    modifiedBy: row[`_modifiedby_value@${FORMATTED}`] ?? "",
  }
}

function parseContent(row) {
  try {
    return row.tyro_content ? JSON.parse(row.tyro_content) : null
  } catch {
    return null
  }
}

/** Planın satırı: { meta, doc } — tabloda plan yoksa null. */
export async function readPlan() {
  const q = `${SET}?$select=${META},tyro_content&$filter=tyro_kind eq 'plan'&$orderby=modifiedon desc&$top=1`
  const { data } = await request(q)
  const row = data?.value?.[0]
  return row ? { meta: metaOf(row), doc: parseContent(row) } : null
}

/** Plan değişti mi? Değişmediyse 304 ile ucuz cevap: { fresh: true }. */
export async function checkPlan(id, etag) {
  const { status, data } = await request(`${SET}(${id})?$select=${META}`, {
    headers: etag ? { "If-None-Match": etag } : {},
  })
  return status === 304 ? { fresh: true } : { fresh: false, meta: metaOf(data) }
}

/** Planı yazar; `etag` eskiyse RM_CONFLICT fırlatır. Yeni meta döner. */
export async function writePlan(id, etag, doc) {
  const { data } = await request(`${SET}(${id})?$select=${META}`, {
    method: "PATCH",
    headers: {
      "If-Match": etag || "*",
      Prefer: `return=representation,odata.include-annotations="${FORMATTED}"`,
    },
    body: { tyro_content: JSON.stringify(doc) },
  })
  return metaOf(data)
}

/** İlk yükleme: tabloda plan satırı yoksa oluşturur. */
export async function createPlan(doc) {
  const { data } = await request(`${SET}?$select=${META}`, {
    method: "POST",
    headers: { Prefer: `return=representation,odata.include-annotations="${FORMATTED}"` },
    body: { tyro_name: "plan", tyro_kind: "plan", tyro_content: JSON.stringify(doc) },
  })
  return metaOf(data)
}

/** Anlık görüntü: planın o anki hâli, geri dönülebilsin diye. */
export async function createSnapshot(doc, note) {
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ")
  const { data } = await request(`${SET}?$select=${META}`, {
    method: "POST",
    headers: { Prefer: `return=representation,odata.include-annotations="${FORMATTED}"` },
    body: {
      tyro_name: `snapshot ${stamp}`,
      tyro_kind: "snapshot",
      tyro_note: String(note || "").slice(0, 2000),
      tyro_content: JSON.stringify(doc),
    },
  })
  return metaOf(data)
}

/** Son anlık görüntüler (içeriksiz). */
export async function listSnapshots(top = 20) {
  const q = `${SET}?$select=${META}&$filter=tyro_kind eq 'snapshot'&$orderby=createdon desc&$top=${top}`
  const { data } = await request(q)
  return (data?.value ?? []).map(metaOf)
}

/** Tek satırın içeriği (anlık görüntüye dönmek için). */
export async function readDoc(id) {
  const { data } = await request(`${SET}(${id})?$select=${META},tyro_content`)
  return { meta: metaOf(data), doc: parseContent(data) }
}
