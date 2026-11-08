// tyroRM kapısı (fail-closed). Görme: düzenleyici ∨ uygulama yöneticisi ∨ Güvenlik › Yetkiler'de
// "tyroRM". Düzenleme: IT'nin Entra grubu (varsayılan uygulama yöneticisi grubu). Cevap gelene
// dek "pending": hiçbir şey çizilmez; soru sorulamadıysa "unknown" (bu bir ret değildir).
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { catalogNameKey } from "@/lib/agentName"

export const RM_APP = "tyroRM"
export const RM_EDITOR_GROUP_ID = import.meta.env.VITE_RM_EDITOR_GROUP_ID || ADMIN_GROUP_ID
const DEV_KEY = "tyro-dev-rm"

/**
 * @param {{ editor: boolean|"unknown"|undefined, appAdmin: boolean|"unknown"|undefined,
 *   authState: "anonymous"|"pending"|"unknown"|"ready", apps: string[] }} who
 * @returns {{ state: "pending"|"granted"|"denied"|"unknown", edit: boolean }}
 */
export function rmAccessFor({ editor, appAdmin, authState, apps = [] }) {
  if (editor === true) return { state: "granted", edit: true }
  if (appAdmin === true) return { state: "granted", edit: false }
  const key = catalogNameKey(RM_APP)
  if (authState === "ready" && apps.some((a) => catalogNameKey(a) === key)) {
    return { state: "granted", edit: false }
  }
  if (editor === undefined || appAdmin === undefined || authState === "pending") {
    return { state: "pending", edit: false }
  }
  if (editor === "unknown" || appAdmin === "unknown" || authState === "unknown") {
    return { state: "unknown", edit: false }
  }
  return { state: "denied", edit: false }
}

/** Yalnız geliştirmede: `?devrm=edit|view|none` MSAL'sız gezide rolü seçer (`?devauth=1` ile). */
export function readDevRmRole() {
  if (!import.meta.env.DEV || typeof window === "undefined") return null
  const param = new URLSearchParams(window.location.search).get("devrm")
  if (param) window.sessionStorage.setItem(DEV_KEY, param)
  const v = window.sessionStorage.getItem(DEV_KEY)
  return ["edit", "view", "none"].includes(v) ? v : null
}
