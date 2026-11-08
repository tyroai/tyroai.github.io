// window.fetch'i araya girerek Microsoft Graph, Dataverse ve flow çağrılarını tarayıcıda
// veri setinden yanıtlar. Kaynak uygulama koduna dokunulmaz: o gerçek bir backend'e konuşuyor sanır.
import { handleGraph } from "./graph.js"
import { handleDataverse } from "./dataverse.js"
import { handleFlows } from "./flows.js"
import { handleExternal } from "./external.js"
import { json } from "./util.js"

const isGraph = (u) => u.hostname === "graph.microsoft.com"
const isDataverse = (u) => /\.crm\d*\.dynamics\.com$/.test(u.hostname) && u.hostname !== "globaldisco.crm.dynamics.com"
const isErp = (u) => /\.operations\.dynamics\.com$/.test(u.hostname)
const isFlow = (u) =>
  /(^|\.)logic\.azure\.com$|(^|\.)flow\.microsoft\.com$|(^|\.)powerplatform\.com$|(^|\.)azure-apim\.net$/.test(u.hostname)
const isLogin = (u) => u.hostname === "login.microsoftonline.com"

export function installMocks(dataset) {
  const realFetch = window.fetch.bind(window)
  const ctx = { dataset, realFetch }

  window.fetch = async function demoFetch(input, init) {
    let url
    let method = "GET"
    let headers
    let body = init?.body ?? null
    if (typeof Request !== "undefined" && input instanceof Request) {
      url = new URL(input.url)
      method = (init?.method ?? input.method).toUpperCase()
      headers = new Headers(init?.headers ?? input.headers)
    } else {
      url = new URL(String(input), window.location.href)
      method = (init?.method ?? "GET").toUpperCase()
      headers = new Headers(init?.headers)
    }
    const req = { url, method, headers, body, ctx }

    try {
      let res = null
      if (isGraph(url)) res = await handleGraph(req)
      else if (isDataverse(url) || isErp(url)) res = await handleDataverse(req)
      else if (isFlow(url)) res = await handleFlows(req)
      else if (isLogin(url)) res = json({})
      else res = await handleExternal(req)
      if (res) return res
    } catch (err) {
      console.warn("[demo] sahte yanıt hatası:", url.href, err)
      return json({ error: { code: "demoMockError", message: String(err?.message ?? err) } }, 500)
    }
    return realFetch(input, init)
  }
}
