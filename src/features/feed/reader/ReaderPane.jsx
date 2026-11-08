import { useEffect, useState } from "react"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { PersonPopover } from "@/components/common/PersonPopover"
import { ReaderBody } from "@/components/common/mail/ReaderBody"
import { Recipients } from "@/components/common/mail/Recipients"
import { SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { useLocale } from "@/hooks/useLocale"
import { useMailReader } from "@/hooks/useMailReader"
import { FeedMarks } from "../FeedMarks"
import { FeedTag, ForYouTag } from "../FeedTag"
import { Attachments } from "./Attachments"
import { postStamp } from "./postStamp"

/** Komşu sayfa gövdesini bu kadar (ms) sonra ister: hızlı kaydırmada hiç istek çıkmaz. */
const BODY_DELAY = 700
/** Komşunun gömülü görselleri: ekrandaki sayfanın istekleri bitmiş olsun diye daha geç. */
const IMAGES_DELAY = 1800

/** `active` ya da ilk çizimden `ms` sonra doğru; bir kez doğru olunca kalır. */
function useWarm(active, ms) {
  const [warm, setWarm] = useState(active)
  useEffect(() => {
    if (active || warm) return undefined
    const timer = window.setTimeout(() => setWarm(true), ms)
    return () => window.clearTimeout(timer)
  }, [active, warm, ms])
  return active || warm
}

/**
 * Telefon okuyucusunun tek sayfası — X'in gönderi ayrıntısı gibi: gönderen satırı (foto · ad ·
 * zaman · kanal), konu, alıcılar, ekler; altında postanın kendisi. Sayfa TEK kaydırma: önce
 * üst bilgi kayıp gider, sonra gövde ekranın tamamını alır.
 * Gövde korumalı çerçeve, içeriği kadar uzar (`ReaderBody fit` › `FitFrame`): sayfanın TEK
 * kaydırması var. Önceki iç içe kaydırmada (sayfa + çerçeve) parmak üst bilgiyi kaydırınca hareket
 * ortada kesiliyor, uzun gönderide "aşağı inemiyorum" diye takılıyordu.
 * `active`: ekrandaki sayfa — pencerenin başlığı ve açıklaması yalnız onda (komşular `inert`).
 * Komşu sayfa gövdeyi ve görselleri kademeli, gecikmeyle önden alır; ekler yalnız ekrandakinde.
 * Üç sayfanın her şeyi birden inince posta kutusunun eşzamanlı istek sınırı aşılıyordu (429).
 * Çerçeve görseller inene dek bekler (`hold`): sonradan gelen görsel çerçeveyi baştan yükler,
 * uzun gönderide okurken kaydırma başa sıçrıyordu.
 */
export function ReaderPane({ post, photo, active }) {
  const { t, locale } = useLocale()
  const bodyWarm = useWarm(active, BODY_DELAY)
  const imagesWarm = useWarm(active, IMAGES_DELAY)
  const { body, html, waiting, failed } = useMailReader(post.id, bodyWarm, imagesWarm, {
    hold: true,
  })
  const subject = post.subject || t("feed.noSubject")
  const { stamp, full } = postStamp(post.received, locale)
  const Title = active ? SheetTitle : "h2"

  return (
    <section
      className="fr-pane"
      data-post-id={post.id}
      aria-hidden={active ? undefined : true}
      inert={!active}
    >
      <header className="fr-head">
        <PersonPopover person={{ name: post.author, address: post.address }}>
          {(trigger) => (
            <div className="fr-author">
              <button
                {...trigger}
                aria-label={t("person.openCard", { name: post.author })}
                className="fr-avatar"
              >
                <PersonAvatar name={post.author} photo={photo} className="size-10" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="fr-byline">
                  <button {...trigger} data-private="" className="fr-name">
                    {post.author}
                  </button>
                  <time
                    dateTime={post.received?.toISOString()}
                    title={full}
                    aria-hidden="true"
                    className="fr-time"
                  >
                    {stamp}
                  </time>
                </div>
                <div className="fr-tags">
                  {post.tag ? <FeedTag tag={post.tag} accent={post.accent} /> : <ForYouTag />}
                  <FeedMarks post={post} />
                </div>
              </div>
            </div>
          )}
        </PersonPopover>
        <Title data-private="" className="fr-title">
          {subject}
        </Title>
        {active && <SheetDescription className="sr-only">{full}</SheetDescription>}
        {!waiting && (
          <div className="fr-to">
            <Recipients label={t("feed.mail.to")} list={body?.to} />
            <Recipients label={t("feed.mail.cc")} list={body?.cc} />
          </div>
        )}
        {post.hasAttachments && <Attachments post={post} enabled={active} />}
      </header>

      <div className="fr-body">
        <ReaderBody
          post={post}
          body={body}
          html={html}
          waiting={waiting}
          failed={failed}
          title={subject}
          fit
          fallback={post.preview ? <p className="fr-preview">{post.preview}</p> : undefined}
        />
      </div>
    </section>
  )
}
