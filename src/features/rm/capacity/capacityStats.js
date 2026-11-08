import Analytics01Icon from "@hugeicons/core-free-icons/Analytics01Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import DashboardSpeed01Icon from "@hugeicons/core-free-icons/DashboardSpeed01Icon"
import UserWarning01Icon from "@hugeicons/core-free-icons/UserWarning01Icon"
import { num, pct } from "@/features/rm/lib/format"
import { partsOf } from "@/lib/rm/metrics"
import { fullName } from "@/features/rm/lib/peopleDirectory"

/**
 * Kapasite özetinin dört kutusu, seçili ölçüye göre. Proje doluluğu: proje kapasitesi, proje saati,
 * oranı ve aşanlar. Toplam iş yükü: mesai, iş yükü (proje + rutin), oranı ve mesaiyi aşanlar.
 * Oranın alt satırı hesabı rakamla yazar; ipucu (`hint`) neyin sayıldığını anlatır.
 */
export function capacityStats(cap, measure, { rt, locale, S, people }) {
  const load = measure === "load"
  const { a, c } = partsOf(cap.all, measure)
  const h = (n) => num(n, locale)
  const net = Math.max(0, S.dayHours - S.support - S.dev)
  return [
    {
      key: "cap",
      icon: Analytics01Icon,
      tone: "brand",
      label: rt(load ? "rm.capacity.kpi.wh" : "rm.capacity.kpi.cap"),
      value: Math.round(c),
      caption: rt("rm.capacity.kpi.hoursCap", { n: cap.people.length }),
      hint: load
        ? rt("rm.capacity.hint.wh", { dh: S.dayHours })
        : rt("rm.capacity.hint.cap", { dh: S.dayHours, sup: S.support, dev: S.dev, net }),
    },
    {
      key: "used",
      icon: Clock01Icon,
      tone: "teal",
      label: rt(load ? "rm.capacity.kpi.load" : "rm.capacity.kpi.used"),
      value: Math.round(a),
      caption: load
        ? rt("rm.capacity.kpi.loadCap", { pj: h(cap.all.pj), rut: h(cap.all.load - cap.all.pj) })
        : rt("rm.capacity.kpi.usedCap"),
      hint: rt(load ? "rm.capacity.hint.load" : "rm.capacity.hint.used"),
    },
    {
      key: "util",
      icon: DashboardSpeed01Icon,
      tone: "violet",
      label: rt(load ? "rm.capacity.kpi.utilLoad" : "rm.capacity.kpi.utilProject"),
      value: pct(cap.util, locale),
      caption: rt("rm.capacity.kpi.utilCap", { a: h(a), c: h(c) }),
      hint: rt(load ? "rm.capacity.hint.utilLoad" : "rm.capacity.hint.utilProject"),
      warn: cap.util > 1,
    },
    {
      key: "over",
      icon: UserWarning01Icon,
      tone: "pink",
      label: rt("rm.kpi.over"),
      value: cap.over.length,
      caption:
        cap.over
          .slice(0, 2)
          .map((p) => fullName(people, p.r.name))
          .join(", ") || rt("rm.capacity.overNone"),
      hint: rt(load ? "rm.capacity.hint.overLoad" : "rm.capacity.hint.overProject"),
      warn: cap.over.length > 0,
    },
  ]
}
