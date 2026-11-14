import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import TimeZoneIcon from "@hugeicons/core-free-icons/TimeZoneIcon"
import { NotchShell } from "@/components/layout/notch/NotchShell"
import { RailButton } from "@/components/layout/notch/RailButton"
import { NOTCH_SHELL_CLASS } from "@/lib/edgeNotchGeometry"
import { useEdgeNotchDesign } from "@/hooks/useEdgeNotchDesign"
import { useLocale } from "@/hooks/useLocale"
import { useWhatsNewCardStyle } from "@/hooks/useWhatsNewCardStyle"
import {
  DEFAULT_EDGE_NOTCH_DESIGN,
  EDGE_NOTCH_DESIGNS,
  writeEdgeNotchDesign,
} from "@/lib/edgeNotchDesign"
import { cn } from "@/lib/utils"
import { useRadioRoving } from "./ProfilePage/useRadioRoving"

/**
 * Tercihler → "Sağ kenar çentiği": üç kabuk, CANLI önizlemeyle.
 *
 * ⚠️ **ÖNİZLEME GERÇEK KABUKTUR, resmi değil** — `NotchShell` + `RailButton`,
 * rayın kendi bileşenleri, seçili paletle ve seçili Yenilikler kartı
 * görünümüyle. Farklı olan yalnız sayılar: Graph yerine sabit üç örnek
 * (2 · 5 · 0), ki üç hâl birden görünsün — %40 halka, tam halka, boş halka.
 *
 * ⚠️ Çerçevenin ARKA PLANI boş bırakılmadı: cam kabuğun bütün anlamı
 * arkasındakini bulanık geçirmek. Sayfayı temsil eden bir marka lekesi ve
 * birkaç metin çizgisi var; düz bir zeminde iki cam kabuk birbirinden ve
 * paletten ayırt edilemezdi.
 *
 * ⚠️ **KÖK `<button>` DEĞİL** (iç içe düğme geçersiz HTML): `RailButton` bir
 * `<button>`, iç içe düğme geçersiz HTML. Seçimi yapan düğme gerilmiş
 * kaplama; önizleme `inert` + `pointer-events-none`, DOM'da kaplamadan ÖNCE.
 */
const SCALE = 0.5 // `scale-50` ile aynı sayı; çerçeve hesabı bunu okur
/** Ray ≈ 3×76 + 2×10 + 50 dolgu = 298; +104 taşma → 402 × ölçek. */
const FRAME_H = Math.round(402 * SCALE) + 8

export function EdgeNotchDesignPicker() {
  const { t } = useLocale()
  const chosen = useEdgeNotchDesign()
  const radio = useRadioRoving(EDGE_NOTCH_DESIGNS, chosen, writeEdgeNotchDesign)
  const cardStyle = useWhatsNewCardStyle()
  const cardVariant = cardStyle === "speakinglight" ? "light" : "gravity"

  return (
    <div
      role="radiogroup"
      aria-label={t("profile.prefs.notchDesign")}
      className="grid grid-cols-3 gap-2 @[520px]/profile:gap-3"
    >
      {EDGE_NOTCH_DESIGNS.map((id, index) => {
        const selected = id === chosen
        return (
          <div
            key={id}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-xl border transition",
              selected
                ? "border-brand/50 bg-brand-soft/30 shadow-sm"
                : "border-border bg-card hover:border-brand/30 hover:bg-foreground/[0.03]",
            )}
          >
            <div
              inert
              aria-hidden="true"
              style={{ height: FRAME_H }}
              className="pointer-events-none relative overflow-hidden border-b border-border/60 bg-background"
            >
              {/* sayfayı temsil eden zemin: marka lekesi + iskelet satırlar */}
              <div className="absolute -left-6 top-3 size-28 rounded-full bg-[radial-gradient(circle_at_35%_35%,var(--brand-via),transparent_68%)] opacity-60 blur-[2px]" />
              <div className="absolute left-4 top-[22%] h-2 w-[46%] rounded bg-foreground/[0.08]" />
              <div className="absolute left-4 top-[34%] h-2 w-[62%] rounded bg-foreground/[0.06]" />
              <div className="absolute left-4 top-[46%] h-2 w-[38%] rounded bg-foreground/[0.06]" />
              <div className="absolute left-4 top-[62%] h-10 w-[58%] rounded-lg bg-[linear-gradient(135deg,var(--brand-from),var(--brand-to))] opacity-70" />
              {/* ⚠️ Ölçek `scale-50` ile, `style.transform` ile DEĞİL: Tailwind v4
                  `-translate-y-1/2`yi `translate` ÖZELLİĞİNE yazıyor; inline bir
                  `transform: translateY(-50%) scale()` onunla TOPLANIYOR ve ray
                  iki kat yukarı kayıp çerçevenin dışına çıkıyordu (ölçüldü:
                  önizlemede yalnız üçüncü düğmenin etiketi görünüyordu). */}
              <div className="absolute right-0 top-1/2 origin-right -translate-y-1/2 scale-50">
                <NotchShell
                  design={id}
                  cardVariant={cardVariant}
                  className={cn(NOTCH_SHELL_CLASS, "w-[5.625rem]")}
                >
                  <RailButton
                    icon={Mail01Icon}
                    label={t("notch.mail")}
                    count={2}
                    accent="var(--notch-hot-1)"
                    delay={0}
                    tabIndex={-1}
                  />
                  <RailButton
                    icon={CalendarAdd01Icon}
                    label={t("notch.calendar")}
                    count={5}
                    accent="var(--notch-hot-2)"
                    delay={0}
                    tabIndex={-1}
                  />
                  <RailButton
                    icon={TimeZoneIcon}
                    label={t("notch.clocks")}
                    count={0}
                    accent="var(--notch-hot-3)"
                    delay={0}
                    tabIndex={-1}
                  />
                </NotchShell>
              </div>
            </div>
            {/* Dar kapta üç küçük resim yan yana (iOS Görünüm seçicisi): ad kalır, tarif gizlenir. */}
            <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1 px-2.5 py-2 @[520px]/profile:flex-nowrap @[520px]/profile:px-3">
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[0.8125rem]",
                    // Marka mürekkebi değil: palete göre marka-yumuşak zeminde kontrast düşer.
                    selected ? "font-semibold text-foreground" : "font-medium text-foreground/80",
                  )}
                >
                  {t(`profile.prefs.notchDesign.${id}`)}
                </p>
                <p className="mt-0.5 hidden text-[0.6875rem] leading-snug text-muted-foreground @[520px]/profile:block">
                  {t(`profile.prefs.notchDesign.${id}Hint`)}
                </p>
              </div>
              {id === DEFAULT_EDGE_NOTCH_DESIGN && (
                <span className="shrink-0 rounded-full border border-border bg-muted/40 px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                  {t("profile.prefs.whatsNewCardDefault")}
                </span>
              )}
            </div>
            {/* Gerilmiş kaplama: seçimi yapan TEK düğme, önizlemeden SONRA */}
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              {...radio(id, index)}
              onClick={() => writeEdgeNotchDesign(id)}
              className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span className="sr-only">{t(`profile.prefs.notchDesign.${id}`)}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
