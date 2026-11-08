// Sahte Power Automate / flow uçları: Ticket (eski adıyla Tibot; BT destek talepleri, Xurrent akışı).
// Dört kova da dolu: açtıklarım, adıma açılanlar, bana atananlar (yönetici onayları, bazıları gecikmiş)
// ve ekibim. Her veri setinde aynıdır.
import { PERSONA } from "../persona.js"
import { HOUR, DAY } from "../time.js"
import { json, logUnhandled, parseBody } from "./util.js"

const ago = (ms) => new Date(Date.now() - ms).toISOString()
const ahead = (ms) => new Date(Date.now() + ms).toISOString()
const person = (id, name) => ({ id: String(id), name })

const ME = person(90001, PERSONA.displayName)
const IT = {
  cem: person("m-cem", "Cem Sönmez"),
  elvan: person("m-elvan", "Elvan Gür"),
  tolga: person("m-tolga", "Tolga Ergin"),
  gokhan: person("m-gokhan", "Gökhan Yurt"),
}
const REQ = {
  me: ME,
  zeynep: person("r-zeynep", "Zeynep Acar"),
  kaan: person("r-kaan", "Kaan Özdemir"),
  derya: person("r-derya", "Derya Çelik"),
  onur: person("r-onur", "Onur Polat"),
  gizem: person("r-gizem", "Gizem Tunç"),
  ayse: person("r-ayse", "Ayşe Demir"),
  selin: person("r-selin", "Selin Aydın"),
  can: person("r-can", "Can Yıldız"),
}
const TEAM_IT = { id: "t-destek", name: "BT Destek" }
const TEAM_OPS = { id: "t-uygulama", name: "İş Uygulamaları" }
const SVC = {
  donanim: { name: "Bilgisayar ve Çevre Birimleri", service: { name: "BT Donanım" } },
  vpn: { name: "Uzaktan Erişim", service: { name: "Ağ Hizmetleri" } },
  crm: { name: "CRM", service: { name: "İş Uygulamaları" } },
  mail: { name: "E-posta", service: { name: "İş Birliği Araçları" } },
  oda: { name: "Toplantı Odaları", service: { name: "Ofis Teknolojileri" } },
  lisans: { name: "Yazılım Lisansları", service: { name: "BT Donanım" } },
  mobil: { name: "Mobil Cihazlar", service: { name: "BT Donanım" } },
  erisim: { name: "Erişim Yönetimi", service: { name: "Güvenlik" } },
}

/** Tek talep satırı. `c`/`u`: kaç gün/saat önce açıldı/güncellendi; `target`: sonraki hedefe kalan (negatif = geçmiş). */
function row(id, subject, status, o = {}) {
  const created = ago(o.c ?? 3 * DAY)
  const updated = ago(o.u ?? 6 * HOUR)
  const closed = status === "completed" || status === "declined"
  return {
    requestId: String(id),
    subject,
    status,
    category: o.category ?? "Talep",
    impact: o.impact ?? "low",
    createdAt: created,
    updatedAt: updated,
    nextTargetAt: !closed && o.target != null ? new Date(Date.now() + o.target).toISOString() : null,
    resolutionTargetAt: !closed && o.resolve != null ? new Date(Date.now() + o.resolve).toISOString() : null,
    completedAt: closed ? updated : null,
    team: o.team ?? TEAM_IT,
    member: o.member ?? null,
    requestedBy: o.by ?? ME,
    requestedFor: o.for ?? o.by ?? ME,
    serviceInstance: o.svc ?? SVC.donanim,
  }
}

function build() {
  // ───── Tarafımdan açılanlar (by) ─────
  const by = [
    row(48213, "VPN bağlantısı yurt dışında kopuyor", "in_progress", { category: "Olay", impact: "medium", c: 2 * DAY + 3 * HOUR, u: 5 * HOUR, target: 6 * HOUR, resolve: 2 * DAY, member: IT.cem, svc: SVC.vpn }),
    row(48177, "Yeni dizüstü bilgisayar talebi (ekip üyesi için)", "waiting_for_customer", { c: 6 * DAY, u: 1 * DAY, member: IT.elvan }),
    row(48240, "CRM raporlarında yetki hatası", "assigned", { category: "Olay", impact: "medium", c: 3 * HOUR, u: 3 * HOUR, target: 8 * HOUR, svc: SVC.crm, team: TEAM_OPS }),
    row(48255, "Müşteri sunumları için ek ekran talebi", "in_progress", { c: 2 * DAY, u: 8 * HOUR, target: 1 * DAY, member: IT.tolga }),
    row(48261, "Tablet cihaz yönetimi (MDM) kaydı yenileme", "assigned", { c: 1 * DAY, u: 1 * DAY, target: 2 * DAY, svc: SVC.mobil }),
    row(48102, "Toplantı odası ekranı çalışmıyor (Maslak 2. kat)", "completed", { c: 11 * DAY, u: 8 * DAY, member: IT.cem, svc: SVC.oda }),
    row(48029, "Teams toplantı kayıtlarına erişim", "completed", { c: 16 * DAY, u: 13 * DAY, member: IT.elvan, svc: SVC.mail }),
    row(47990, "E-posta imzası şablonu güncellemesi", "completed", { c: 19 * DAY, u: 15 * DAY, member: IT.elvan, svc: SVC.mail }),
    row(47955, "Yazıcı sürücüsü kurulumu (Maslak 3. kat)", "completed", { c: 24 * DAY, u: 21 * DAY, member: IT.gokhan, svc: SVC.donanim }),
    row(47890, "Eski dizüstü bilgisayarın iadesi ve veri silme", "completed", { c: 33 * DAY, u: 29 * DAY, member: IT.tolga }),
  ]
  // ───── Adıma açılanlar (for) ─────
  const forMe = [
    row(48270, "Ömer Gümüş için yeni mobil hat ve cihaz", "in_progress", { c: 2 * DAY, u: 4 * HOUR, target: 1 * DAY, by: REQ.ayse, for: ME, member: IT.gokhan, svc: SVC.mobil }),
    row(48231, "Ömer Gümüş adına yazılım lisansı yenilemesi", "waiting_for_customer", { c: 5 * DAY, u: 1 * DAY, by: REQ.can, for: ME, member: IT.tolga, svc: SVC.lisans }),
    row(48190, "Üç aylık erişim yetkisi gözden geçirme", "completed", { c: 12 * DAY, u: 9 * DAY, by: REQ.selin, for: ME, member: IT.elvan, svc: SVC.erisim }),
  ]
  // ───── Bana atananlar (yönetici onayları; ikisi gecikmiş) ─────
  const assigned = [
    row(48281, "Satış ekibi için ek CRM lisansı onayı", "assigned", { c: 5 * HOUR, u: 5 * HOUR, target: 4 * HOUR, by: REQ.zeynep, member: ME, svc: SVC.lisans, team: TEAM_OPS }),
    row(48274, "Müşteri verisi dışa aktarma izni (teklif analizi)", "in_progress", { category: "Olay", impact: "medium", c: 2 * DAY, u: 7 * HOUR, target: -5 * HOUR, by: REQ.derya, member: ME, svc: SVC.crm, team: TEAM_OPS }),
    row(48266, "Yeni çalışan (Onur Polat) donanım paketi onayı", "assigned", { c: 3 * DAY, u: 2 * DAY, target: -1 * DAY, by: REQ.onur, member: ME }),
    row(48250, "Bölge ziyareti için araç tahsisi onayı", "accepted", { c: 1 * DAY, u: 3 * HOUR, target: 2 * DAY, by: REQ.kaan, member: ME }),
    row(48244, "Fiyat listesi paylaşım yetkisi (iş ortakları)", "in_progress", { c: 4 * DAY, u: 1 * DAY, target: 3 * DAY, by: REQ.gizem, member: ME, svc: SVC.erisim }),
    row(48236, "Test ortamı erişim talebi (demo hazırlığı)", "assigned", { c: 6 * HOUR, u: 6 * HOUR, target: 1 * DAY, by: REQ.zeynep, member: ME, svc: SVC.erisim }),
  ]
  // ───── Ekibim ─────
  const team = [
    row(48279, "Zeynep Acar: ikinci monitör talebi", "in_progress", { c: 1 * DAY, u: 6 * HOUR, target: 1 * DAY, by: REQ.zeynep, member: IT.cem }),
    row(48272, "Kaan Özdemir: saha ziyareti için mobil internet paketi", "assigned", { c: 2 * DAY, u: 2 * DAY, target: 1 * DAY, by: REQ.kaan, svc: SVC.mobil }),
    row(48258, "Derya Çelik: raporlama panosuna erişim", "waiting_for_customer", { c: 4 * DAY, u: 1 * DAY, by: REQ.derya, member: IT.tolga, svc: SVC.crm, team: TEAM_OPS }),
    row(48247, "Onur Polat: kulaklık ve web kamerası", "completed", { c: 8 * DAY, u: 5 * DAY, by: REQ.onur, member: IT.gokhan }),
    row(48221, "Gizem Tunç: e-posta kutusu kotası artırımı", "completed", { c: 10 * DAY, u: 8 * DAY, by: REQ.gizem, member: IT.elvan, svc: SVC.mail }),
    row(48209, "Zeynep Acar: CRM mobil uygulama kurulumu", "completed", { c: 13 * DAY, u: 11 * DAY, by: REQ.zeynep, member: IT.cem, svc: SVC.crm, team: TEAM_OPS }),
    row(48184, "Kaan Özdemir: bölge ofisi yazıcı erişimi", "in_progress", { c: 7 * DAY, u: 2 * DAY, target: -3 * HOUR, by: REQ.kaan, member: IT.tolga }),
    row(48160, "Derya Çelik: yeni sürüm Excel eklentisi", "completed", { c: 17 * DAY, u: 14 * DAY, by: REQ.derya, member: IT.gokhan, svc: SVC.lisans }),
  ]
  return { by, forMe, assigned, team }
}

const bucket = (nodes) => ({
  totalCount: nodes.length,
  nodes,
  pageInfo: { hasNextPage: false, endCursor: null },
})

const NOTE_LINES = [
  "Talebiniz alındı ve ilgili ekibe yönlendirildi.",
  "İnceleme başladı; ek bilgi gerekirse sizinle iletişime geçeceğiz.",
  "Ön kontrolü tamamladık, kurulum için uygun bir saat aralığı paylaşabilir misiniz?",
  "İşlem tamamlandı. Sorun devam ederse aynı talebe yazabilirsiniz.",
]

function notesFor(r, staff) {
  const n = 2 + (Number(r.requestId) % 3)
  const names = [IT.cem.name, IT.elvan.name, IT.tolga.name, IT.gokhan.name]
  const closed = r.status === "completed"
  const out = []
  for (let i = 0; i < n; i++) {
    out.push({
      id: `${r.requestId}-n${i + 1}`,
      text: NOTE_LINES[Math.min(i, closed && i === n - 1 ? 3 : i)],
      createdAt: ago((n - i) * 7 * HOUR + (Number(r.requestId) % 5) * HOUR),
      internal: false,
      person: { name: i === 0 ? "Servis Masası" : names[(Number(r.requestId) + i) % names.length] },
    })
  }
  if (staff) {
    out.push({
      id: `${r.requestId}-int`,
      text: "İç not: kullanıcı sürece hâkim, dönüş süresi hızlı.",
      createdAt: ago(3 * HOUR),
      internal: true,
      person: { name: IT.cem.name },
    })
  }
  return out
}

export async function handleFlows({ url, method, body }) {
  if (method === "POST" && /\/powerautomate\//.test(url.pathname)) {
    const req = parseBody(body) ?? {}
    const { by, forMe, assigned, team } = build()
    const all = [...by, ...forMe, ...assigned, ...team]
    if (req.op === "list") {
      return json({
        person: { id: 90001, name: ME.name },
        teams: [TEAM_IT.name, TEAM_OPS.name, "Satış Ekibi"],
        by: bucket(by),
        for: bucket(forMe),
        assigned: bucket(assigned),
        team: bucket(team),
      })
    }
    if (req.op === "more") return json({ page: null })
    if (req.op === "detail") {
      const request = all.find((t) => t.requestId === String(req.id))
      if (!request) return json({ error: { code: "NotFound" } }, 404)
      const staff = request.member?.id === ME.id
      return json({ staff, request, notes: notesFor(request, staff) })
    }
    if (req.op === "year") {
      const y = Number(req.year) || new Date().getFullYear()
      const k = y === new Date().getFullYear() ? 1 : y === new Date().getFullYear() - 1 ? 1.7 : 1.3
      const n = (v) => Math.round(v * k)
      return json({ closed: n(28), assigned: n(19), opened: n(34), openedClosed: n(26), teamClosed: n(61), teamAssigned: n(23) })
    }
  }
  logUnhandled("Flow", method, url)
  return json({})
}
