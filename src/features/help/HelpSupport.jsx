import { Link } from "react-router-dom"
import { PHOTO_CREDITS_URL } from "@/lib/photoCredits"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import BubbleChatIcon from "@hugeicons/core-free-icons/BubbleChatIcon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon"
import { PwaInstallButton } from "@/components/common/PwaInstallButton"
import { useLocale } from "@/hooks/useLocale"
import { usePageAccess } from "@/hooks/usePageAccess"
import { usePersonProfile } from "@/hooks/usePersonProfile"
import { teamsChat } from "@/lib/celebrate"
import { personTone } from "@/lib/personTone"
import { cn } from "@/lib/utils"
import { LIST_ROW as ROW, OFFSCREEN_STYLE, SUPPORT_ID, SUPPORT_PEOPLE } from "./helpContent"

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

const initialsOf = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")

/**
 * Destek — aramadan HİÇ etkilenmez: cevabı bulamayanın gideceği yer filtrelenip gizlenemez.
 * İki kişi (`SUPPORT_PEOPLE`): fotoğraf, ad ve unvan çalışma anında dizinden okunur; Graph yoksa
 * verilen ad ve renkli baş harfler. Birincil eylem Teams (kişiyle sohbet açar); posta yanında.
 * Arama sürerken aranan cümle mesaja/postaya hazır yazılır: destek "ne aradın?" diye sormasın
 * (Teams deeplink `message`, mailto `body`; kullanıcı göndermeden önce düzenler).
 */
export function HelpSupport({ query = "" }) {
  const { t } = useLocale()
  const { canOpen } = usePageAccess()
  const note = query.trim() ? t("help.support.prefill", { query: query.trim() }) : ""
  return (
    <section
      id={SUPPORT_ID}
      aria-labelledby="help-support-title"
      className="scroll-mt-28 space-y-3"
      style={OFFSCREEN_STYLE}
    >
      <div className="min-w-0">
        <h2
          id="help-support-title"
          tabIndex={-1}
          className="text-base font-semibold tracking-tight outline-none"
        >
          {t("help.sections.support")}
        </h2>
        <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
          {t("help.sections.supportSubtitle")}
        </p>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl bg-muted/40 dark:bg-white/[0.04]">
        {SUPPORT_PEOPLE.map((person) => (
          <SupportPerson key={person.address} person={person} note={note} />
        ))}
        {canOpen("/whats-new") ? (
          <li className="flex flex-col">
            <Link to="/whats-new" className={ROW}>
              <HugeiconsIcon
                icon={SparklesIcon}
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.8}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-snug">
                  {t("help.support.whatsNew.title")}
                </span>
                <span className="block truncate text-[0.8125rem] text-muted-foreground">
                  {t("help.support.whatsNew.value")}
                </span>
              </span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground/60 rtl:rotate-180"
              />
            </Link>
          </li>
        ) : null}
      </ul>
      <PwaInstallButton />
      {/* Serbest lisanslı fotoğrafların atıf listesi (`lib/photoCredits`). */}
      <p className="text-xs text-muted-foreground">
        <a
          href={PHOTO_CREDITS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm underline decoration-foreground/20 underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {t("help.support.photoCredits")}
        </a>
      </p>
    </section>
  )
}

/** Ad, unvan ve fotoğraf dizinden; yoksa verilen ad + baş harfler (renk adın kendisinden, sabit). */
function SupportPerson({ person, note }) {
  const { t } = useLocale()
  const { profile } = usePersonProfile({ address: person.address }, true)
  const name = profile?.name || person.name
  const mailto = `mailto:${person.address}${note ? `?body=${encodeURIComponent(note)}` : ""}`
  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 @2xl/help:flex-row @2xl/help:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {profile?.photo ? (
          <img src={profile.photo} alt="" className="size-11 shrink-0 rounded-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold"
            style={personTone(person.name)}
          >
            {initialsOf(person.name)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium leading-snug">{name}</span>
          <span className="block truncate text-[0.8125rem] text-muted-foreground">
            {profile?.title || person.address}
          </span>
        </span>
      </div>
      <div className="flex gap-2 @2xl/help:shrink-0">
        <a
          href={teamsChat(person.address, note)}
          target="_blank"
          rel="noreferrer"
          aria-label={t("help.support.teams.aria", { name })}
          className={cn(
            "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-fill-deep px-4 text-sm font-semibold text-brand-on-brand transition focus-visible:ring-offset-2 focus-visible:ring-offset-background @2xl/help:h-10 @2xl/help:flex-none",
            FOCUS,
          )}
        >
          <HugeiconsIcon
            icon={BubbleChatIcon}
            aria-hidden="true"
            className="size-4"
            strokeWidth={1.9}
          />
          {t("help.support.teams.title")}
        </a>
        <a
          href={mailto}
          aria-label={t("help.support.email.aria", { name })}
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground/[0.06] text-sm font-medium text-foreground transition hover:bg-foreground/[0.1] @2xl/help:h-10 @2xl/help:w-auto @2xl/help:px-4",
            FOCUS,
          )}
        >
          <HugeiconsIcon
            icon={Mail01Icon}
            aria-hidden="true"
            className="size-4"
            strokeWidth={1.9}
          />
          <span className="hidden @2xl/help:inline">{t("help.support.email.title")}</span>
        </a>
      </div>
    </li>
  )
}
