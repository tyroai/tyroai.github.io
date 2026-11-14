import "@/lib/i18n/insight"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import { useLocale } from "@/hooks/useLocale"
import { openWeatherDetail } from "@/lib/weatherDetailBus"
import { cardSkyOf } from "@/lib/weatherSky"
import { useHelloChat } from "../hello/useHelloChat"
import { useHelloStory } from "../hello/useHelloStory"
import { useWelcomeOffer } from "../hello/useWelcomeOffer"
import { condKey, useWeatherFormat } from "../weather/weatherFormat"
import { CardSymbol } from "../weather/WeatherSymbols"
import { MarkTip } from "./MarkTip"
import { useFitText } from "./useFitText"
import { useWelcomeInk } from "./useWelcomeInk"
import { WelcomeBackdrop } from "./WelcomeBackdrop"
import { WelcomeCardLines } from "./WelcomeCardLines"
import { Mark } from "./WelcomeTokens"
import { skyOf } from "./welcomeText"
import "../skyCard.css"
import "./welcome.css"
import "./welcomeCard.css"

// Kart çekmeceden küçük: yazı 17 → 11 px arasında kutuya sığar (çekmecede 19 → 15).
const FIT = { max: 17, min: 11 }
// Veri (takvim, hava, posta, To Do) en çok bu kadar beklenir; sonra ne geldiyse o gösterilir.
const HOLD_MS = 1800

/**
 * KARŞILAMA KARTI — Anasayfa'nın varsayılan ilk kartı: telefondaki karşılama çekmecesinin görünüşü
 * (paletin gradyanı, gren ve süzülen ışık — `WelcomeBackdrop`; iki tonlu büyük selamlama, simgeli
 * satırlar, küreli öneri kartı), Master kartın aklı (durum seçici ve brifingden öneri —
 * `WelcomeCardLines`). Yeni · TYRO kapsülü, avatar ve çan yok; üst sırada solda selamlama ve konum,
 * sağda canlı simge · derece ve hava (tarih ve saat Anasayfa'nın kaşında). Sürüklenmez, kapanmaz.
 * Veri Anasayfa'nın ve brifingin (`widgets/MasterGate`): ek istek yok. Satırlardaki vurgulu yazılar
 * ayrıntısını açar (`MarkTip`: toplantı kartı, işler, posta, davet, günün okuması).
 */
export function WelcomeCard({
  ctx,
  brief,
  briefTips,
  weather,
  firstName,
  celebration,
  rangeStart,
  rangeEnd,
}) {
  const { t } = useLocale()
  const titleId = useId()
  const bodyRef = useRef(null)
  const textRef = useRef(null)
  const cardRef = useRef(null)
  // Kartın kendi paleti (görünüm seçeneği) seçildiyse tonlar ondan ölçülür.
  const ink = useWelcomeInk(cardRef)
  const f = useWeatherFormat()
  const current = weather?.status === "ready" ? weather.forecast?.current : null
  const place = weather?.status === "ready" ? weather.place?.name?.split(" · ")[0] : null
  const tone = useMemo(
    () => ({
      "--welcome-base": ink.base,
      "--welcome-mark": ink.mark,
      ...Object.fromEntries((ink.stops ?? []).map((c, i) => [`--welcome-g${i}`, c])),
    }),
    [ink],
  )
  useFitText(bodyRef, textRef, FIT)
  const now = +ctx.now
  // Master kartın aklı: hikâye (hava, günün okuması, öneri), durum seçici ve brifingden öneri.
  const story = useHelloStory({
    weather,
    cal: ctx.cal,
    focus: ctx.focus,
    now,
    rangeStart,
    rangeEnd,
    celebration,
  })
  const offer = useWelcomeOffer(story, brief)
  const rows = useHelloChat(story, brief, offer)
  // Açılış (ürün sahibi: "önce tek cümle çıkıyor, sonra tak diye hepsi yükleniyor"): kaynaklar gelene
  // dek yarım içerik yerine sakin şekiller; sonra satırlar ve kapsül tek dalgayla girer. İlk çizimde
  // veri hazırsa (önbellek) beklenmez, canlanmaz — kart panoyla zaten giriyor.
  const settled = !story.loading && !brief.loading
  const [waited] = useState(() => !settled)
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    if (settled || timedOut) return undefined
    const id = setTimeout(() => setTimedOut(true), HOLD_MS)
    return () => clearTimeout(id)
  }, [settled, timedOut])
  const holding = !settled && !timedOut
  // Vurgulu yazının ayrıntısı: brifingin ipuçları (`briefTips`, kapıdan: liste, önizleme) ve
  // toplantı kartı. İpuçları verilmediyse (katalog önizlemesi) yazı düz kalır.
  const wrapMark = briefTips
    ? (row, text, i) => (
        <MarkTip
          key={i}
          tip={row.tip}
          tips={briefTips.tips}
          meetingsTip={briefTips.meetingsTip}
          story={story}
          onChanged={ctx.cal.refresh}
        >
          {text}
        </MarkTip>
      )
    : null

  return (
    <section
      ref={cardRef}
      data-widget="tyro-welcome"
      aria-labelledby={titleId}
      data-scheme={ink.scheme}
      style={tone}
      className="welcome-card"
    >
      <div className="welcome-panel welcome-card__panel">
        <WelcomeBackdrop sky={skyOf(weather?.forecast?.current)} />
        {/* Üst sıra: solda selamlama, altında konum; sağda canlı simge + derece selamlamanın ilk
            satırıyla aynı hizada, altında hava. Yağmur damlaları simgenin altına yağar: kırpılmaz. */}
        <div className="welcome-card__top">
          {/* Uzun adda selamlama bir boy küçülür: iki satıra sığsın, ad kesilmesin. */}
          <h2
            id={titleId}
            className="welcome-card__hello"
            data-long={firstName && firstName.length > 12 ? "" : undefined}
          >
            {!firstName ? (
              `${story.heading}!`
            ) : story.hello[1] ? (
              <>
                {story.hello[0]}
                <Mark>{firstName}</Mark>
                {story.hello[1]}!
              </>
            ) : (
              <>
                {story.hello[0]}
                <Mark>{firstName}!</Mark>
              </>
            )}
          </h2>
          {current && (
            <button type="button" className="welcome-card__wx" onClick={openWeatherDetail}>
              <span className="welcome-card__now">
                <span
                  aria-hidden="true"
                  className="wxd-sky welcome-card__sym"
                  data-weather={cardSkyOf(current.kind)}
                  data-time={current.night ? "night" : "day"}
                >
                  <CardSymbol
                    kind={current.kind}
                    night={current.night}
                    style={{ left: "50%", top: "50%" }}
                  />
                </span>
                <span className="welcome-card__deg">{f.temp(current.temp)}</span>
              </span>
              <span className="welcome-card__cond">{t(condKey(current.kind, current.night))}</span>
            </button>
          )}
          {place && (
            <span className="welcome-card__where" title={weather.place.name}>
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} aria-hidden="true" />
              <span>{place}</span>
            </span>
          )}
        </div>
        <div ref={bodyRef} className="welcome-body welcome-card__body" aria-busy={holding}>
          <WelcomeCardLines
            holding={holding}
            enter={waited}
            ref={textRef}
            heading={false}
            story={story}
            rows={rows}
            offer={offer}
            firstName={firstName}
            onChanged={ctx.cal.refresh}
            wrapMark={wrapMark}
          />
        </div>
      </div>
      {briefTips?.dialog}
    </section>
  )
}
