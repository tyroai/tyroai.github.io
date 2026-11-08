import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import { InfoTip } from "@/components/common/InfoTip"
import {
  RecordHeader,
  RecordOwner,
  RecordTag as Tag,
} from "@/components/record-window/RecordHeader"
import { useLocale } from "@/hooks/useLocale"
import { extraValue } from "@/lib/selfServiceFields"
import { day, range, tabOf } from "../../kinds"
import { StatusPill } from "../../StatusPill"
import { CopyNumber } from "../CopyNumber"
import { placeName } from "../KindFields"
import { leavePhase } from "../steps"
import { headOf } from "./headOf"

// İznin zamandaki yeri: yaklaşan marka, süren yeşil, geçmiş gri.
const PHASE_TONE = { upcoming: "brand", ongoing: "success", past: undefined }

const weekday = (d, locale) =>
  d instanceof Date ? new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d) : ""

/**
 * Kaydın başlığı: türün renkli simge kutusu, kalın başlık (masrafta raporun açıklaması, avansta
 * "İş avansı", izinde türü ve kodu), gri alt satır (kategoriler · not · açıklama) ve sakin
 * etiketler: durum, izinde zamandaki yeri, kopyalanan numara, takvimli tarih, yer; en
 * altta kaydın sahibi (fotoğraf, ad, unvan — `owner`: Self Servis profili). `note`: durumun yanında
 * ⓘ ("Bu kayıt gönderilmedi; toplamlara girmez"). `status: false`: durum aşağıdaki süreç kartında
 * (masraf ve avans) — aynı bilgi iki kez durmaz. `facts`: masrafın ayrıntıları, tarihten sonra aynı
 * satırda (`splitFacts`) — ayrı "Ayrıntılar" bölümü yerine.
 */
export function RecordHead({ record, owner = null, note = null, status = true, facts = [] }) {
  const { t, locale } = useLocale()
  const { title, sub } = headOf(record, t, locale)
  const code =
    record.kind === "leave" && record.typeCode && record.typeName !== record.typeCode
      ? record.typeCode
      : ""
  const phase = leavePhase(record)
  const when =
    record.kind === "leave"
      ? [range(record.start, record.end, locale), weekdays(record, locale)]
          .filter(Boolean)
          .join(" · ")
      : day(
          (record.kind === "expense" && extraValue(record.extra, "reportDate")) || record.date,
          locale,
        )
  return (
    <RecordHeader
      icon={tabOf(record.kind).icon}
      title={title}
      titleLang="tr"
      titleExtra={code && <span className="rw-code">{code}</span>}
      sub={sub}
      subLang="tr"
      personal
      tags={
        <>
          {status && <StatusPill status={record.status} className="rw-status" />}
          {status && note && <InfoTip text={note} className="-ms-1 size-6" />}
          {phase && <Tag tone={PHASE_TONE[phase]}>{t(`selfService.detail.phase.${phase}`)}</Tag>}
          {record.number && <CopyNumber value={record.number} className="rw-number" />}
          {when && when !== "—" && (
            <Tag icon={Calendar03Icon} plain>
              {when}
            </Tag>
          )}
          {facts.map((f) => (
            <Tag
              key={f.key}
              icon={f.icon}
              plain
              label={f.label}
              title={`${f.label}: ${f.title || f.value}`}
            >
              {f.value}
            </Tag>
          ))}
          {record.kind === "advance" && record.location && (
            <Tag icon={Location01Icon} plain title={placeName(record.location)}>
              <span lang="tr">{placeName(record.location)}</span>
            </Tag>
          )}
        </>
      }
    >
      <RecordOwner name={owner?.name} photo={owner?.photo} role={owner?.title} />
    </RecordHeader>
  )
}

function weekdays(record, locale) {
  const a = weekday(record.start, locale)
  const b = weekday(record.end, locale)
  return !record.end || record.end.toDateString() === record.start?.toDateString() || a === b
    ? a
    : `${a} – ${b}`
}
