import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import SmartPhone01Icon from "@hugeicons/core-free-icons/SmartPhone01Icon"
import TelephoneIcon from "@hugeicons/core-free-icons/TelephoneIcon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { cn } from "@/lib/utils"
import "./personCard.css"
import "./personParts.css"

const telOf = (value) => `tel:${value.replace(/[^\d+]/g, "")}`

/**
 * Kişinin iletişim satırları ve yöneticisi (dizin profili, `usePersonProfile`): e-posta
 * (kopyala), iş ve cep telefonu (`tel:`), şirket · şehir, yöneticisi. `roomy` (bölmede): telefonlar
 * da kopyalanır, dokunmatik hedefler 44 px.
 * Kişi kartı (`PersonCard`) ve Ekibim'in kişi bölmesi paylaşır. Yalnız dizinde olan satırlar
 * çizilir: boş "Telefon —" satırı, telefonu olmadığını değil bilmediğimizi söylerdi. Profil yoksa
 * (yükleniyor, okunamadı) yalnız bilinen adres.
 *
 * `hideCompany`: şirket zaten başlıkta (Ekibim bölmesinin bilgi çipi) — satırda yalnız adres.
 *
 * `className`: iki bloğun (liste, yönetici) her birinin sınıfı. Yönetici satırını çağıran bağlar:
 * `renderManager(manager, row)` (`row(props)` satırı verilen düğme özellikleriyle çizer), yoksa
 * basınca `onManager(manager)`.
 */
export function PersonDetails({
  profile: p,
  address,
  roomy = false,
  hideCompany = false,
  onManager,
  renderManager,
  className,
}) {
  const { t, locale } = useLocale()
  const manager = p?.manager
  const row = (props) => <ManagerRow manager={manager} {...props} />
  const company = hideCompany ? null : p?.company
  return (
    <>
      {(address || p?.phones?.length || p?.mobile || company || p?.city) && (
        <ul className={cn("pc-list", className)}>
          {address && (
            <CopyRow icon={Mail01Icon} label={t("person.email")} value={address} roomy={roomy} />
          )}
          {p?.phones?.map((ph) => (
            <PhoneRow
              key={ph}
              icon={TelephoneIcon}
              label={t("person.phone")}
              value={ph}
              roomy={roomy}
            />
          ))}
          {p?.mobile && (
            <PhoneRow
              icon={SmartPhone01Icon}
              label={t("person.mobile")}
              value={p.mobile}
              roomy={roomy}
            />
          )}
          {(company || p?.city) && (
            <li className="pc-row">
              <RowIcon icon={company ? Building03Icon : Location01Icon} />
              <RowText
                label={t(company ? "person.company" : "person.address")}
                value={[company, p.city].filter(Boolean).join(" · ")}
                lang="tr"
              />
            </li>
          )}
        </ul>
      )}
      {manager && (
        <div className={cn("pc-list", className)}>
          <p lang={locale} className="pc-eyebrow">
            {t("person.manager")}
          </p>
          {renderManager
            ? renderManager(manager, row)
            : row({ onClick: () => onManager?.(manager), "data-pc-manager": "" })}
        </div>
      )}
    </>
  )
}

const RowIcon = ({ icon }) => (
  <HugeiconsIcon icon={icon} className="pc-row-ic" strokeWidth={1.8} aria-hidden="true" />
)

function RowText({ label, value, lang }) {
  const { locale } = useLocale()
  return (
    <span className="pc-row-text">
      <span className="pc-label" lang={locale}>
        {label}
      </span>
      <span className="pc-value" lang={lang}>
        {value}
      </span>
    </span>
  )
}

/** Telefon satırı: kendisi `tel:` bağlantısı; bölmede sağda kopyala düğmesi (masaüstünde arama yok). */
function PhoneRow({ icon, label, value, roomy }) {
  return (
    <li className="pc-item">
      <a href={telOf(value)} className="pc-row" data-roomy={roomy ? "" : undefined}>
        <RowIcon icon={icon} />
        <RowText label={label} value={value} />
      </a>
      {roomy && <CopyButton value={value} labelKey="person.copyPhone" roomy />}
    </li>
  )
}

/** Adres satırı: metin seçilebilir, sağdaki düğme kopyalar. */
function CopyRow({ icon, label, value, roomy }) {
  return (
    <li className="pc-item">
      <span className="pc-row" data-static="">
        <RowIcon icon={icon} />
        <RowText label={label} value={value} />
      </span>
      <CopyButton value={value} labelKey="person.copy" roomy={roomy} />
    </li>
  )
}

function CopyButton({ value, labelKey, roomy }) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Pano kapalı (izin yok) — satırın kendisi seçilebilir metin, kopyalanabilir.
    }
  }
  const label = copied ? t("person.copied") : t(labelKey)
  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        title={label}
        className="pc-copy"
        data-roomy={roomy ? "" : undefined}
        data-copied={copied ? "" : undefined}
      >
        {/* `key`: simge değişince küçük bir belirme (onay hissi). */}
        <HugeiconsIcon
          key={copied ? "ok" : "copy"}
          icon={copied ? Tick02Icon : Copy01Icon}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? t("person.copied") : ""}
      </span>
    </>
  )
}

/** Yönetici satırı; `label` verilmezse "kişi kartına geç" (kart içinde yöneticiye geçiş). */
export function ManagerRow({ manager, label, className, ...props }) {
  const { t } = useLocale()
  const photo = usePeoplePhotos(manager.address ? [manager.address] : []).get(manager.address)
  return (
    <button
      type="button"
      // Adı satırın görünen yazısı; "karta geç" ipucunda (çağıranın etiketi varsa o).
      aria-label={label}
      title={t("person.openManager", { name: manager.name })}
      {...props}
      className={cn("pc-row pc-mgr", className)}
    >
      <PersonAvatar name={manager.name} photo={photo} className="pc-mgr-avatar" />
      <span className="pc-row-text">
        <span lang="tr" className="pc-mgr-name">
          {manager.name}
        </span>
        {manager.title && (
          <span lang="tr" className="pc-mgr-title">
            {manager.title}
          </span>
        )}
      </span>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        className="pc-chev"
        strokeWidth={2}
        aria-hidden="true"
      />
    </button>
  )
}
