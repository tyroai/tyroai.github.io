import { useState } from "react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { InfoTip } from "@/components/common/InfoTip"
import { useLocale } from "@/hooks/useLocale"
import { countText, range } from "../../kinds"
import { ApproverRow } from "../ApproverRow"
import { IconTile } from "../field/IconTile"
import { clock, shortDay } from "./leaveText"

// Açılan toplantı listesi en çok bu kadar satır; fazlası "+n".
const MEETINGS_MAX = 5
// Dokunmatikte vuruş alanı görünmez bir kenarla büyür (satırın hizası bozulmaz).
const TOGGLE =
  "relative shrink-0 rounded text-[0.8125rem] font-semibold text-brand-ink transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-3.5"
// Açılan liste satırı: ad üstte tam genişlik, tarih altta (dar kartta ad kesilmesin).
const ITEM = "min-w-0"
const ITEM_MAIN = "truncate text-foreground/85"
const ITEM_SUB = "text-[0.75rem] tabular-nums text-muted-foreground"

/** Bir bilgi satırı: ikon kutusu · metin (+ ⓘ not, altında açılan liste) · sağda düğme. */
function Row({ icon, children, note, toggle, open, onToggle, list }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <IconTile icon={icon} size="sm" />
      <div className="min-w-0 flex-1 self-center text-[0.8125rem] leading-snug">
        <p className="font-medium">
          {children}
          {note && <InfoTip text={note} className="ms-1 align-[-0.25em]" />}
        </p>
        {open && list}
      </div>
      {toggle && (
        <button type="button" aria-expanded={open} onClick={onToggle} className={TOGGLE}>
          {toggle}
        </button>
      )}
    </div>
  )
}

/**
 * Etki kartının alt satırları: ekipten aynı günlerde izinli olanlar (yalnız Ekibim'i görebilene,
 * türsüz), aralıktaki toplantıların, yöneticin ve "Ne olacak?". Veri yoksa satır hiç çizilmez.
 */
export function ImpactRows({ impact }) {
  const { t, locale } = useLocale()
  const [team, setTeam] = useState(false)
  const [meet, setMeet] = useState(false)
  const { meetings, manager } = impact
  const people = impact.team
  const extra = meetings.length - MEETINGS_MAX
  // Gösterilecek satır yoksa bölüm hiç çizilmez ("Ne olacak?" artık alt şeridin "i"sinde).
  if (!(people.length > 0 || meetings.length > 0 || manager)) return null
  return (
    <div className="border-t border-black/[0.06] px-5 pb-2 pt-1.5 dark:border-white/[0.08]">
      <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
        {people.length > 0 && (
          <Row
            icon={UserGroupIcon}
            note={t("selfService.leave.teamNote")}
            toggle={team ? t("selfService.leave.hide") : t("selfService.leave.teamWho")}
            open={team}
            onToggle={() => setTeam((v) => !v)}
            list={
              <ul className="mt-2 space-y-1.5">
                {people.map((p) => (
                  <li key={p.key} className={ITEM}>
                    <p className={ITEM_MAIN}>{p.name}</p>
                    <p className={ITEM_SUB}>
                      {range(p.from, p.to, locale)}
                      {p.pending && ` · ${t("selfService.leave.pendingStatus")}`}
                    </p>
                  </li>
                ))}
              </ul>
            }
          >
            {countText(t, locale, "selfService.leave.team", people.length)}
          </Row>
        )}
        {meetings.length > 0 && (
          <Row
            icon={Calendar03Icon}
            toggle={meet ? t("selfService.leave.hide") : t("selfService.leave.show")}
            open={meet}
            onToggle={() => setMeet((v) => !v)}
            list={
              <ul className="mt-2 space-y-1.5">
                {meetings.slice(0, MEETINGS_MAX).map((m) => (
                  <li key={m.id} className={ITEM}>
                    <p className={ITEM_MAIN}>{m.subject || "—"}</p>
                    <p className={ITEM_SUB}>
                      {shortDay(m.start, locale)} · {clock(m.start, locale)}
                    </p>
                  </li>
                ))}
                {extra > 0 && (
                  <li className={ITEM_SUB}>{t("selfService.leave.more", { n: extra })}</li>
                )}
              </ul>
            }
          >
            {countText(t, locale, "selfService.leave.meetings", meetings.length)}
          </Row>
        )}
        {/* Yönetici: kişi düğmesi (foto · ad · unvan; basınca kişi kartı), diğer formlarla aynı. */}
        <ApproverRow manager={manager} className="py-3" />
      </div>
    </div>
  )
}
