import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"

/**
 * Temsilci atamasının TYRO'ya giden cümlesi (`DELEGATE.mode = "chat"`). Atamayı İK asistanı yapar
 * (HR MCP `create_delegation`, önizleme + onay kodu); cümle ona gereken üç bilgiyi taşır —
 * temsilcinin giriş adresi (F&O kullanıcısı adresin @'ten önceki kısmı) ve iki tarih. Tarih her
 * dilde `dd.MM.yyyy`: asistan onu ERP'ye aynen geçirir, `04/25` ile `25/04` ayrımına bırakılmaz.
 */

// Vekalet sorusu birincil asistana (İK araçları onda; ayrı bir İK asistanı yok).
export const HR_AGENT = "tyroOffice"

const pad = (n) => String(n).padStart(2, "0")

/** `Date` → `dd.MM.yyyy`. */
export const delegateDate = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`

/** Temsilcinin okunur adı: ad varsa "Ad (adres)", yoksa yalnız adres. */
function who(person) {
  const address = person.address.trim()
  const name = (person.name || "").trim()
  return name && name.toLowerCase() !== address.toLowerCase() ? `${name} (${address})` : address
}

/** Sohbete gidecek soru: `selfService.erp.delegate.ask` kalıbı, değerler doldurulmuş. */
export function delegateQuestion(t, { person, start, end }) {
  return t("selfService.erp.delegate.ask", {
    who: who(person),
    start: delegateDate(start),
    end: delegateDate(end),
  })
}

/**
 * Planı İK asistanına park eder ve sohbeti açar. Fareli cihazda imleç besteciye geçer (cevap orada
 * yazılır); dokunmatikte klavye kendiliğinden açılmasın. `plan`: `delegatePlan`ın çıktısı.
 */
export function askDelegate(t, plan) {
  setPendingAsk({ question: delegateQuestion(t, plan), agent: HR_AGENT })
  requestOpenChat({ focusComposer: Boolean(window.matchMedia?.("(pointer: fine)").matches) })
}
