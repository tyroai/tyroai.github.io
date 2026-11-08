// Sahte Power Automate / flow uçları: Tibot (BT destek talepleri, Xurrent akışı).
// Kişinin açtığı birkaç kurgusal BT talebi döner; her veri setinde aynıdır.
import { PERSONA } from "../persona.js"
import { HOUR, DAY } from "../time.js"
import { json, logUnhandled, parseBody } from "./util.js"

const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString()
const me = { id: "90001", name: PERSONA.displayName }
const team = { id: "t-destek", name: "BT Destek" }
const tech = (n) => ({ id: `m-${n}`, name: n })

function tickets() {
  const base = (over) => ({
    category: "Talep",
    impact: "low",
    requestedBy: me,
    requestedFor: me,
    team,
    member: tech("Cem Sönmez"),
    completedAt: null,
    nextTargetAt: null,
    resolutionTargetAt: null,
    serviceInstance: { name: "Bilgisayar ve Çevre Birimleri", service: { name: "BT Donanım" } },
    ...over,
  })
  return [
    base({
      requestId: "48213",
      subject: "VPN bağlantısı yurt dışında kopuyor",
      status: "in_progress",
      category: "Olay",
      impact: "medium",
      createdAt: iso(2 * DAY + 3 * HOUR),
      updatedAt: iso(5 * HOUR),
      nextTargetAt: new Date(Date.now() + 6 * HOUR).toISOString(),
      resolutionTargetAt: new Date(Date.now() + 2 * DAY).toISOString(),
      serviceInstance: { name: "Uzaktan Erişim", service: { name: "Ağ Hizmetleri" } },
    }),
    base({
      requestId: "48177",
      subject: "Yeni dizüstü bilgisayar talebi (ekip üyesi için)",
      status: "waiting_for_customer",
      createdAt: iso(6 * DAY),
      updatedAt: iso(1 * DAY),
      member: tech("Elvan Gür"),
    }),
    base({
      requestId: "48240",
      subject: "CRM raporlarında yetki hatası",
      status: "assigned",
      category: "Olay",
      impact: "medium",
      createdAt: iso(3 * HOUR),
      updatedAt: iso(3 * HOUR),
      member: null,
      serviceInstance: { name: "CRM", service: { name: "İş Uygulamaları" } },
    }),
    base({
      requestId: "48102",
      subject: "Toplantı odası ekranı çalışmıyor (Maslak 2. kat)",
      status: "completed",
      createdAt: iso(11 * DAY),
      updatedAt: iso(8 * DAY),
      completedAt: iso(8 * DAY),
      serviceInstance: { name: "Toplantı Odaları", service: { name: "Ofis Teknolojileri" } },
    }),
    base({
      requestId: "47990",
      subject: "E-posta imzası şablonu güncellemesi",
      status: "completed",
      createdAt: iso(19 * DAY),
      updatedAt: iso(15 * DAY),
      completedAt: iso(15 * DAY),
      member: tech("Elvan Gür"),
      serviceInstance: { name: "E-posta", service: { name: "İş Birliği Araçları" } },
    }),
  ]
}

const bucket = (nodes) => ({ totalCount: nodes.length, nodes, pageInfo: { hasNextPage: false, endCursor: null } })

function notesFor(id) {
  return [
    { id: `${id}-n1`, text: "Talebiniz alındı, ilgili ekibe yönlendirildi.", createdAt: iso(2 * DAY), internal: false, person: { name: "Cem Sönmez" } },
    { id: `${id}-n2`, text: "Ek bilgi için size ulaşacağız; mümkünse ekran görüntüsü paylaşabilir misiniz?", createdAt: iso(1 * DAY), internal: false, person: { name: "Cem Sönmez" } },
  ]
}

export async function handleFlows({ url, method, body }) {
  if (method === "POST" && /\/powerautomate\//.test(url.pathname)) {
    const req = parseBody(body) ?? {}
    const all = tickets()
    if (req.op === "list") {
      return json({ person: { id: 90001, name: me.name }, teams: [team.name], by: bucket(all), for: bucket([]), assigned: bucket([]), team: bucket([]) })
    }
    if (req.op === "more") return json({ page: null })
    if (req.op === "detail") {
      const request = all.find((t) => t.requestId === String(req.id))
      return request ? json({ staff: false, request, notes: notesFor(request.requestId) }) : json({ error: { code: "NotFound" } }, 404)
    }
    if (req.op === "year") return json({ closed: 7, assigned: 0, opened: 9, openedClosed: 7 })
  }
  logUnhandled("Flow", method, url)
  return json({})
}
