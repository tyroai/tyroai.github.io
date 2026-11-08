// Uygulama kataloğu (Dataverse `tyro_launcherapps` karşılığı): asistanlar, AI uygulamaları, iş
// uygulamaları. Asistanlar her sette aynı iki tanedir (+ sektör eklemeleri); uygulamalar sektöre göre gelir.
import { PERSONA } from "./persona.js"

export const TYPE = { agent: 100000000, ai: 100000001, business: 100000002 }

const BASE_AGENTS = [
  {
    name: "tyroOffice",
    type: "agent",
    description: "İzin, masraf, takvim ve günlük işlerin için kurumsal asistan.",
    agentId: "crfc1_tyroOffice",
    icon: "Robot01Icon",
  },
  {
    name: "tyroSales",
    type: "agent",
    description: "Satış hedefi, fırsat ve müşteri sorularını yanıtlar.",
    agentId: "crfc1_tyroSales",
    icon: "Target02Icon",
  },
]

const BASE_BUSINESS = [
  { name: "Outlook", type: "business", description: "Posta ve takvim", url: "https://outlook.office.com", icon: "Office365Icon" },
  { name: "Teams", type: "business", description: "Toplantı ve sohbet", url: "https://teams.microsoft.com", icon: "Office365Icon" },
]

/** Veri setinin kataloğu: sabit asistanlar + sektör asistanları/uygulamaları + ortak iş uygulamaları. */
export function buildCatalog(dataset) {
  const agents = [...BASE_AGENTS]
  if (dataset.salesAgentDescription) agents[1] = { ...agents[1], description: dataset.salesAgentDescription }
  return [...agents, ...(dataset.agents ?? []), ...(dataset.apps ?? []), ...BASE_BUSINESS]
}

const guidFor = (i) => `c0a7a100-5e2b-4c3d-8f10-${String(2000 + i).padStart(12, "0")}`

export function catalogRows(dataset) {
  return buildCatalog(dataset).map((c, i) => ({
    tyro_launcherappid: guidFor(i),
    tyro_name: c.name,
    tyro_type: TYPE[c.type],
    tyro_description: c.description,
    tyro_url: c.url ?? "#",
    tyro_tenantid: "",
    tyro_clientid: "",
    tyro_agentid: c.agentId ?? "",
    tyro_iconname: c.icon,
    tyro_sortorder: i + 1,
    tyro_isactive: true,
  }))
}

/** Kendi yetki satırım: yönetici değil; asistan ve AI uygulamalarının hepsine erişim var. */
export function authorizedRow(dataset) {
  const apps = buildCatalog(dataset)
    .filter((c) => c.type !== "business")
    .map((c) => c.name)
    .join(";")
  return {
    tyro_authorizedappid: "c0a7a100-5e2b-4c3d-8f10-000000009001",
    tyro_useremail: PERSONA.userPrincipalName,
    tyro_apps: apps,
    tyro_isadmin: false,
  }
}
