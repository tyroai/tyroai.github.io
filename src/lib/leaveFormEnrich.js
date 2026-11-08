import { htmlDataUrl, htmlOf, isPrintableHtml } from "@/lib/botFiles"
import { companyLabel, displayCompanyName } from "@/lib/companyName"
import { fetchHrCompany } from "@/hooks/useHrCompany"
import {
  fillLeaveForm,
  isFillableLeaveForm,
  leaveFormUpn,
  leaveFormValue,
} from "@/lib/leaveFormFill"
import { msalInstance } from "@/lib/msal"
import { fetchPerson, PERSON } from "@/lib/personDirectory"

/**
 * Sohbete gelen izin formunu (HR MCP) Self Servis'in bilgileriyle tamamlar (bkz. leaveFormFill).
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

/** @returns {Promise<object>} aynı ek (değişiklik yoksa) ya da tamamlanmış kopyası */
export async function enrichToolDocument(att) {
  if (!isPrintableHtml(att)) return att
  const html = htmlOf(att)
  if (!isFillableLeaveForm(html)) return att
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null
  const upn = leaveFormUpn(html)
  let profile = null
  let hr = null
  if (account && upn) {
    // İki arama paralel, ortak süre sınırıyla: biri geç kalırsa ötekinin cevabı kaybolmasın.
    const deadline = timeout(LOOKUP_MS)
    const [res, company] = await Promise.all([
      Promise.race([
        fetchPerson(msalInstance, account, { address: upn }).catch(() => null),
        deadline,
      ]),
      Promise.race([
        fetchHrCompany({ addresses: [upn], resolve: true }).catch(() => null),
        deadline,
      ]),
    ])
    if (res?.status === PERSON.ready) profile = res.profile
    hr = company
  }
  const company = hr
    ? companyLabel(hr.code, hr.name)
    : displayCompanyName(profile?.company || leaveFormValue(html, "company"))
  const filled = fillLeaveForm(html, {
    company,
    department: profile?.department ?? "",
    position: profile?.title ?? "",
  })
  return filled === html ? att : { ...att, contentUrl: htmlDataUrl(filled) }
}
