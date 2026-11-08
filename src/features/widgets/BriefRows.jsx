import { useRef } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import MailReply01Icon from "@hugeicons/core-free-icons/MailReply01Icon"
import { InsightTerm } from "@/features/myspace/InsightTerm"
import { InsightTip } from "@/features/myspace/InsightTip"
import { useFits } from "@/hooks/useFits"
import { useLocale } from "@/hooks/useLocale"
import { formatCount } from "@/lib/intl-cache"
import { OOF_SETTINGS_URL } from "@/features/widgets/lib/oofHealth"
import { requestPanel } from "@/lib/panelBus"
import { cn } from "@/lib/utils"
import { BRIEF_ICON } from "./briefIcons"
import { useNarrow } from "./useNarrow"
import { TIBOT_PATH } from "@/lib/tibotPolicy"

const TONE = {
  invites: "bg-brand/10 text-brand",
  mail: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  overdue: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  tasks: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  feed: "bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-400",
  tibot: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
  tibotWaiting: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
}
// "Ayrıca" satırında zemin yok: ikon ve sayı satırlarla aynı tonda (küçük yazıda AA için 700).
const INK = {
  invites: "text-brand",
  mail: "text-sky-700 dark:text-sky-400",
  overdue: "text-amber-700 dark:text-amber-400",
  tasks: "text-emerald-700 dark:text-emerald-400",
  feed: "text-fuchsia-700 dark:text-fuchsia-400",
  tibot: "text-violet-700 dark:text-violet-400",
  tibotWaiting: "text-violet-700 dark:text-violet-400",
}
// Eşit genişlikli haplar (sütunu doldurur): sayılar ve düğmeler alt alta hizalı.
// Dokunmatikte hap satırın boyunca basılır (32px), görünüşü aynı.
// Sığmayan kartta (içerik < 360px: telefon, mini kart) adlar kısa ("Posta"), "Ayrıca" satırı
// ikon ve sayı; en darda (< 240px) kısayol sütunu da yok — satırın kendisi ayrıntıyı açar.
// Izgara satır içi stille üç sütuna iner (yeni sınıf yok).
const COMPACT_PX = 360
const NARROW_PX = 240
// En dar kartta (liste < 180px: 1366–1440'ta mini kart) "Ayrıca:" etiketi ekran okuyucuya: üç
// ikon ve sayı ancak sığıyor.
const TINY_PX = 180
const span = (narrow, n) => (narrow ? { gridColumn: `span ${n - 1} / span ${n - 1}` } : undefined)
const ACTION =
  "relative inline-flex h-6 w-full items-center justify-center rounded-full border border-border bg-background/60 px-2 text-[0.6875rem] font-medium text-foreground/80 transition after:absolute after:inset-x-0 after:-inset-y-1 pointer-coarse:after:content-[''] hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/**
 * Brifing satırları — Anasayfa özetinin kapı davranışı: satırın etiketi ve
 * sayısı tek bir tetik; üstüne gelince (farede) ya da basınca ilk kayıtları
 * gösteren ipucu açılır, kayda basınca önizleme, dipte ilgili yer (panel,
 * To-Do, Keşfet). Sağdaki hap o işin kısayolu. "Ayrıca" satırındaki her terim
 * de aynı ipucunu açar. Izgara alt ızgaralı: sayı ve hap sütunları her
 * satırda aynı yerde. İpuçları (`tips`) kartın `useBriefTips`inden: cümledeki
 * toplantılarla aynı önizleme penceresi. `oof`: başta "otomatik yanıtın hâlâ açık" satırı
 * (`OofRow`).
 */
export function BriefRows({ shown, rest, tips: TIP, todoOpen, fresh, oof }) {
  const { t, locale } = useLocale()
  const list = useRef(null)
  const compact = useNarrow(list, COMPACT_PX)
  const narrow = useNarrow(list, NARROW_PX)
  const tiny = useNarrow(list, TINY_PX)
  const shortcut = (item) => {
    // Satırın kendi ipucunun aynısı: davet listesi koyu yüzey için tasarlandı (beyaz
    // açılır kutuda yazıları görünmüyordu); telefonda alttan panel.
    if (item.id === "invites")
      return (
        <InsightTip {...TIP.invites} side="bottom" align="end">
          <button type="button" className={ACTION}>
            {t("widgets.brief.act.invites")}
          </button>
        </InsightTip>
      )
    if (item.id === "mail")
      return (
        <button type="button" className={ACTION} onClick={() => requestPanel("mail")}>
          {t("widgets.brief.act.mail")}
        </button>
      )
    if ((item.id === "overdue" || item.id === "tasks") && todoOpen)
      return (
        <Link to="/todo" className={ACTION}>
          {t("nav.todo")}
        </Link>
      )
    if (item.id === "feed")
      return (
        <Link to="/feed" className={ACTION}>
          {t("widgets.brief.act.feed")}
        </Link>
      )
    if (item.id === "tibot" || item.id === "tibotWaiting")
      return (
        <Link to={TIBOT_PATH} className={ACTION}>
          {t("widgets.brief.act.tibot")}
        </Link>
      )
    return <span />
  }

  return (
    <ul
      ref={list}
      style={narrow ? { gridTemplateColumns: "auto minmax(0,1fr) auto" } : undefined}
      className="mt-2.5 grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(4.25rem,auto)] gap-y-1"
    >
      {oof && <OofRow narrow={narrow} />}
      {shown.map((item) => (
        <li
          key={item.id}
          style={span(narrow, 4)}
          className="col-span-4 grid h-8 grid-cols-subgrid items-center rounded-xl bg-muted/40 pe-1"
        >
          <InsightTip {...TIP[item.id]} side="bottom" align="start">
            <button
              type="button"
              className="col-span-3 grid h-full min-w-0 grid-cols-subgrid items-center gap-x-2.5 rounded-xl ps-1 pe-2.5 text-start outline-none transition-colors hover:bg-brand/[0.06] focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-brand/[0.08]"
            >
              <span className={cn("grid size-6 place-items-center rounded-lg", TONE[item.id])}>
                <HugeiconsIcon icon={BRIEF_ICON[item.id]} className="size-3.5" strokeWidth={2} />
              </span>
              <span className="min-w-0 truncate text-[0.8125rem] font-medium">
                {t(`widgets.brief.${compact ? "itemShort" : "item"}.${item.id}`)}
                {item.id === "mail" && item.important > 0 && (
                  <span className="ms-1.5 text-[0.6875rem] font-semibold text-amber-700 dark:text-amber-400">
                    {t("widgets.brief.important", { n: formatCount(locale, item.important) })}
                  </span>
                )}
                {item.id === "tibot" && item.late > 0 && (
                  <span className="ms-1.5 text-[0.6875rem] font-semibold text-red-700 dark:text-red-400">
                    {t("widgets.brief.tibotLate", { n: formatCount(locale, item.late) })}
                  </span>
                )}
                {item.id === "mail" && fresh > 0 && (
                  <span className="ms-1.5 text-[0.6875rem] font-semibold text-brand">
                    {t("widgets.brief.fresh", { n: formatCount(locale, fresh) })}
                  </span>
                )}
              </span>
              <span className="text-end text-[0.9375rem] font-semibold tabular-nums underline decoration-current/30 decoration-dotted decoration-2 underline-offset-[0.22em]">
                {formatCount(locale, item.n)}
              </span>
            </button>
          </InsightTip>
          {!narrow && <span className="ps-1">{shortcut(item)}</span>}
        </li>
      ))}
      {/* Fazlası tek satırda; her terim kendi ipucunu açar. */}
      {rest.length > 0 && (
        <AlsoRow rest={rest} tips={TIP} narrow={narrow} tiny={tiny} compact={compact} />
      )}
    </ul>
  )
}

/**
 * "Ayrıca" satırı. Adlar sığmazsa (büyük sayı, uzun dil) ikon ve sayıya iner: yazı kartın
 * kenarında yarıda kesilmez. Ölçü kopyası görünmez ve etkileşimsiz (`useFits`).
 */
function AlsoRow({ rest, tips: TIP, narrow, tiny, compact }) {
  const { t, locale } = useLocale()
  const box = useRef(null)
  const ghost = useRef(null)
  const fits = useFits(box, ghost)
  const short = compact || !fits
  return (
    <li
      ref={box}
      style={span(narrow, 4)}
      className="relative col-span-4 flex h-8 min-w-0 items-center gap-x-3 overflow-hidden rounded-xl bg-muted/40 px-2.5 text-[0.75rem] text-muted-foreground"
    >
      <span className={cn("shrink-0", tiny && "sr-only")}>{t("widgets.brief.alsoLabel")}</span>
      {/* Terimler satırlardaki gibi ikonlu ve renkli: ayraç noktası gerekmez. */}
      {rest.map((x) => (
        <span key={x.id} className="inline-flex shrink-0 items-center gap-1">
          <HugeiconsIcon
            icon={BRIEF_ICON[x.id]}
            aria-hidden="true"
            className={cn("size-3.5", INK[x.id])}
            strokeWidth={2}
          />
          <InsightTerm tone="via" {...TIP[x.id]}>
            {/* Dar kartta ikon ve sayı: ad ekran okuyucuya, ipucu dokununca. */}
            <span className={cn(short && "sr-only")}>{t(`widgets.brief.item.${x.id}`)} </span>
            <span className={cn("font-semibold tabular-nums", INK[x.id])}>
              {formatCount(locale, x.n)}
            </span>
          </InsightTerm>
        </span>
      ))}
      <span
        ref={ghost}
        aria-hidden="true"
        className="pointer-events-none invisible absolute start-0 top-0 flex h-8 w-max items-center gap-x-3 px-2.5 text-[0.75rem]"
      >
        {!tiny && <span>{t("widgets.brief.alsoLabel")}</span>}
        {rest.map((x) => (
          <span key={x.id} className="inline-flex items-center gap-1">
            <span className="size-3.5" />
            {!compact && <span>{t(`widgets.brief.item.${x.id}`)} </span>}
            <span className="font-semibold tabular-nums">{formatCount(locale, x.n)}</span>
          </span>
        ))}
      </span>
    </li>
  )
}

/**
 * Otomatik yanıt hatırlatması — satırların biçiminde, sayısız ve ipuçsuz. Kapatmak Outlook'ta
 * (yeni sekme; yazma izni istemiyoruz): hap gideceği yeri adıyla ve oklu simgeyle söyler — "To-Do"
 * hapı gibi; her dilde aynı genişlik.
 */
function OofRow({ narrow }) {
  const { t } = useLocale()
  return (
    <li
      style={span(narrow, 4)}
      className="col-span-4 grid h-8 grid-cols-subgrid items-center rounded-xl bg-muted/40 pe-1"
    >
      <span
        style={span(narrow, 3)}
        className="col-span-3 grid min-w-0 grid-cols-subgrid items-center gap-x-2.5 ps-1 pe-2.5"
      >
        <span className="grid size-6 place-items-center rounded-lg bg-background text-muted-foreground">
          <HugeiconsIcon icon={MailReply01Icon} className="size-3.5" strokeWidth={2} />
        </span>
        <span
          title={t("widgets.brief.oof")}
          className="min-w-0 truncate text-[0.8125rem] font-medium"
        >
          {t("widgets.brief.oof")}
        </span>
      </span>
      <span className="ps-1">
        <a
          href={OOF_SETTINGS_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("widgets.brief.oofHint")}
          title={t("widgets.brief.oofHint")}
          className={cn(ACTION, "gap-0.5 whitespace-nowrap")}
        >
          {t("widgets.brief.oofAction")}
          <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3" strokeWidth={2} />
        </a>
      </span>
    </li>
  )
}
