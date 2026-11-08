import { useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import AiMagicIcon from "@hugeicons/core-free-icons/AiMagicIcon"
import BubbleChatIcon from "@hugeicons/core-free-icons/BubbleChatIcon"
import SquareArrowExpand01Icon from "@hugeicons/core-free-icons/SquareArrowExpand01Icon"
import Video01Icon from "@hugeicons/core-free-icons/Video01Icon"
import { useFits } from "@/hooks/useFits"
import { useJoinUrl } from "@/hooks/useJoinUrl"
import { useLocale } from "@/hooks/useLocale"
import { meetingChatUrl } from "@/lib/meetingInsights"
import { openMeetingSummary } from "@/lib/summaryBus"
import { cn } from "@/lib/utils"
import { joinInTeams } from "@/lib/teamsJoin"

const icon = (glyph) => <HugeiconsIcon icon={glyph} aria-hidden="true" strokeWidth={1.8} />
const LINK = { target: "_blank", rel: "noopener noreferrer" }

/**
 * Kartın eylem satırı (eylem alanının alt sırası) — kayıt penceresinin kapsül düğmeleri: sakinler
 * baş kenarda, TEK birincil son kenarda; satır kartın iki kenarına da dayanır, ortada yüzmez.
 * Birincil saate göre el değiştirir: sürerken / 15 dk kala **Katıl**; bitmiş Teams toplantısında
 * **Özet** (Copilot'un yapay zekâ özeti, `openMeetingSummary`); öncesinde **Hazırlan** (asistanla;
 * tam adı `title`da). Ötekiler sakin: Outlook'ta aç (yalnız simge), **Sohbet** (bitmiş Teams
 * toplantısında toplantının kendi sohbeti — özet ve kayıt oraya düşer; yoksa düzenleyenle) ve
 * öncesindeki Katıl. Bitmiş toplantıya Katıl ve Hazırlan çıkmaz.
 *
 * Satır tek sıraya sığmazsa (Anasayfa'nın ve header'ın dar kartı, uzun Rusça etiketler) sakin
 * düğmeler yalnız simgeye iner, birincil etiketini tutar: yoksa birincil alt satırda yalnız
 * kalıyordu. Sığıp sığmadığı görünmez tam etiketli kopyayla ölçülür (`useFits`).
 */
export function EventActions({ event, soon, ended, iOrganize, onPrepare }) {
  const { t } = useLocale()
  const row = useRef(null)
  const ghost = useRef(null)
  // Link listede yoksa davetin gövdesinden (klasik Teams eklentisi).
  const { url: joinUrl } = useJoinUrl(event)
  const pastOnline = ended && Boolean(joinUrl)
  const meetingChat = pastOnline ? meetingChatUrl(joinUrl) : null
  const chatHref =
    meetingChat ??
    (event.organizerAddress && !iOrganize
      ? `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(event.organizerAddress)}`
      : null)
  const joinFirst = Boolean(joinUrl) && soon

  // Sıra = görünen sıra; birincil hep en sonda (hangisi olduğu saate göre değişir).
  const outlook = event.webLink && {
    key: "outlook",
    glyph: SquareArrowExpand01Icon,
    label: t("calendar.openOutlook"),
    iconOnly: true,
    props: { href: event.webLink, ...LINK, title: t("calendar.openOutlook") },
  }
  const chat = chatHref && {
    key: "chat",
    glyph: BubbleChatIcon,
    label: t("calendar.chat"),
    props: {
      href: chatHref,
      ...LINK,
      title: meetingChat ? t("myspace.rhythm.chatTitle") : undefined,
    },
  }
  const join = joinUrl &&
    !ended && {
      key: "join",
      glyph: Video01Icon,
      label: t("calendar.join"),
      primary: joinFirst,
      props: { href: joinUrl, ...LINK, onClick: (e) => joinInTeams(e, joinUrl, t) },
    }
  const prepare = !ended && {
    key: "prepare",
    glyph: AiChat02Icon,
    label: t("calendar.prepareShort"),
    primary: !joinFirst,
    props: { type: "button", onClick: onPrepare, title: t("calendar.prepare") },
  }
  const summary = pastOnline && {
    key: "summary",
    glyph: AiMagicIcon,
    label: t("calendar.summary"),
    primary: true,
    props: {
      type: "button",
      onClick: () => openMeetingSummary(joinUrl ? { ...event, joinUrl } : event),
      title: t("calendar.summaryTitle"),
    },
  }
  const items = [outlook, chat, ...(joinFirst ? [prepare, join] : [join, prepare]), summary].filter(
    Boolean,
  )
  // Kopya sıfır boylu (taşması kartı kaydırmasın): içeriği değişince yeniden ölçülsün.
  const fits = useFits(
    row,
    ghost,
    items.map((b) => `${b.key}:${b.label}:${b.primary ? 1 : 0}`).join(),
  )
  if (!items.length) return null

  const cls = (b, bare) => cn("rw-btn", b.primary && "rw-btn--primary", bare && "rw-btn--icon")
  return (
    <div ref={row} className="ev-actions">
      <div ref={ghost} aria-hidden="true" className="ev-actions-ghost">
        {items.map((b) => (
          <span key={b.key} className={cls(b, b.iconOnly)}>
            {icon(b.glyph)}
            {!b.iconOnly && b.label}
          </span>
        ))}
      </div>
      {items.map((b) => {
        const bare = b.iconOnly || (!fits && !b.primary)
        const Tag = b.props.href ? "a" : "button"
        return (
          <Tag
            key={b.key}
            {...b.props}
            // Yalnız simgeyken ad etiketten; ipucu yoksa adı gösterir.
            aria-label={bare ? b.label : undefined}
            title={b.props.title ?? (bare ? b.label : undefined)}
            className={cls(b, bare)}
          >
            {icon(b.glyph)}
            {!bare && b.label}
          </Tag>
        )
      })}
    </div>
  )
}
