import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { StoryTip } from "../hello/HelloParts"
import { markOfferDone } from "../hello/offerDone"
import { Mark } from "./WelcomeTokens"
import { useLineDissolve } from "./useLineDissolve"
import { Offer, Row } from "./WelcomeRow"

const OFFICE = "tyroOffice"

/** Çekmecede satır kendi geçişiyle: çekmece kalkarken üstten alta sırayla dağılır. */
function DissolveLine({ progress, index, kind, children }) {
  const style = useLineDissolve(progress, index)
  return (
    <motion.div className="welcome-line" data-kind={kind} style={style}>
      {children}
    </motion.div>
  )
}

// Kartın açılışı, veri geç gelince (Emil: tek dalga, önem sırası, eşit olmayan adım): ana satır en
// çok yükselir, ikinci satır ve öneri kapsülü daha az; toplam ~360 ms.
const EASE = [0.23, 1, 0.32, 1]
const ENTER = [
  { y: 8, delay: 0, duration: 0.26 },
  { y: 6, delay: 0.045, duration: 0.25 },
  { y: 4, delay: 0.1, duration: 0.26, scale: 0.985 },
]

/** Kartta satır yerinde durur; `enter` verilirse (veri bekletildiyse) bir kez belirerek girer. */
function Line({ progress, index, kind, enter, children }) {
  const reduce = useReducedMotion()
  if (progress) {
    return (
      <DissolveLine progress={progress} index={index} kind={kind}>
        {children}
      </DissolveLine>
    )
  }
  if (enter) {
    return (
      <motion.div
        className="welcome-line"
        data-kind={kind}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: enter.y, scale: enter.scale ?? 1 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          reduce ? { duration: 0.2 } : { duration: enter.duration, delay: enter.delay, ease: EASE }
        }
      >
        {children}
      </motion.div>
    )
  }
  return (
    <div className="welcome-line" data-kind={kind}>
      {children}
    </div>
  )
}

/** Veri gelene dek satırların ve öneri kapsülünün yerini tutan sakin şekiller (yarım içerik yerine). */
function Holding() {
  return (
    <motion.div
      className="welcome-hold"
      aria-hidden="true"
      exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE } }}
    >
      <span className="welcome-hold-row">
        <i />
        <b style={{ width: "78%" }} />
      </span>
      <span className="welcome-hold-row">
        <i />
        <b style={{ width: "62%" }} />
      </span>
      <span className="welcome-hold-offer" />
    </motion.div>
  )
}

/** Satırın parçaları; `wrap(row, text, i)` verilirse vurgulu parçayı o çizer (kartta ayrıntı ipucu). */
const marked = (row, wrap) =>
  row.parts.map((p, i) =>
    !p.mark ? (
      <span key={i}>{p.text}</span>
    ) : wrap && row.tip ? (
      wrap(row, p.text, i)
    ) : (
      <Mark key={i}>{p.text}</Mark>
    ),
  )

/**
 * Karşılama kartının ve telefondaki karşılama çekmecesinin yazısı — iki ton, simgeli satırlar, küreli
 * öneri kartı; akıl ortak: satırlar durum seçiciden (`useHelloChat` › `situations`: o anki toplantı,
 * izin + gecikmiş iş, boş aralık + gecikmiş iş, Ticket, önemli posta, yaklaşan izin, günün anı…;
 * hava yalnız gerçek bir öneri varsa), öneri günün okumasından ya da brifingden (`chatOffer`:
 * davet, önemli posta, gecikmiş iş). Kartta odak önerisi günün okumasının cam ipucunu açar (Odak
 * ekle), öteki öneriler sohbeti o soruyla açar; çekmecede `onOffer` (çekmece kapanıp aynı işi yapar).
 * `progress`: çekmecenin açıklığı (satırlar sürüklenince dağılır); kartta yok. Kartta `holding`:
 * veri gelene dek satırlar yerine sakin şekiller (önce tek cümle, sonra hepsi "tak diye" olmasın);
 * `enter`: bekletildiyse satırlar ve kapsül tek dalgayla girer. `wrapMark`: kartta vurgulu yazının
 * ayrıntı ipucu (`MarkTip`); çekmecede yok (sürüklenen yüzey).
 */
export function WelcomeCardLines({
  ref,
  titleId,
  heading = true,
  story,
  rows,
  offer,
  firstName,
  onChanged,
  onOffer,
  progress = null,
  maxRows = 2,
  holding = false,
  enter = false,
  wrapMark = null,
}) {
  const { t, locale } = useLocale()
  const hello = story.hello

  let offerNode = null
  if (offer?.range) {
    const [a, b = ""] = t("insight.welcome.offer.focus", { range: "\u0000" }).split("\u0000")
    offerNode = (
      <>
        {a}
        <Mark>{offer.range}</Mark>
        {b}
      </>
    )
  } else if (offer?.text) offerNode = offer.text

  return (
    <div ref={ref} className="welcome-text" dir={locale === "ar" ? "rtl" : undefined}>
      {heading && (
        <Line progress={progress} index={0}>
          <h2 id={titleId} className="welcome-hello">
            {/* Ünlem yanındaki kelimenin renginde: ad sonda ise o da beyaz. */}
            {!firstName ? (
              `${story.heading}!`
            ) : hello[1] ? (
              <>
                {hello[0]}
                <Mark>{firstName}</Mark>
                {hello[1]}!
              </>
            ) : (
              <>
                {hello[0]}
                <Mark>{firstName}!</Mark>
              </>
            )}
          </h2>
        </Line>
      )}
      <AnimatePresence mode="popLayout" initial={false}>
        {holding && <Holding key="holding" />}
      </AnimatePresence>
      {!holding &&
        rows.slice(0, maxRows).map((row, i) => (
          <Line
            key={row.id}
            progress={progress}
            index={i + 1}
            kind="row"
            enter={enter ? ENTER[Math.min(i, 1)] : null}
          >
            {row.pearl ? (
              <Row pearl personal icon={row.pearl}>
                {marked(row, wrapMark)}
              </Row>
            ) : (
              <Row personal icon={row.icon}>
                {marked(row, wrapMark)}
              </Row>
            )}
          </Line>
        ))}
      {!holding && !rows.length && story.loading && (
        <Line progress={progress} index={1}>
          <span aria-hidden="true" className="welcome-skel" />
        </Line>
      )}
      {!holding && offerNode && (
        <Line
          progress={progress}
          index={Math.min(rows.length, maxRows) + 1}
          enter={enter ? ENTER[2] : null}
        >
          {onOffer ? (
            <Offer onClick={() => onOffer(offer)}>{offerNode}</Offer>
          ) : offer.prompt ? (
            <Offer
              onClick={() => {
                markOfferDone(offer.doneKey)
                setPendingAsk({ question: offer.prompt, agent: OFFICE })
                requestOpenChat({ focusComposer: true })
              }}
            >
              {offerNode}
            </Offer>
          ) : story.insight ? (
            <StoryTip story={story} onChanged={onChanged} side="top">
              <Offer>{offerNode}</Offer>
            </StoryTip>
          ) : (
            <Offer>{offerNode}</Offer>
          )}
        </Line>
      )}
    </div>
  )
}
