import { htmlDataUrl, htmlOf, isPrintableHtml } from "@/lib/botFiles"
import { companyLabel, displayCompanyName } from "@/lib/companyName"
import { rejectedSelect } from "@/lib/directReports"
import {
  expenseFormUpn,
  fillExpenseForm,
  formPersonFromGraph,
  isFillableExpenseForm,
} from "@/lib/expenseFormFill"
import { graphGet, STATUS } from "@/lib/graph"
import { fetchHrCompany } from "@/hooks/useHrCompany"
import { hireDayOf } from "@/lib/selfServiceProfile"
import {
  fillLeaveForm,
  isFillableLeaveForm,
  leaveFormUpn,
  leaveFormValue,
} from "@/lib/leaveFormFill"
import { msalInstance } from "@/lib/msal"
import { fetchPerson, PERSON } from "@/lib/personDirectory"

/**
 * Sohbete gelen formları (HR MCP) Self Servis'in bilgileriyle tamamlar: izin formu
 * (`leaveFormFill`) ve masraf formu (`expenseFormFill`).
 *
 * İZİN FORMU (bkz. leaveFormFill).
 * AD · SİCİL · İŞE GİRİŞ Graph'tan (`displayName` · `employeeId` · `employeeHireDate`; Self Servis
 * profil başlığının kaynağı, `buildProfile`): Graph'ta boş olan ERP'den kalır.
 * ŞİRKET İK görünümünden (`useHrCompany`: formdaki kişinin ERP numarası, yoksa maili), sonra
 * Graph'tan; her durumda KISA adıyla (ünvan uzantısı yok). Bölüm ve
 * pozisyon Graph'tan, kişi kartının kullandığı yoldan (`personDirectory`: `User.Read.All` sessiz,
 * olmazsa temel okuma — temel okumada bu alanlar yok ve ERP değeri kalır).
 *
 * Hiçbir durumda formu düşürmez: aramalar düşerse ya da `LOOKUP_MS`i aşarsa ERP'nin değerleri
 * kalır (şirket yine kısaltılır).
 */
const LOOKUP_MS = 3000

const timeout = (ms) => new Promise((resolve) => setTimeout(() => resolve(null), ms))

const activeAccount = () =>
  msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null

/**
 * MASRAF FORMU: kişi ve Entra yöneticisi tek Graph isteğinde — Self Servis'in kaynağı (profil
 * Graph'tan, yönetici `/me/manager`; burada form başkasınınki olabildiği için `/users/{upn}`).
 * `User.Read.All` sessiz (yeni izin yok); genişletilmiş seçim reddedilirse temel seçimle bir kez
 * daha. Sorulamazsa null: ERP'nin değerleri kalır.
 */
const PEOPLE_SELECT = "displayName,jobTitle,department,employeeId"
const PEOPLE_SELECT_BASIC = "displayName,jobTitle,department"
const peoplePath = (upn, select) =>
  `/users/${encodeURIComponent(upn)}?$select=${select}` +
  `&$expand=manager($select=${select},mail,userPrincipalName)`

async function fetchFormPeople(account, upn) {
  const get = (select) =>
    graphGet(msalInstance, account, { path: peoplePath(upn, select), scopes: ["User.Read.All"] })
  let res = await get(PEOPLE_SELECT)
  if (rejectedSelect(res)) res = await get(PEOPLE_SELECT_BASIC)
  if (res.status !== STATUS.ready) return null
  return {
    employee: formPersonFromGraph(res.data),
    manager: formPersonFromGraph(res.data?.manager),
    noManager: !res.data?.manager,
  }
}

/**
 * İzin formunun kişisi: ad, sicil, işe giriş — Self Servis profilinin Graph alanları. Genişletilmiş
 * seçim reddedilirse (işe giriş alanı) yalnız ad ve sicil. Sorulamazsa null: ERP'nin değerleri kalır.
 */
const IDENTITY_SELECT = "displayName,employeeId,employeeHireDate"
// Formun tarih biçimi (`formShell.js` › `formDate`, ERP'ninki): `2.03.2026` — gün sıfırsız, ay sıfırlı.
const formDay = (d) =>
  d ? `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}` : ""
const IDENTITY_SELECT_BASIC = "displayName,employeeId"

async function fetchFormIdentity(account, upn) {
  const get = (select) =>
    graphGet(msalInstance, account, {
      path: `/users/${encodeURIComponent(upn)}?$select=${select}`,
      scopes: ["User.Read.All"],
    })
  let res = await get(IDENTITY_SELECT)
  if (rejectedSelect(res)) res = await get(IDENTITY_SELECT_BASIC)
  if (res.status !== STATUS.ready) return null
  const u = res.data ?? {}
  return {
    name: String(u.displayName ?? "").trim(),
    personnel: String(u.employeeId ?? "").trim(),
    hire: formDay(hireDayOf(u.employeeHireDate)),
  }
}

async function enrichExpenseForm(att, html) {
  const account = activeAccount()
  const upn = expenseFormUpn(html)
  if (!account || !upn) return att
  const people = await Promise.race([
    fetchFormPeople(account, upn).catch(() => null),
    timeout(LOOKUP_MS),
  ])
  if (!people) return att
  const filled = fillExpenseForm(html, people)
  return filled === html ? att : { ...att, contentUrl: htmlDataUrl(filled) }
}

/** @returns {Promise<object>} aynı ek (değişiklik yoksa) ya da tamamlanmış kopyası */
export async function enrichToolDocument(att) {
  if (!isPrintableHtml(att)) return att
  const html = htmlOf(att)
  if (isFillableExpenseForm(html)) return enrichExpenseForm(att, html)
  if (!isFillableLeaveForm(html)) return att
  const account = activeAccount()
  const upn = leaveFormUpn(html)
  let profile = null
  let hr = null
  let identity = null
  if (account && upn) {
    // Üç arama paralel, ortak süre sınırıyla: biri geç kalırsa ötekilerin cevabı kaybolmasın.
    const deadline = timeout(LOOKUP_MS)
    const [res, company, who] = await Promise.all([
      Promise.race([
        fetchPerson(msalInstance, account, { address: upn }).catch(() => null),
        deadline,
      ]),
      Promise.race([
        fetchHrCompany({ addresses: [upn], resolve: true }).catch(() => null),
        deadline,
      ]),
      Promise.race([fetchFormIdentity(account, upn).catch(() => null), deadline]),
    ])
    if (res?.status === PERSON.ready) profile = res.profile
    hr = company
    identity = who
  }
  const company = hr
    ? companyLabel(hr.code, hr.name)
    : displayCompanyName(profile?.company || leaveFormValue(html, "company"))
  const filled = fillLeaveForm(html, {
    name: identity?.name ?? "",
    personnel: identity?.personnel ?? "",
    hire: identity?.hire ?? "",
    company,
    department: profile?.department ?? "",
    position: profile?.title ?? "",
  })
  return filled === html ? att : { ...att, contentUrl: htmlDataUrl(filled) }
}
