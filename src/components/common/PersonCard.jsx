import { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import Award01Icon from "@hugeicons/core-free-icons/Award01Icon"
import BirthdayCakeIcon from "@hugeicons/core-free-icons/BirthdayCakeIcon"
import PartyIcon from "@hugeicons/core-free-icons/PartyIcon"
import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon"
import { CelebrateMenu } from "@/components/common/CelebrateMenu"
import { LazyErrorCause } from "@/components/common/LazyErrorCause"
import { PersonActions } from "@/components/common/PersonActions"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { PersonDetails } from "@/components/common/PersonDetails"
import { PersonOrgButton } from "@/components/common/PersonOrgButton"
import { useLocale } from "@/hooks/useLocale"
import { useMyIdentity } from "@/hooks/useMyCelebration"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { usePersonProfile } from "@/hooks/usePersonProfile"
import { usePresence } from "@/hooks/usePresence"
import { firstName } from "@/lib/celebrate"
import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { isMine } from "@/lib/myCelebration"
import { PERSON } from "@/lib/personDirectory"
import "./personCard.css"

/**
 * KİŞİ KARTI — Outlook'un kişi kartı gibi. Üstte foto (canlı durum noktasıyla) · ad · ünvan ·
 * departman/ofis; bağlam varsa (doğum günü, yıl dönümü, yeni katılan) tek satırda bağlam ve
 * hazır mesajla açılan Kutla; dört eylem (Sohbet · E-posta · Ara · Toplantı); iletişim satırları;
 * yönetici (basınca kart ONA geçer, Geri döner); Organizasyonda gör ve TYRO'ya sor.
 *
 * - Eylemler bağlantı, uygulama içi işlem değil (`PersonActions`); kutlama mesajı hazır gelir ama
 *   gönderilmez.
 * - Soramadık ≠ yok: dizin okunamadıysa kart çağıranın bildiğini (ad, adres) ve eylemleri yine
 *   gösterir, altında nedenini söyler.
 * - İki kullanım: `PersonPopover` bir tetiğe bağlı açılır kart (telefonda çekmece); `PersonCard`
 *   ise bir kartın İÇİNDE görünüm değiştirmek için (toplantı kartı, arama).
 * - Yöneticiye geçiş yönlü: yeni kişi sağdan girer, Geri soldan; odak Geri'ye, dönüşte yönetici
 *   satırına gider. Azaltılmış harekette yalnız solma.
 * Kurallar ve tarihçe: `docs/features/kisi-karti.md`.
 */

const KIND_ICON = { birthday: BirthdayCakeIcon, anniversary: Award01Icon, joiner: UserAdd01Icon }
const EASE = [0.23, 1, 0.32, 1]
const SWAP = {
  enter: ({ dir, reduce }) => ({ opacity: 0, x: reduce ? 0 : dir * 14 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.2, ease: EASE } },
  exit: ({ dir, reduce }) => ({
    opacity: 0,
    x: reduce ? 0 : dir * -8,
    transition: { duration: 0.09, ease: EASE },
  }),
}
const keyOf = (p) => `${p.address ?? ""}|${p.name ?? ""}`

/**
 * Kartın kendisi. `onBack` verilirse başta bir geri satırı çizilir (toplantı kartından
 * açıldığında "Toplantıya dön"). `sheet`: telefonun çekmecesinde (yüzey çekmecenin kendisi).
 */
export function PersonCard({
  person,
  context,
  extraAction,
  onBack,
  backLabel,
  onDone,
  focusBack = false,
  sheet = false,
}) {
  const { t } = useLocale()
  const reduce = useReducedMotion()
  const root = useRef(null)
  // Yöneticiye geçiş bir YIĞIN: Geri bir önceki kişiye, en baştaysa çağırana döner.
  const [stack, setStack] = useState([])
  const [dir, setDir] = useState(1)
  // Geçiş sayacı: değişince odak yeni görünümün ilk durağına taşınır.
  const [moves, setMoves] = useState(0)
  const current = stack.length ? stack[stack.length - 1] : person
  const isRoot = stack.length === 0
  const step = (next, way) => {
    setMoves((n) => n + 1)
    setDir(way)
    setStack(next)
  }
  const back = isRoot ? onBack : () => step((s) => s.slice(0, -1), -1)
  const custom = { dir, reduce }

  // Basılan satır söküldü: odak ileri geçişte Geri'ye, dönüşte yönetici satırına.
  useEffect(() => {
    if (!moves) return
    const el = root.current
    const target =
      dir > 0 ? el?.querySelector("[data-pc-back]") : el?.querySelector("[data-pc-manager]")
    ;(target ?? el?.querySelector("[data-pc-back]"))?.focus({ preventScroll: true })
    // Yalnız geçişte: yön geçişle birlikte değişir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moves])

  return (
    <div ref={root} className="pc-card" data-sheet={sheet ? "" : undefined}>
      {back && (
        <button
          type="button"
          data-pc-back=""
          // Basılan katılımcı düğmesi söküldü; odak boşa düşmesin, geri satırına gelsin.
          autoFocus={focusBack && isRoot}
          onClick={back}
          className="pc-back"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} aria-hidden="true" />
          {isRoot ? (backLabel ?? t("person.back")) : t("person.back")}
        </button>
      )}
      <div className="pc-stage">
        <AnimatePresence mode="popLayout" initial={false} custom={custom}>
          <motion.div
            // Kişi değişince iç durum (kopyalandı işareti) sıfırlansın.
            key={keyOf(current)}
            custom={custom}
            variants={SWAP}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <PersonBody
              person={current}
              context={isRoot ? context : null}
              extraAction={isRoot ? extraAction : null}
              onManager={(m) =>
                step((s) => [...s, { name: m.name, address: m.address, title: m.title }], 1)
              }
              onDone={onDone}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/** Bağlam satırı: günün ne olduğu ve hazır mesajla Kutla (kendi kartında "Senin günün"). */
function Occasion({ context, self, celebrate }) {
  const { t, locale } = useLocale()
  const id = useId()
  const sub = self ? t("person.selfDay") : context.text
  return (
    <div className="pc-ctx">
      <span className="pc-ctx-ic" aria-hidden="true">
        <HugeiconsIcon icon={KIND_ICON[context.kind] ?? PartyIcon} strokeWidth={1.8} />
      </span>
      <span id={id} lang={locale} className="pc-ctx-text">
        <span className="pc-ctx-title">{t(`person.ctx.${context.kind}`)}</span>
        {sub && <span className="pc-ctx-sub">{sub}</span>}
      </span>
      {celebrate && (
        // Kutla: Teams · Outlook · WhatsApp seçimi, üçü de hazır mesajla.
        <CelebrateMenu person={celebrate} kind={context.kind} years={context.years} align="end">
          <button
            type="button"
            title={t("person.celebrateTitle")}
            aria-describedby={id}
            className="pc-ctx-btn"
          >
            {t(
              context.kind === "joiner" ? "person.celebrate.joiner" : "myspace.help.cel.celebrate",
            )}
          </button>
        </CelebrateMenu>
      )}
    </div>
  )
}

function PersonBody({ person, context, extraAction, onManager, onDone }) {
  const { t } = useLocale()
  const res = usePersonProfile(person, true)
  const ready = res.status === PERSON.ready
  const loading = res.status === PERSON.loading
  const p = ready ? res.profile : null

  const name = p?.name || person.name || person.address || ""
  const address = p?.address || String(person.address ?? "").toLowerCase()
  const upn = p?.upn || address
  const title = p?.title ?? (ready ? null : (person.title ?? null))
  const where = [p?.department, p?.office].filter(Boolean).join(" · ")

  // Küçük foto modül önbelleğinden ANINDA (satırın avatarıyla aynı kayıt); büyüğü profil
  // gelince yerine geçer.
  const small = usePeoplePhotos(address ? [address] : [])
  const photo = p?.photo ?? small.get(address)
  const presence = usePresence(upn ? [upn] : []).get(upn)

  // Kendi kartında Kutla yok (düğme kişiye kendisiyle bir sohbet açardı): "Senin günün" yazar.
  const ids = useMyIdentity()
  const self = isMine(ids, address) || isMine(ids, upn)
  const celebrate =
    address && !self
      ? {
          name,
          address,
          upn,
          givenName: p?.givenName || firstName(name),
          mobile: p?.mobile ?? null,
        }
      : null

  function ask() {
    setPendingAsk({
      question: t("person.askPrompt", { who: address ? `${name} (${address})` : name }),
      agent: "tyroOffice",
    })
    onDone?.()
    requestOpenChat({ focusComposer: true })
  }

  const note =
    !ready && !loading
      ? res.status === PERSON.notFound
        ? t("person.notFound")
        : res.status === PERSON.ambiguous
          ? t("person.ambiguous")
          : res.status === PERSON.unauthenticated
            ? null
            : t("person.error")
      : p?.limited
        ? t("person.limited")
        : null
  const canRetry = res.status === PERSON.error || res.status === PERSON.denied

  return (
    <>
      <div className="pc-hero">
        <div className="pc-id">
          <PersonAvatar
            name={name}
            photo={photo}
            presence={presence}
            presenceLabel={presence ? t(`calendar.presence.${presence}`) : undefined}
            className="pc-avatar"
          />
          <div className="pc-who">
            <p lang="tr" className="pc-name">
              {name}
            </p>
            {loading ? (
              <span aria-hidden="true" className="ms-skeleton pc-skel" data-w="lg" />
            ) : (
              title && (
                <p lang="tr" className="pc-title">
                  {title}
                </p>
              )
            )}
            {loading ? (
              <span aria-hidden="true" className="ms-skeleton pc-skel" data-w="md" />
            ) : (
              where && (
                <p lang="tr" className="pc-where">
                  {where}
                </p>
              )
            )}
            {presence && (
              // Rengi fotoğraftaki nokta taşır; burada yalnız adı.
              <p className="pc-where pc-presence">{t(`calendar.presence.${presence}`)}</p>
            )}
          </div>
        </div>
        {context && <Occasion context={context} self={self} celebrate={celebrate} />}
      </div>

      {/* DÖRT EYLEM — adla bulunamayan kişide (adres yok) hiç çizilmez. */}
      <PersonActions address={address} upn={upn} className="pc-pad" />

      {/* İLETİŞİM ve YÖNETİCİ — yönetici satırına basınca kart ONA geçer. Okunurken iki satır
          iskelet: bilgi gelince kart zıplamasın. */}
      <PersonDetails profile={p} address={address} onManager={onManager} className="pc-block" />
      {loading && (
        <div aria-hidden="true" className="pc-block">
          <span className="ms-skeleton pc-skel" data-w="row" />
          <span className="ms-skeleton pc-skel" data-w="row" />
        </div>
      )}

      <div className="pc-foot">
        <div className="pc-foot-row">
          {extraAction && (
            <button type="button" onClick={extraAction.onClick} className="pc-btn">
              {extraAction.icon && (
                <HugeiconsIcon icon={extraAction.icon} strokeWidth={2} aria-hidden="true" />
              )}
              {extraAction.label}
            </button>
          )}
          <PersonOrgButton id={p?.id} onDone={onDone} />
          <button type="button" onClick={ask} className="pc-btn" data-tone="brand">
            <HugeiconsIcon icon={AiChat02Icon} strokeWidth={2} aria-hidden="true" />
            {t("person.ask")}
          </button>
        </div>
        {note && (
          <p className="pc-note">
            <span>{note}</span>
            {canRetry && (
              <button type="button" onClick={res.retry} className="pc-retry">
                {t("person.retry")}
              </button>
            )}
          </p>
        )}
        {canRetry && <LazyErrorCause detail={res.detail} className="mx-auto mt-1" />}
      </div>
    </>
  )
}
