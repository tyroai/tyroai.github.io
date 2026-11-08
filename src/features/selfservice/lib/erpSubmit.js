import { createRecord, ErpWriteError } from "@/features/selfservice/lib/erpWrite"

/**
 * ERP'ye doğrudan yazmanın sırası — İK MCP'sinin yazma araçlarıyla aynı adımlar. `create`
 * enjekte edilir (testte sahte yazıcı). Bir adım düşerse SONRAKİLER YAPILMAZ ve o ana kadar
 * oluşan kayıt sonuçta kalır: kişi yarım kalan masrafın numarasını görür, yeniden göndermez.
 * `onStep(ad, n, toplam)`: ekrandaki ilerleme ("Kalem 2 / 3").
 */

export const SETS = Object.freeze({
  leave: "mserp_tryaiboraxallowancetransselfentities",
  advance: "mserp_tryaitrvcashadvanceentities",
  header: "mserp_tryaiemployeexpenseentities",
  line: "mserp_tryaiemployeexpensetransentities",
  workflow: "mserp_tryaiexpenseworkflowentities",
  attachment: "mserp_tryaiemployeexpenseattachmentsentities",
})

// Ekin içeriği Dataverse'te en çok bu kadar karakter (base64).
export const ATTACHMENT_MAX_CHARS = 1_048_576
const INTERNAL = 200000000
const noop = () => {}

/** İzin talebi: tek kayıt; onay akışını `mserp_isworkflow` başlatır. */
export async function submitLeave(record, { create = createRecord, onStep = noop } = {}) {
  onStep("leave", 1, 1)
  await create(SETS.leave, record)
  return { kind: "leave" }
}

/** İş avansı: tek kayıt, avans numarasıyla. */
export async function submitAdvance(record, { create = createRecord, onStep = noop } = {}) {
  onStep("advance", 1, 1)
  const { record: back } = await create(SETS.advance, record, {
    select: "mserp_cashadvancenumber",
  })
  return { kind: "advance", number: back?.mserp_cashadvancenumber ?? null }
}

/** "fis-1.jpg" → { stem: "fis-1", ext: "jpg" } */
export function splitName(name) {
  const m = /^(.+)\.([a-z0-9]{1,5})$/i.exec(String(name ?? ""))
  return m ? { stem: m[1], ext: m[2].toLowerCase() } : { stem: String(name || "fis"), ext: "bin" }
}

/** Fiş → ek kaydı (İK MCP'sinin fiş aracıyla aynı belge türleri: görsel Resim, öteki Dosya). */
export function attachmentRecord(expNumber, { name, type, base64 }, uploader) {
  const { stem, ext } = splitName(name)
  return {
    mserp_expnumber: expNumber,
    mserp_dataareaid: "dat",
    mserp_name: stem,
    mserp_filename: stem,
    mserp_filetype: ext,
    mserp_typeid: String(type ?? "").startsWith("image/") ? "Resim" : "Dosya",
    mserp_filecontents: base64,
    mserp_notes: `tyro Self Servis'ten yüklendi · ${uploader || "bilinmiyor"}`,
    mserp_restriction: INTERNAL,
  }
}

/**
 * Masraf: başlık → satırlar (sırayla) → onay akışı → fişler. Fişler en sonda ve en iyi çabayla:
 * biri eklenemezse masraf yine oluşmuştur (`failedFiles`). Dönüş `{ kind, number, failedFiles }`;
 * yarıda kalırsa `ErpWriteError` ve üstünde `partial: { number, lines, workflow }`.
 */
export async function submitExpense(
  plan,
  files = [],
  { create = createRecord, onStep = noop, uploader = "" } = {},
) {
  const total = plan.lines.length
  const done = { number: null, lines: 0, workflow: false }
  const fail = (e) => {
    const out = e instanceof ErpWriteError ? e : new ErpWriteError("error", String(e?.message ?? e))
    out.partial = { ...done }
    return out
  }
  try {
    onStep("header", 0, total)
    const { record } = await create(SETS.header, plan.header, { select: "mserp_expnumber" })
    done.number = record?.mserp_expnumber ?? null
    // Başlık açıldı ama numarası okunamadı: kalem eklenemez, kayıt yine de ERP'de var.
    if (!done.number) throw new ErpWriteError("noNumber", "no-number")
    for (const line of plan.lines) {
      onStep("line", done.lines + 1, total)
      await create(SETS.line, { ...line.record, mserp_expnumber: done.number })
      done.lines += 1
    }
    onStep("workflow", total, total)
    await create(SETS.workflow, plan.workflow(done.number))
    done.workflow = true
  } catch (e) {
    throw fail(e)
  }
  const failedFiles = []
  for (let i = 0; i < files.length; i++) {
    onStep("file", i + 1, files.length)
    const f = files[i]
    if (!f.base64 || f.base64.length > ATTACHMENT_MAX_CHARS) {
      failedFiles.push({ name: f.name, reason: "size" })
      continue
    }
    try {
      await create(SETS.attachment, attachmentRecord(done.number, f, uploader))
    } catch (e) {
      failedFiles.push({ name: f.name, reason: e?.message ?? "error" })
    }
  }
  return { kind: "expense", number: done.number, failedFiles }
}

/** Dosya → base64 (data: öneki olmadan). */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve(
        String(reader.result ?? "")
          .split(",")
          .pop() ?? "",
      )
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
