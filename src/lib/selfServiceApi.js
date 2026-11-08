import { ymd } from "@/lib/leaveDays"
import { anyOf, chunks, list, listAll, listSafe, quote, token } from "@/lib/selfServiceHttp"
import { toAdvance, toBalance, toExpenses, toLeave, toWorker } from "@/lib/selfServiceModel"
import { splitLeaves } from "@/lib/selfServiceSanity"
import { flowOutcomes, flowQueries, needsFlow, recIdOf } from "@/lib/selfServiceLeaveFlow"
import { toEmployment } from "@/lib/selfServiceProfile"

/**
 * Self Servis sorguları — tarayıcıdan, kişinin KENDİ oturumuyla, F&O'ya bağlı Dataverse'ün
 * sanal tablolarından (`celebrations.js`in kalıbı). Tablolar ve süzgeçler tyroHR'nin sorgu
 * akışlarıyla birebir (`TYRO HR/workflows/*Inquiry*`, `İzinBakiye`):
 *
 *   e-posta → personel no.   `mserp_tryaiworkersentities`        (userinfo_networkalias → borax_oldemplid)
 *   izin bakiyesi             `mserp_tryaiallowancesummaryentities` (networkalias)
 *   izin geçmişi              `mserp_boraxallowancetransselfserviceentities` (boraxoldemplid)
 *   masraf satırları          `mserp_tryaiemployeexpensetransentities`       (employenumber)
 *   masraf raporu başlığı     `mserp_tryaiemployeexpenseentities`            (expnumber)
 *   iş avansları              `mserp_trvcashadvanceentities`   (requestingworkerpersonnelnumber)
 *   işe giriş (yedek)         `mserp_hcmemploymententities`    (personnelnumber; İK MCP'sinin kolonları)
 *
 * `$select` yalnız doğrulanmış kolonlarla: bilinmeyen kolon adı Dataverse'te 400 verir ve
 * bölümü düşürür. Ek alanlar için `$select`'siz okunan sorgu düşerse doğrulanmış seçimle
 * bir kez daha denenir (`listSafe`, `selfServiceHttp.js`) — ekran bugünkünden geriye gitmez.
 *
 * ⚠️ Süzgeç istemcide: yetki ERP'nin ve Dataverse güvenlik rolünün işi. Ekran yalnız kişinin
 * kendi kayıtlarını ister; başkasının kaydını okuyabilmek rol ayarına bağlı (docs/features/self-servis.md).
 */

// Geçmişin üst sınırı (satır): sınıra varılan bölüm `truncated`ta, eksik olduğu ekranda yazılır.
export const HISTORY_TOP = 500
// Masraf başlığı öbekleri aynı anda en çok bu kadar istek.
const HEADER_PARALLEL = 4

// tyroHR'nin sorgu akışlarındaki seçimler (birebir) — yedek.
export const WORKER_BASE = "mserp_userinfo_networkalias,mserp_borax_oldemplid"
const ADVANCE_BASE =
  "mserp_cashadvancenumber,mserp_requestingworkerpersonnelnumber,mserp_requesteddate,mserp_purpose,mserp_location,mserp_requestedamount,mserp_currency,mserp_note,mserp_cashadvancestatus"
const HEADER_BASE = "mserp_expnumber,mserp_workflowstatus"
// İK MCP'sinin canlıda seçtiği ek çalışan kolonları (ad, unvan, görev): profil başlığında Graph boşsa.
const WORKER_FULL = `${WORKER_BASE},mserp_dirperson_name,mserp_hcm_titleid,mserp_position_description,mserp_hcmworker_personnelnumber`
// İK MCP'sinin işe giriş ve masraf formu sorgularında görülen kolonlar (doğrulanmış adlar).
const EMPLOYMENT_SELECT = "mserp_personnelnumber,mserp_legalentityid,mserp_employmentstartdate"

export { SelfServiceError } from "@/lib/selfServiceHttp"

/** Kişinin e-posta adları (UPN ve varsa e-posta) — ERP'nin "network alias"ı ikisinden biri. */
export function aliasesOf(account) {
  const out = [account?.username, account?.idTokenClaims?.email]
  return [...new Set(out.filter(Boolean).map((s) => s.trim().toLowerCase()))]
}

async function findWorker(auth, aliases) {
  for (const alias of aliases) {
    const rows = await listSafe(
      auth,
      "mserp_tryaiworkersentities",
      {
        $select: WORKER_FULL,
        $filter: `mserp_userinfo_networkalias eq ${quote(alias)}`,
        $top: 1,
      },
      { $select: WORKER_BASE },
    )
    const worker = toWorker(rows[0], alias)
    if (worker) return worker
  }
  return null
}

/**
 * Masraf raporu başlıkları (durum, rapor tarihi, açıklama…) — no. → satır, 20'lik `or`
 * öbekleri. Düşen öbek ötekileri götürmez: `partial` (o raporların durumu bilinmiyor).
 */
async function expenseHeaders(auth, numbers) {
  const headers = {}
  let partial = false
  const read = (part) =>
    listSafe(
      auth,
      "mserp_tryaiemployeexpenseentities",
      { $filter: anyOf("mserp_expnumber", part) },
      { $select: HEADER_BASE },
    ).catch((err) => {
      if (err?.kind === "denied") throw err
      partial = true
      return []
    })
  const parts = chunks(numbers)
  for (let i = 0; i < parts.length; i += HEADER_PARALLEL) {
    const pages = await Promise.all(parts.slice(i, i + HEADER_PARALLEL).map(read))
    for (const rows of pages)
      for (const r of rows) if (r.mserp_expnumber) headers[r.mserp_expnumber] = r
  }
  return { headers, partial }
}

/**
 * Sınıra varılmış masraf satırlarından son (en eski) raporu atar: satırları sınırda bölünmüş
 * olabilir, yarım rapor yanlış toplam gösterirdi. Tek rapor kaldıysa dokunmaz.
 */
export function dropPartialReport(rows) {
  const last = rows.at(-1)?.mserp_expnumber
  const rest = rows.filter((r) => r.mserp_expnumber !== last)
  return rest.length ? rest : rows
}

/**
 * İzinlerin iş akışı sonucu (`Map(kayıt no → sonuç)`); düşen öbek yok sayılır. Ekibim de kullanır
 * (`selfServiceTeamApi.js`).
 */
export async function leaveFlows(auth, recIds) {
  const queries = flowQueries(recIds)
  const rows = []
  for (let i = 0; i < queries.length; i += HEADER_PARALLEL) {
    const pages = await Promise.all(
      queries
        .slice(i, i + HEADER_PARALLEL)
        .map((q) => list(auth, q.entity, q.params).catch(() => [])),
    )
    rows.push(...pages.flat())
  }
  return flowOutcomes(rows)
}

// Sayfanın ana bölümleri: hepsi yetkisizse kısmi sayfa yerine "erişilemiyor".
const MAIN = ["balance", "leaves", "expenses", "advances"]

/**
 * Bütün Self Servis verisi. Personel numarası bulunamazsa `{ worker: null }` (ERP'de kayıt yok).
 * Bir bölüm düşerse öteki bölümler yine gelir: bölüm `null`, `failed` listesinde adı
 * (`expenseStatus`: raporların bir kısmının ya da hepsinin durumu okunamadı). Geçmişi
 * `HISTORY_TOP` sınırına varan bölüm `truncated` listesinde.
 *
 * Yetki de bölüm bölüm: rolde tek tablonun okuma yetkisi eksikse (ör. yalnız avans) öteki
 * bölümler görünür, o bölümün kodu `denied[ad]`da (ekranda BT'ye iletilecek kod). Ana dört
 * bölümün hiçbiri okunamıyorsa bütün sayfa "erişilemiyor" (ilk yetki hatası fırlatılır).
 */
export async function fetchSelfService(account, { interactive = false } = {}) {
  const auth = await token(interactive)
  const worker = await findWorker(auth, aliasesOf(account))
  if (!worker) return { worker: null }
  const pn = quote(worker.personnel)
  const failed = []
  const truncated = []
  const denied = {}
  // Düşen her bölümün kodu (yetki dışı hatalar da): ekranda nedeni yazılsın (`StateDetail`).
  const errors = {}
  let firstDenied = null
  const guard = (name, p) =>
    p.catch((err) => {
      if (err?.kind === "denied") {
        denied[name] = err.message
        firstDenied ??= err
      }
      errors[name] = err?.message || "unknown"
      failed.push(name)
      return null
    })
  const history = (a, entity, params) => listAll(a, entity, params, HISTORY_TOP)
  const rowsOf = (name, res) => {
    if (res?.more) truncated.push(name)
    return res ? res.rows : null
  }

  const [balance, leavePage, expensePage, advancePage] = await Promise.all([
    guard(
      "balance",
      list(auth, "mserp_tryaiallowancesummaryentities", {
        $filter: `mserp_networkalias eq ${quote(worker.alias)}`,
        $top: 1,
      }),
    ),
    guard(
      "leaves",
      history(auth, "mserp_boraxallowancetransselfserviceentities", {
        $filter: `mserp_boraxoldemplid eq ${pn}`,
        $orderby: "mserp_startdate desc",
      }),
    ),
    guard(
      "expenses",
      history(auth, "mserp_tryaiemployeexpensetransentities", {
        $filter: `mserp_employenumber eq ${pn}`,
        $orderby: "mserp_expnumber desc",
      }),
    ),
    guard(
      "advances",
      listSafe(
        auth,
        "mserp_trvcashadvanceentities",
        {
          $filter: `mserp_requestingworkerpersonnelnumber eq ${pn}`,
          $orderby: "mserp_cashadvancenumber desc",
        },
        { $select: ADVANCE_BASE },
        history,
      ),
    ),
  ])
  if (firstDenied && MAIN.every((name) => failed.includes(name))) throw firstDenied
  const leaves = rowsOf("leaves", leavePage)
  const advances = rowsOf("advances", advancePage)
  let expenseRows = rowsOf("expenses", expensePage)
  if (expensePage?.more) expenseRows = dropPartialReport(expenseRows)

  const numbers = [...new Set((expenseRows ?? []).map((r) => r.mserp_expnumber).filter(Boolean))]
  // Masraf durumları ile izinlerin iş akışı sonucu aynı anda; akış okunamazsa durum alanı kalır.
  const recOf = (r) => recIdOf(r.mserp_boraxallowancetransselfserviceentityid)
  const [status, flows] = await Promise.all([
    numbers.length ? guard("expenseStatus", expenseHeaders(auth, numbers)) : { headers: {} },
    leaveFlows(auth, (leaves ?? []).filter(needsFlow).map(recOf)),
  ])
  if (status?.partial) failed.push("expenseStatus")

  // Tutarsız izin (ör. tek güne 50 gün) hesaba katılmaz; köşedeki uyarıda gösterilir.
  const leaveSplit = leaves
    ? splitLeaves(leaves.map((r) => toLeave(r, flows.get(recOf(r)) ?? null)))
    : null
  return {
    worker,
    balance: balance ? toBalance(balance[0]) : null,
    leaves: leaveSplit ? leaveSplit.ok : null,
    suspect: { leaves: leaveSplit?.suspect ?? [] },
    expenses: expenseRows ? toExpenses(expenseRows, status?.headers ?? {}) : null,
    advances: advances ? advances.map(toAdvance) : null,
    failed,
    truncated,
    denied,
    errors,
  }
}

/**
 * İZİN ÖZETİ — Anasayfa'nın "İzin bakiyem" kartının HAFİF okuması: çalışan + bakiye + bugün ya da
 * sonra biten izinler (+ durumu "None" kalanların iş akışı sonucu). Masraf, avans ve geçmiş
 * okunmaz: kartın sorusu "kalan, onayda, sıradaki" — tam okumanın (`fetchSelfService`) yarısından
 * az istek. Dönüş onun biçiminde (`expenses`/`advances` yok); bölüm düşerse `null` + `failed`.
 */
export async function fetchLeaveSummary(account, { interactive = false, now = new Date() } = {}) {
  const auth = await token(interactive)
  const worker = await findWorker(auth, aliasesOf(account))
  if (!worker) return { worker: null }
  const failed = []
  let firstDenied = null
  const guard = (name, p) =>
    p.catch((err) => {
      if (err?.kind === "denied") firstDenied ??= err
      failed.push(name)
      return null
    })
  const pn = quote(worker.personnel)
  const from = ymd(now)
  const [balance, leaveRows] = await Promise.all([
    guard(
      "balance",
      list(auth, "mserp_tryaiallowancesummaryentities", {
        $filter: `mserp_networkalias eq ${quote(worker.alias)}`,
        $top: 1,
      }),
    ),
    // Tarih süzgeci tarih-saat değeriyle; kolon salt tarihse yedek (Ekibim'in sorgusuyla aynı).
    guard(
      "leaves",
      listSafe(
        auth,
        "mserp_boraxallowancetransselfserviceentities",
        {
          $filter: `mserp_boraxoldemplid eq ${pn} and mserp_enddate ge ${from}T00:00:00Z`,
          $orderby: "mserp_startdate asc",
        },
        { $filter: `mserp_boraxoldemplid eq ${pn} and mserp_enddate ge ${from}` },
      ),
    ),
  ])
  if (firstDenied && failed.length === 2) throw firstDenied
  const recOf = (r) => recIdOf(r.mserp_boraxallowancetransselfserviceentityid)
  const flows = leaveRows ? await leaveFlows(auth, leaveRows.filter(needsFlow).map(recOf)) : null
  const split = leaveRows
    ? splitLeaves(leaveRows.map((r) => toLeave(r, flows?.get(recOf(r)) ?? null)))
    : null
  return {
    worker,
    balance: balance ? toBalance(balance[0]) : null,
    leaves: split ? split.ok : null,
    failed,
  }
}

/**
 * Kişinin istihdam satırları → `{ start, company, count }` ya da null (`toEmployment`). Profil
 * başlığının hizmet süresi için YALNIZ Graph'ta işe giriş tarihi boşsa sorulur; yetki yoksa
 * (`denied`) başlık süreyi göstermez.
 */
export async function fetchEmployment(personnel) {
  const auth = await token(false)
  const rows = await list(auth, "mserp_hcmemploymententities", {
    $select: EMPLOYMENT_SELECT,
    $filter: `mserp_personnelnumber eq ${quote(personnel)}`,
    $orderby: "mserp_employmentstartdate asc",
  })
  return toEmployment(rows)
}
