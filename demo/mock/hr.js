// Sahte İK / ERP (F&O sanal tabloları, `mserp_*`): izin, masraf, avans, kutlamalar. Tarihler "bugüne"
// göre üretilir; sektör setinden bağımsızdır (aynı kişi, aynı İK kaydı).
import { PERSONA } from "../persona.js"
import { COLLEAGUES, EVERYONE, MANAGER, REPORTS, byMail } from "../org.js"
import { addDays, dvDate, isoWeekday, seeded, startOfDay, ymd } from "../time.js"

export const FV = "@OData.Community.Display.V1.FormattedValue"
export const MY_PN = "100245"

const pnOf = (p) => (p.mail === PERSONA.mail ? MY_PN : String(100300 + (EVERYONE.indexOf(p) + 1) * 7))
const allCaps = (s) => s.toLocaleUpperCase("tr")

export function workerRow(p = byMail(PERSONA.mail)) {
  return {
    mserp_userinfo_networkalias: p.mail,
    mserp_borax_oldemplid: pnOf(p),
    mserp_dirperson_name: allCaps(p.displayName),
    mserp_hcm_titleid: p.jobTitle,
    mserp_position_description: p.jobTitle,
    mserp_hcmworker_personnelnumber: pnOf(p),
  }
}

/** `d` gününden sonraki ilk `iso` hafta günü (1=Pzt). */
function nextWeekday(d, iso) {
  let x = startOfDay(d)
  while (isoWeekday(x) !== iso) x = addDays(x, 1)
  return x
}

function weekdaysBetween(start, end) {
  let n = 0
  for (let d = startOfDay(start); d <= end; d = addDays(d, 1)) if (isoWeekday(d) <= 5) n++
  return n
}

let leaveSeq = 1
const leaveId = () => `00${(leaveSeq++).toString(16).padStart(6, "0")}3e-0000-0000-84de-085001000000`

const STATUS = {
  completed: { value: 200000003, label: "Completed" },
  pending: { value: 200000001, label: "First manager approvement" },
}

function leaveRow(start, end, description, status = "completed", type = "TR01", half = false) {
  // Yarım gün izin: 0,5 gün / 4 saat (kaynak uygulama listede ve özette bunu ayrı gösterir).
  const days = half ? 0.5 : weekdaysBetween(start, end)
  const s = STATUS[status]
  return {
    mserp_boraxallowancetransselfserviceentityid: leaveId(),
    mserp_boraxoldemplid: MY_PN,
    mserp_emplname: allCaps(PERSONA.displayName),
    mserp_startdate: dvDate(start),
    mserp_enddate: dvDate(end),
    mserp_allowancetypeid: type,
    [`mserp_allowancetypeid${FV}`]: "Yıllık izin",
    mserp_noofdays: days,
    mserp_noofhours: half ? 4 : days * 8,
    mserp_description: description,
    mserp_status: s.value,
    [`mserp_status${FV}`]: s.label,
  }
}

/** Ömer'in izin kayıtları: geçen yıl, bu yıl (kullanılan), yaklaşan ve bekleyen. */
export function ownLeaves(now = new Date()) {
  const today = startOfDay(now)
  const spans = [
    // [kaç gün önce/sonra başlar, hafta günü, süre (gün sayısı - 1), açıklama, durum]
    [-400, 1, 4, "Yıllık izin", "completed"],
    [-330, 2, 2, "Yıl sonu tatili", "completed"],
    [-200, 2, 1, "Kişisel işler", "completed"],
    [-120, 1, 4, "Yıllık izin", "completed"],
    [-55, 3, 2, "Aile ziyareti", "completed"],
    [-20, 4, 0, "Doktor randevusu (yarım gün)", "completed", true],
    [10, 5, 0, "Okul toplantısı (yarım gün)", "completed", true],
    [24, 2, 2, "Yıllık izin", "completed"],
    [52, 1, 1, "Kısa tatil", "pending"],
    [95, 1, 3, "Yaz hazırlığı için izin", "pending"],
  ]
  return spans.map(([off, wd, len, text, status, half]) => {
    const start = nextWeekday(addDays(today, off), wd)
    return leaveRow(start, addDays(start, len), text, status, "TR01", Boolean(half))
  })
}

/** Bu yıl kullanılan (tamamlanmış ve geçmiş) izin günü. */
function usedThisYear(now = new Date()) {
  const today = startOfDay(now)
  return ownLeaves(now)
    .filter((r) => r.mserp_status === STATUS.completed.value)
    .filter((r) => new Date(r.mserp_enddate) <= today && new Date(r.mserp_startdate).getFullYear() === today.getFullYear())
    .reduce((n, r) => n + r.mserp_noofdays, 0)
}

const used = (p) => 4 + ((EVERYONE.indexOf(p) * 3) % 9)
export function allowanceRow(p = byMail(PERSONA.mail)) {
  const claim = 22
  const usedDays = p.mail === PERSONA.mail ? usedThisYear() : used(p)
  return {
    mserp_networkalias: p.mail,
    mserp_emplid: pnOf(p),
    mserp_id: pnOf(p),
    mserp_allowanceyearlyclaimday: claim,
    mserp_allowanceyearlyusedday: usedDays,
    mserp_allowanceyearlyremainday: claim - usedDays,
  }
}

/** Ekip üyelerinin izinleri (Ekibim zaman çizelgesi): her kişide iki kayıt. */
export function teamLeaves(now = new Date()) {
  const today = startOfDay(now)
  const rnd = seeded("team-leaves")
  return REPORTS.flatMap((p, i) =>
    [3 + i * 4 + Math.floor(rnd() * 3), 22 + i * 3 + Math.floor(rnd() * 4)].map((off, k) => {
      const start = nextWeekday(addDays(today, off), 1 + ((i + k) % 4))
      const len = 1 + ((i + k) % 3)
      const days = weekdaysBetween(start, addDays(start, len))
      return {
        mserp_boraxoldemplid: pnOf(p),
        mserp_emplname: allCaps(p.displayName),
        mserp_allowancetypeid: "TR01",
        mserp_startdate: dvDate(start),
        mserp_enddate: dvDate(addDays(start, len)),
        mserp_noofdays: days,
        mserp_noofhours: days * 8,
        mserp_status: STATUS.completed.value,
        [`mserp_status${FV}`]: STATUS.completed.label,
      }
    }),
  )
}

/** Masraf satırları ve başlıkları (dört rapor). */
export function expenses(now = new Date()) {
  const today = startOfDay(now)
  const lines = (no, d0, items) =>
    items.map(([cost, amount, text], i) => ({
      mserp_expnumber: no,
      mserp_employeexpensetrans_recid: 5637100000 + Number(no.slice(-4)) * 10 + i,
      mserp_transdate: dvDate(addDays(today, d0 + i)),
      mserp_costtype: cost,
      mserp_amount: amount,
      mserp_currency: "TRY",
      mserp_explanation: text,
      mserp_referencedataareaid: "TYTC",
      mserp_companyname: PERSONA.companyName,
    }))
  const header = (no, d0, status, label, text) => ({
    mserp_expnumber: no,
    mserp_workflowstatus: status,
    [`mserp_workflowstatus${FV}`]: label,
    mserp_transdate: dvDate(addDays(today, d0)),
    mserp_explanation: text,
    mserp_sourcecompanyid: "TYTC",
    mserp_targetcompanyid: "TYTC",
  })
  return {
    lines: [
      ...lines("HRMS-062187", -96, [
        ["y.dışı konaklama", 9420, "Dubai bayi toplantısı, 3 gece konaklama"],
        ["y.dışı ulaşım", 3150, "Uçak bileti (İstanbul–Dubai)"],
        ["y.dışı yemek", 1860, "Müşteri akşam yemekleri"],
        ["y.dışı götürü giderler", 1200, "Yurtdışı harcırah"],
      ]),
      ...lines("HRMS-062256", -58, [
        ["y.içi konaklama", 3300, "İzmir müşteri eğitimi, 2 gece"],
        ["y.içi ulaşım", 780, "Havalimanı ve şehir içi ulaşım"],
        ["y.içi yemek", 920, "Eğitim günü yemekleri"],
      ]),
      ...lines("HRMS-062301", -34, [
        ["y.içi konaklama", 2850, "Ankara bayi toplantısı, 1 gece konaklama"],
        ["y.içi ulaşım", 420, "Havalimanı transferi"],
        ["y.içi yemek", 640, "Müşteri öğle yemeği"],
      ]),
      ...lines("HRMS-062318", -22, [
        ["Ağırlama ve Konaklama Gid.", 2400, "Sektör fuarı müşteri ağırlama"],
        ["Matbaa Giderleri", 1350, "Fuar broşür ve katalog baskısı"],
        ["y.içi ulaşım", 560, "Fuar alanı ulaşım"],
      ]),
      ...lines("HRMS-062344", -9, [
        ["y.içi yemek", 1180, "Kanal ortağı çalışma yemeği"],
        ["Taşıt Akaryakıt Gid.", 760, "Müşteri ziyareti yakıt"],
      ]),
    ],
    headers: [
      header("HRMS-062187", -96, 200000003, "Approved", "Dubai bayi toplantısı"),
      header("HRMS-062256", -58, 200000003, "Approved", "İzmir müşteri eğitimi"),
      header("HRMS-062301", -33, 200000003, "Approved", "Ankara bayi ziyareti"),
      header("HRMS-062318", -22, 200000004, "Processed for payment", "Sektör fuarı"),
      header("HRMS-062344", -8, 200000001, "Pending approval", "Kanal ortağı görüşmeleri"),
    ],
  }
}

export function advances(now = new Date()) {
  const today = startOfDay(now)
  const adv = (no, d0, purpose, loc, amount, note, status, label) => ({
    mserp_cashadvancenumber: no,
    mserp_requesteddate: dvDate(addDays(today, d0)),
    mserp_purpose: purpose,
    mserp_location: loc,
    mserp_requestedamount: amount,
    mserp_currency: "TRY",
    mserp_note: note,
    mserp_cashadvancestatus: status,
    [`mserp_cashadvancestatus${FV}`]: label,
    mserp_targetcompanyid: "TYTC",
  })
  return [
    adv("AVN-000412", -41, "Müşteri Ziyareti", "Ankara", 5000, "Bayi toplantıları için harcırah avansı", 200000004, "Processed for payment"),
    adv("AVN-000398", -75, "Fuar", "İzmir", 8000, "Sektör fuarı katılım avansı", 200000004, "Processed for payment"),
    adv("AVN-000431", -6, "Müşteri Ziyareti", "Bursa", 3500, "Bölge ziyaretleri için avans", 200000001, "Pending approval"),
  ]
}

/**
 * Kutlama listesi (doğum günü, yıl dönümü, yeni katılan): bugünden itibaren 14 gün içine dağıtılır.
 * Sunucu süzgeci uygulanmaz; uygulama her çağrıya aynı listeyi alır ve e-postaya göre birleştirir.
 */
export function roster(now = new Date()) {
  const today = startOfDay(now)
  const year = today.getFullYear()
  const cast = (name) => EVERYONE.find((p) => p.displayName === name)
  const spots = [
    // [kişi, doğum günü kaç gün sonra | null, kıdem günü: [kaç gün sonra, kaç yıl] | null]
    [REPORTS[0], 0, null], // bugün doğum günü (bildirim paneli, Kutla)
    [COLLEAGUES[0], 3, [3, 6]],
    [COLLEAGUES[4], null, [4, 3]],
    [COLLEAGUES[5], 6, null],
    [COLLEAGUES[1], 9, null],
    [REPORTS[3], null, [0, 5]], // bugün iş yıl dönümü
    [REPORTS[4], 12, null],
    [COLLEAGUES[3], null, [2, 0]], // yeni katılan
    [MANAGER, null, [7, 9]],
    [cast("Tuna Erdoğan"), 2, null],
    [cast("Melis Sarıçam"), null, [5, 2]],
    [cast("Pelin Kocabaş"), 5, null],
    [cast("Barış Taşkın"), null, [8, 4]],
    [cast("Seda Önal"), 8, null],
    [cast("Cansu Bilgin"), null, [11, 1]],
    [cast("Yiğit Kaplan"), 10, null],
    [cast("Neslihan Duran"), 13, [12, 7]],
    [cast("Alper Güler"), null, [6, 8]],
    [cast("Tolga Ergin"), 4, null],
    [cast("Cem Sönmez"), null, [1, 0]], // yeni katılan
    [cast("Defne Aras"), 7, null],
  ]
  const rnd = seeded("roster")
  const rows = spots.map(([p, bd, sen]) => {
    const born = 1979 + Math.floor(rnd() * 18)
    const row = {
      mserp_name: allCaps(p.displayName),
      mserp_mail: p.mail,
      mserp_personnelnumber: pnOf(p),
      mserp_companyinfodataarea: "TYTC",
      mserp_companyname: p.companyName,
      mserp_positiondescription: p.jobTitle,
    }
    if (bd != null) {
      const d = addDays(today, bd)
      row.mserp_birthdate = `${born}-${ymd(d).slice(5)}T00:00:00Z`
    } else {
      const d = addDays(today, 30 + Math.floor(rnd() * 200))
      row.mserp_birthdate = `${born}-${ymd(d).slice(5)}T00:00:00Z`
    }
    if (sen) {
      const [off, years] = sen
      const d = addDays(today, off)
      row.mserp_senioritydate = `${year - years}-${ymd(d).slice(5)}T00:00:00Z`
    } else {
      const d = addDays(today, 60 + Math.floor(rnd() * 200))
      row.mserp_senioritydate = `${year - 2 - Math.floor(rnd() * 8)}-${ymd(d).slice(5)}T00:00:00Z`
    }
    return row
  })
  // Kendi kaydım da listede (şirket bilgisi aramaları için); doğum günü pencerenin dışında.
  const meDate = addDays(today, 120)
  rows.push({
    mserp_name: allCaps(PERSONA.displayName),
    mserp_mail: PERSONA.mail,
    mserp_personnelnumber: MY_PN,
    mserp_companyinfodataarea: "TYTC",
    mserp_companyname: PERSONA.companyName,
    mserp_positiondescription: PERSONA.jobTitle,
    mserp_birthdate: `1989-${ymd(meDate).slice(5)}T00:00:00Z`,
    mserp_senioritydate: `${year - 4}-03-14T00:00:00Z`,
  })
  return rows
}

