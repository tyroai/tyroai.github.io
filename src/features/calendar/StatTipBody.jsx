import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { useLocale } from "@/hooks/useLocale"
import { StatIcon } from "./StatFace"
import { TIP_LIMIT } from "./statsTips"

/**
 * Balondaki bir kayıt: takvim öğesi varsa düğme (ayrıntıyı açar), yoksa düz satır. Ad GÖRÜNEN
 * içerikten kurulur: başlık, görünmez virgül, sonra gün (ve saat) — "Bütçe toplantısı, Pzt 26 Eki ·
 * 09:00 – 10:00". Saat aralığı soldan sağa okunur (Arapça rakamlarda bitiş solda görünmesin).
 */
function TipEntry({ entry, onOpen }) {
  const text = (
    <span className="cal-tip-text">
      <strong data-private="">{entry.title}</strong>
      <span className="cal-sr">, </span>
      <span className="cal-tip-meta">
        {entry.meta}
        {entry.time && (
          <>
            {" · "}
            <bdo dir="ltr" className="cal-tip-time">
              {entry.time}
            </bdo>
          </>
        )}
      </span>
    </span>
  )
  if (!entry.item) return <div className="cal-tip-item">{text}</div>
  return (
    <button type="button" className="cal-tip-item" onClick={() => onOpen(entry.item)}>
      {text}
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        className="cal-ic cal-tip-go"
        strokeWidth={2}
        aria-hidden="true"
      />
    </button>
  )
}

/** Kartın dibindeki tek eylem: yeni izin talebi, Self Servis ya da tatil listesi. */
function TipFooter({ row, footer, actions, run }) {
  const { t } = useLocale()
  let action = null
  if (footer === "newLeave" && actions.newLeave) {
    action = (
      <button type="button" className="cal-btn" onClick={() => run(actions.newLeave)}>
        {t("calendar.page.tip.newLeave")}
      </button>
    )
  } else if (footer === "selfService") {
    action = (
      <Link className="cal-btn" to="/self-service">
        {t("calendar.page.table.openAll")}
      </Link>
    )
  } else if (footer === "holidays" && row.action) {
    action = (
      <button type="button" className="cal-btn" onClick={() => run(actions.holidays)}>
        {row.action}
      </button>
    )
  }
  return action && <div className="cal-tip-foot">{action}</div>
}

/**
 * Bir özet satırının kartı: başlık (satırın adı ve dönemi), varsa açıklama, en çok `TIP_LIMIT`
 * kayıt ve "+n daha" yazısı, sıfır kayıtta tek cümle, alt eylem. Masaüstünde balonun, telefonda
 * satırın altında açılan bloğun (`inline`: başlık yok, satırın kendisi başlık) ortak gövdesi.
 * `actions`: `{ open(öğe, satır), holidays(satır), newLeave?(satır) }`; `run(fn)` kartı kapatıp yeni
 * yüzeyi bir kare sonra açar ve `fn`e açan satırı verir (kapatma ve odak işi çağıranın).
 */
export function StatTipBody({ row, tip, actions, run, inline = false }) {
  const { t } = useLocale()
  const shown = tip.entries.slice(0, TIP_LIMIT)
  const more = tip.entries.length - shown.length
  return (
    <div className="cal-tip" data-tone={row.tone} data-inline={inline || undefined}>
      {!inline && (
        <header className="cal-tip-head">
          <StatIcon name={row.icon} />
          <span className="cal-tip-titles">
            <strong data-private="">{row.title}</strong>
            <span>{row.sub}</span>
          </span>
        </header>
      )}
      {tip.intro && <p className="cal-tip-intro">{tip.intro}</p>}
      {shown.length > 0 && (
        <ul className="cal-tip-list">
          {shown.map((entry) => (
            <li key={entry.key}>
              <TipEntry entry={entry} onOpen={(item) => run((el) => actions.open(item, el))} />
            </li>
          ))}
        </ul>
      )}
      {more > 0 && <p className="cal-tip-more">{t("calendar.page.moreDay", { n: more })}</p>}
      {!tip.entries.length && tip.empty && <p className="cal-tip-empty">{tip.empty}</p>}
      <TipFooter row={row} footer={tip.footer} actions={actions} run={run} />
    </div>
  )
}
