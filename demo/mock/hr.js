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

const used = (p) => 4 + ((EVERYONE.indexOf(p) * 3) % 9)
export function allowanceRow(p = byMail(PERSONA.mail)) {
  const claim = 20
  const usedDays = p.mail === PERSONA.mail ? 8 : used(p)
  return {
    mserp_networkalias: p.mail,
    mserp_emplid: pnOf(p),
    mserp_id: pnOf(p),
    mserp_allowanceyearlyclaimday: claim,
    mserp_allowanceyearlyusedday: usedDays,
    mserp_allowanceyearlyremainday: claim - usedDays,
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

function leaveRow(start, end, description, status = "completed", type = "TR01") {
  const days = weekdaysBetween(start, end)
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
    mserp_noofhours: days * 8,
    mserp_description: description,
    mserp_status: s.value,
    [`mserp_status${FV}`]: s.label,
  }
}

/** Ömer'in izin kayıtları (geçmiş, yaklaşan, bekleyen). */
export function ownLeaves(now = new Date()) {
  const today = startOfDay(now)
  const a = nextWeekday(addDays(today, -120), 1)
  const b = nextWeekday(addDays(today, -55), 3)
  const c = nextWeekday(addDays(today, 24), 2)
  const d = nextWeekday(addDays(today, 52), 1)
  return [
    leaveRow(a, addDays(a, 4), "Yıllık izin"),
    leaveRow(b, addDays(b, 2), "Aile ziyareti"),
    leaveRow(c, addDays(c, 2), "Yıllık izin"),
    leaveRow(d, addDays(d, 1), "Kısa tatil", "pending"),
  ]
}

/** Ekip üyelerinin bu aydaki izinleri (Ekibim zaman çizelgesi). */
export function teamLeaves(now = new Date()) {
  const today = startOfDay(now)
  const rnd = seeded("team-leaves")
  return REPORTS.flatMap((p, i) => {
    const start = nextWeekday(addDays(today, 3 + i * 4 + Math.floor(rnd() * 3)), 1 + (i % 4))
    const len = 1 + (i % 3)
    const days = weekdaysBetween(start, addDays(start, len))
    return [
      {
        mserp_boraxoldemplid: pnOf(p),
        mserp_emplname: allCaps(p.displayName),
        mserp_allowancetypeid: "TR01",
        mserp_startdate: dvDate(start),
        mserp_enddate: dvDate(addDays(start, len)),
        mserp_noofdays: days,
        mserp_noofhours: days * 8,
        mserp_status: STATUS.completed.value,
        [`mserp_status${FV}`]: STATUS.completed.label,
      },
    ]
  })
}

/** Masraf satırları ve başlıkları (iki rapor). */
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
  const a = "HRMS-062301"
  const b = "HRMS-062344"
  return {
    lines: [
      ...lines(a, -34, [
        ["y.içi konaklama", 2850, "Ankara bayi toplantısı, 1 gece konaklama"],
        ["y.içi ulaşım", 420, "Havalimanı transferi"],
        ["y.içi yemek", 640, "Müşteri öğle yemeği"],
      ]),
      ...lines(b, -9, [
        ["y.içi yemek", 1180, "Kanal ortağı çalışma yemeği"],
        ["Taşıt Akaryakıt Gid.", 760, "Müşteri ziyareti yakıt"],
      ]),
    ],
    headers: [
      {
        mserp_expnumber: a,
        mserp_workflowstatus: 200000003,
        [`mserp_workflowstatus${FV}`]: "Approved",
        mserp_transdate: dvDate(addDays(today, -33)),
        mserp_explanation: "Ankara bayi ziyareti",
        mserp_sourcecompanyid: "TYTC",
        mserp_targetcompanyid: "TYTC",
      },
      {
        mserp_expnumber: b,
        mserp_workflowstatus: 200000001,
        [`mserp_workflowstatus${FV}`]: "Pending approval",
        mserp_transdate: dvDate(addDays(today, -8)),
        mserp_explanation: "Kanal ortağı görüşmeleri",
        mserp_sourcecompanyid: "TYTC",
        mserp_targetcompanyid: "TYTC",
      },
    ],
  }
}

export function advances(now = new Date()) {
  const today = startOfDay(now)
  return [
    {
      mserp_cashadvancenumber: "AVN-000412",
      mserp_requesteddate: dvDate(addDays(today, -41)),
      mserp_purpose: "Müşteri Ziyareti",
      mserp_location: "Ankara",
      mserp_requestedamount: 5000,
      mserp_currency: "TRY",
      mserp_note: "Bayi toplantıları için harcırah avansı",
      mserp_cashadvancestatus: 200000004,
      [`mserp_cashadvancestatus${FV}`]: "Processed for payment",
      mserp_targetcompanyid: "TYTC",
    },
  ]
}

/**
 * Kutlama listesi (doğum günü, yıl dönümü, yeni katılan): bugünden itibaren 14 gün içine dağıtılır.
 * Sunucu süzgeci uygulanmaz; uygulama her çağrıya aynı listeyi alır ve e-postaya göre birleştirir.
 */
export function roster(now = new Date()) {
  const today = startOfDay(now)
  const year = today.getFullYear()
  const spots = [
    // [kişi, doğum günü kaç gün sonra | null, kıdem günü: [kaç gün sonra, kaç yıl] | null]
    [REPORTS[0], 1, null],
    [COLLEAGUES[0], 3, [3, 6]],
    [COLLEAGUES[4], null, [4, 3]],
    [COLLEAGUES[5], 6, null],
    [COLLEAGUES[1], 9, null],
    [REPORTS[3], null, [10, 5]],
    [REPORTS[4], 12, null],
    [COLLEAGUES[3], null, [2, 0]], // yeni katılan
    [MANAGER, null, [7, 9]],
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
