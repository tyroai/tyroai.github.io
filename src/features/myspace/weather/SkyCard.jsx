import { useMemo, useRef, useState } from "react"
import { motion, useTransform } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import SunriseIcon from "@hugeicons/core-free-icons/SunriseIcon"
import SunsetIcon from "@hugeicons/core-free-icons/SunsetIcon"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { sunArc, sunTimes } from "@/lib/sun"
import { CARD_ARC } from "@/features/myspace/lib/daylightArc"
import { localDayKey } from "@/lib/weather"
import { weatherOutlook } from "@/lib/weatherOutlook"
import { cardSkyOf } from "@/lib/weatherSky"
import { weatherInsight } from "@/features/myspace/lib/weatherInsight"
import { CelebrationChips } from "./CardParty"
import { CelebrationFace } from "./CelebrationFace"
import { EstateLayer, EstateToggle } from "./EstateLayer"
import { OutlookChip } from "./OutlookChip"
import { SkyUnavailable } from "./SkyUnavailable"
import { WeatherDialog } from "./WeatherDialog"
import { WeatherFx } from "./WeatherFx"
import { CardSymbol } from "./WeatherSymbols"
import { useArcIntro } from "./useArcIntro"
import { useLineWrap } from "./useLineWrap"
import { fairSky, useEstatePref } from "./useEstatePref"
import { useMinuteClock, useOnScreen } from "./useSkyClock"
import { arcEnds, dateOfKey } from "./weatherDays"
import { OUTLOOK_IDS, weatherInsightText } from "./weatherInsightText"
import { OPTS_CARD_TIME_12, OPTS_TIME, condKey, useWeatherFormat } from "./weatherFormat"

/* ─────────────────────────────────────────────────────────────────────────
   AKIŞIM'IN HAVA KARTI — Astra'nın "Sky / Karşılama" kartı, birebir (kaynak
   `sky-weather-widget 3`; istek ve turlar docs/features/anasayfa-hava-kart.md). Görünüm
   ve gerekçeleri `skyCard.css`te (üst bölümü kaynağın kendisi).

   ⚠️ SELAMLAMA ARTIK KARTTA DEĞİL, Anasayfa'nın başında (`HomeGreeting`). Yerinde (kaynağın
   `__welcome`u, konumun üstü) HAVANIN TEK CÜMLESİ (`lib/weatherInsight`): önümüzdeki 12 saatin
   en işe yarar bilgisi — uyarı › değişim › güzel gün. Düğmenin DIŞINDA düz metin; kartın
   başlığı ekran okuyucuya "Hava durumu" (`sr-only`).
   ⚠️ HAVA ÇİZİMİ YAYIN ÜZERİNDEKİ İŞARET (`sunArc`): gündüz güneş
   doğuştan batışa, gece ay batıştan doğuşa — ikisi de çizginin başından,
   yatayda zamanla doğrusal; gece uçların etiketleri yer değiştirir. Kutup
   gününde/gecesinde işaret tepede.
   ⚠️ KARTIN TAMAMI TIKLANIR (düğmenin gerilmiş `::after`i) ve ayrıntı
   penceresini açar. Düğmenin adı görünen metnin kendisi (WCAG 2.5.3): "18°,
   Sağanak. Ayrıntılar için aç"; selamlama, konum, doğuş ve batış düğmenin
   DIŞINDA düz metin.
   ⚠️ Kapalıysa (off) KART YOK, selamlama düz hâline döner. Alınamazsa (error) kart o
   saatin göğüyle durur, ortada not + "Yeniden dene" (`SkyUnavailable`) — boş beyaz kutu
   bazı ağlarda selamlamayı tek başına bırakıyordu. Yüklenirken AYNI kutu: selamlama
   yazılı, gerisi hayalet.
   ───────────────────────────────────────────────────────────────────────── */

/* Kaynağın yıldızları (`8 + i·17 mod 85`, `18 + i·29 mod 65`); damlalar `WeatherSymbols`te. */
const CARD_STARS = Array.from({ length: 14 }, (_, i) => [
  8 + ((i * 17) % 85),
  18 + ((i * 29) % 65),
  i * -0.7,
])

// Kaynaktaki konum iğnesi (13 px) — hugeicons'ta aynı çizgi kalınlığı yok, ama
// deponun tek ikon kaynağı kuralı gereği iğne hugeicons'tan.
const PIN_STROKE = 1.7

export function SkyCard({ w, headline = true, celebration = null }) {
  const { t, locale } = useLocale()
  const f = useWeatherFormat()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const cardRef = useRef(null)
  // Cümle iki satıra kırılırsa kısa düzen (telefon) kalkar: konum satırı yayın tepesine binerdi.
  const [greetingRef, wrapped] = useLineWrap()
  const live = useOnScreen(cardRef)
  const ready = w.status === "ready"
  const failed = w.status === "error"
  // Dokunuşta basılı hâl — `:active` dokunmatikte güvenilir değil (deponun dersi).
  const [pressed, setPressed] = useState(false)
  const now = useMinuteClock()
  const c = ready ? w.forecast.current : null
  const coords = ready ? w.forecast.coords : null
  const dayKey = localDayKey(now)
  const sun = useMemo(
    () => (coords ? sunTimes(coords.lat, coords.lon, dateOfKey(dayKey)) : null),
    [coords, dayKey],
  )
  // Yaydaki yer GÜNDÜZ VE GECE: gündüz güneş doğuştan batışa,
  // gece ay batıştan doğuşa — ikisi de çizginin başından. Gece/gündüz de
  // güneşin gerçek evresinden (tahminin saatlik bayrağı batıştan sonraki
  // dakikalarda "gündüz" diyebiliyor); yay yoksa (kutup, koordinat yok)
  // tahminin bayrağı ve işaret tepede.
  const arc = useMemo(() => (coords ? sunArc(coords.lat, coords.lon, now) : null), [coords, now])
  // Hava yokken gece/gündüz yerel saatten (göğün rengi için yeter).
  const night = ready
    ? arc
      ? arc.night
      : c.night
    : failed && (now.getHours() < 7 || now.getHours() >= 19)
  // Köşk arka planı: gündüz güneşli ve parçalı bulutlu havada açık; gün batımından sonra ve öbür
  // havalarda kapalı (göz düğmesiyle değişir, seçim duruma göre saklanır); kutlamanın kendi yüzü var.
  const [estateOn, toggleEstate] = useEstatePref(ready && fairSky(c.kind, night))
  const estate = estateOn && !celebration
  const arcParam = useArcIntro(arc ? CARD_ARC.param(arc.progress) : null)
  const markAt = (axis, size) => (p) => `${(CARD_ARC.point(p ?? 0.5)[axis] / size) * 100}%`
  const markLeft = useTransform(arcParam, markAt("x", CARD_ARC.box.w))
  const markTop = useTransform(arcParam, markAt("y", CARD_ARC.box.h))
  const routeDone = useTransform(arcParam, (p) => (p == null ? "" : CARD_ARC.pathTo(p)))
  const ends = arcEnds(arc, sun, t)
  const time24 = getDateTimeFormat(locale, OPTS_TIME)
  const timeFmt = time24.resolvedOptions().hour12
    ? getDateTimeFormat(locale, OPTS_CARD_TIME_12)
    : time24
  const weather = ready ? cardSkyOf(c.kind) : failed ? "sunny" : "cloudy"
  const place = ready ? w.place.name || t("myspace.weather.here") : ""
  const cond = ready ? t(condKey(c.kind, night)) : ""
  // Şemsiye satırı: saatlik tahminden yağış ya da sert soğuma (`lib/weatherOutlook`).
  const hourly = ready ? w.forecast.hourly : null
  const outlook = useMemo(
    () => (hourly ? weatherOutlook(hourly, now.getTime()) : null),
    [hourly, now],
  )
  const insight = useMemo(
    () => (headline && hourly ? weatherInsight(hourly, now.getTime()) : null),
    [headline, hourly, now],
  )
  const line = insight ? weatherInsightText(insight, { t, timeFmt, f }) : ""
  // Cümle yağışı ya da soğumayı söylüyorsa konum satırındaki şemsiye hapı tekrar olurdu.
  const chip = insight && OUTLOOK_IDS.has(insight.id) ? null : outlook
  // Yüklenirken cümlenin yeri hayalet (selamlamanın eski davranışı: kart zıplamasın).
  const lineSlot = Boolean(line) || (headline && !ready && !failed)
  // Yerel saat yerine konumun gerçek batışı: bulut ve yağışta da gün evresi doğru kalır.
  const evening = sun?.set && Math.abs(now - sun.set) < 45 * 60 * 1000

  return (
    <>
      <div
        ref={cardRef}
        // En az boy `skyCompact.css`te (14.5rem; telefonda ve kısa ekranda 13rem).
        className="sky-weather h-auto max-w-none flex-1"
        data-weather={weather}
        data-time={night ? "night" : "day"}
        data-state={ready ? "ready" : failed ? "error" : "loading"}
        data-kind={c?.kind}
        data-live={live ? "on" : "off"}
        data-estate={estate ? "on" : undefined}
        data-estate-phase={evening ? "evening" : night ? "night" : "day"}
        data-pressed={pressed ? "" : undefined}
        data-greeting={lineSlot ? undefined : "off"}
        data-wrap={wrapped ? "" : undefined}
        data-celebration={
          celebration ? (celebration.birthday ? "birthday" : "anniversary") : undefined
        }
        aria-busy={ready || failed ? undefined : true}
        onPointerDown={ready ? (e) => e.pointerType !== "mouse" && setPressed(true) : undefined}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        {estate && <EstateLayer weather={weather} kind={c?.kind} night={night} />}
        {/* Köşk kapalıyken de yağış kartın tamamına (yalnız bulut simgesinin altına değil). */}
        {!estate && !celebration && ready && (
          <div className="sky-estate sky-estate--fx" aria-hidden="true">
            <WeatherFx weather={weather} dense />
          </div>
        )}
        <div className="sky-weather__haze" aria-hidden="true" />
        {/* Kutlama gününde ön yüz o güne ait; hava dipte tek satır, tık ayrıntıyı açar. */}
        {celebration && (
          <CelebrationFace
            celebration={celebration}
            ready={ready}
            weatherLine={ready ? `${f.temp(c.temp)} · ${cond}` : ""}
            temp={ready ? f.temp(c.temp) : ""}
            place={place}
            triggerRef={triggerRef}
            onOpen={() => setOpen(true)}
          />
        )}
        {!celebration && (
          <>
            {(ready || failed) && night && (
              <div className="sky-weather__stars" aria-hidden="true">
                {CARD_STARS.map(([x, y, d], i) => (
                  <i key={i} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} />
                ))}
              </div>
            )}
            {/* Yay + işaret kartın boyundan türeyen kutuda (`__sky`, skyCard.css). */}
            <div className="sky-weather__sky" aria-hidden="true">
              {/* Ufuk: yayın uçları — güneş/ay oraya inince ufkun altındaki kısmı
              kesilir (`__horizon`, skyCard.css). */}
              {ready && (
                <div className="sky-weather__horizon">
                  <CardSymbol
                    kind={c.kind}
                    night={night}
                    style={{ left: markLeft, top: markTop }}
                  />
                </div>
              )}
              <svg
                className="sky-weather__orbit"
                viewBox={`0 0 ${CARD_ARC.box.w} ${CARD_ARC.box.h}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path className="sky-weather__route" d={CARD_ARC.d} />
                {arc != null && <motion.path className="sky-weather__route-done" d={routeDone} />}
              </svg>
            </div>
            <div className="sky-weather__header">
              <div className="sky-weather__welcome">
                <h2 className="sr-only">{t("myspace.weather.title")}</h2>
                {lineSlot && (
                  <div className="sky-weather__greeting-row">
                    {line ? (
                      <p ref={greetingRef} className="sky-weather__greeting sky-weather__insight">
                        {line}
                      </p>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="sky-weather__skel sky-weather__insight-skel"
                      />
                    )}
                    <EstateToggle on={estateOn} onToggle={toggleEstate} />
                  </div>
                )}
                <div className="sky-weather__location">
                  {celebration && <CelebrationChips celebration={celebration} />}
                  {!failed && (
                    <HugeiconsIcon
                      icon={Location01Icon}
                      strokeWidth={PIN_STROKE}
                      aria-hidden="true"
                    />
                  )}
                  {ready ? (
                    <span className="sky-weather__place">
                      {place}
                      {w.place.approx && ` · ${t("myspace.weather.approxShort")}`}
                    </span>
                  ) : failed ? null : (
                    <span
                      aria-hidden="true"
                      className="sky-weather__skel !static inline-block h-2.5 w-20"
                    />
                  )}
                  {/* Saat konumun yanında, ikonuyla. Tarayıcının saati, dakika sınırında yürür
                  (`useMinuteClock`); yer adı uzunsa yer adı kısalır, saat değil. */}
                  <span className="sky-weather__clock">
                    <HugeiconsIcon icon={Clock01Icon} strokeWidth={PIN_STROKE} aria-hidden="true" />
                    <time dateTime={now.toISOString()}>{timeFmt.format(now)}</time>
                  </span>
                  <OutlookChip outlook={chip} timeFmt={timeFmt} f={f} stroke={PIN_STROKE} />
                </div>
                {/* Cümlesizken göz konum satırının ucunda (aynı yatay yer). */}
                {!lineSlot && <EstateToggle on={estateOn} onToggle={toggleEstate} />}
              </div>
            </div>
            <div className="sky-weather__main">
              {ready ? (
                <button
                  ref={triggerRef}
                  type="button"
                  data-weather-trigger=""
                  aria-haspopup="dialog"
                  onClick={() => setOpen(true)}
                  className="sky-weather__trigger"
                >
                  <span className="sky-weather__reading">
                    {/* Kaynağın biçimi: sayı + `<span>°</span>` (üst simge). Görünen
                    kopya gizli, ekran okuyucu "18°"yi duyar. */}
                    <span aria-hidden="true" className="sky-weather__temperature">
                      {Number.isFinite(c.temp) ? (
                        <>
                          {f.num(c.temp)}
                          <span>°</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                    <span className="sr-only">{f.temp(c.temp)}</span>
                    <span className="sky-weather__condition">
                      <span className="sr-only">, </span>
                      {cond}
                    </span>
                  </span>
                  <span className="sr-only">. {t("myspace.weather.openShort")}</span>
                </button>
              ) : failed ? (
                <SkyUnavailable onRetry={w.retry} />
              ) : (
                <span aria-hidden="true" className="sky-weather__reading">
                  <span className="sky-weather__skel !static mx-auto h-11 w-20 rounded-2xl" />
                  <span className="sky-weather__skel !static mx-auto mt-2.5 h-2.5 w-16" />
                </span>
              )}
            </div>
            {ends ? (
              <div className="sky-weather__footer">
                <div className="sky-weather__daylight">
                  {ends.map((e) => (
                    <span key={e.key} className="sky-weather__daylight-end">
                      <span className="sr-only">{e.label}: </span>
                      <HugeiconsIcon
                        icon={e.key === "rise" ? SunriseIcon : SunsetIcon}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <strong>{e.at ? timeFmt.format(e.at) : "—"}</strong>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
        {!ready && !failed && <span className="sr-only">{t("myspace.loading")}</span>}
      </div>
      {ready && (
        <WeatherDialog open={open} onOpenChange={setOpen} w={w} returnFocusRef={triggerRef} />
      )}
    </>
  )
}
